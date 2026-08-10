import os
import sys
import json
import time
import logging
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

import cv2
import numpy as np
import torch
import paho.mqtt.client as mqtt
from torchvision import transforms as trans

from MTCNN.MTCNN import create_mtcnn_net
from utils.align_trans import Face_alignment
from face_model import MobileFaceNet
from facebank_manager import FaceBankManager

# ==================== KONFIGURASI ====================
MQTT_HOST = "103.197.188.199"
MQTT_PORT = 1883
MQTT_USERNAME = "nexaryn"
MQTT_PASSWORD = "31750321"

# ✅ TOPIK YANG BENAR
TOPIC_CAM_FRAME_META = "doorlock/+/camera/frame/meta"
TOPIC_CAM_FRAME_BIN  = "doorlock/+/camera/frame"
TOPIC_CAM_RESULT     = "doorlock/{device_id}/camera/result"

# Path model
MODEL_PATH = "Weights/MobileFace_Net"
MTCNN_P_PATH = "MTCNN/weights/pnet_Weights"
MTCNN_R_PATH = "MTCNN/weights/rnet_Weights"
MTCNN_O_PATH = "MTCNN/weights/onet_Weights"

DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
AUTH_THRESHOLD = 1.2  # L2 distance threshold

# ==================== CAPTURES ====================
SCRIPT_DIR = Path(__file__).parent
CAPTURES_DIR = SCRIPT_DIR / "captures"
CAPTURES_DIR.mkdir(exist_ok=True)

# ==================== LOGGING ====================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ==================== INISIALISASI MODEL ====================
logger.info(f"Loading models on device: {DEVICE}")

model = MobileFaceNet(512).to(DEVICE)
model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
model.eval()
logger.info("MobileFaceNet loaded successfully")

test_transform = trans.Compose([
    trans.ToTensor(),
    trans.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
])

facebank = FaceBankManager()
logger.info(f"FaceBank loaded with {len(facebank.names)} faces")

# ==================== STATE ====================
# Menyimpan meta terakhir per device_id agar tahu frame berikutnya tipe apa
# Format: { "main_esp32_01": {"type": "recognize"/"enroll"} }
pending_meta = {}


# ==================== CAPTURES ====================
def save_capture(img_bytes: bytes, device_id: str, frame_type: str) -> str:
    """Simpan frame JPEG mentah ke folder captures/"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    filename = f"{timestamp}_{device_id}_{frame_type}.jpg"
    filepath = CAPTURES_DIR / filename
    filepath.write_bytes(img_bytes)
    logger.info(f"[CAPTURE] Saved: {filepath}")
    return str(filepath)


# ==================== PROCESSING ====================
def brighten(img, gamma):
    inv = 1.0 / gamma
    lut = np.array([((i / 255.0) ** inv) * 255.0 for i in range(256)], dtype=np.uint8)
    return cv2.LUT(img, lut)

def process_face(image_bytes):
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return None, "decode_error"

        # Gamma sweep — sama persis dengan testface.py
        for gamma in [1.0, 1.6, 2.2]:
            cand = img if gamma == 1.0 else brighten(img, gamma)

            bboxes, landmarks = create_mtcnn_net(
                cand, 32, DEVICE,
                p_model_path=MTCNN_P_PATH,
                r_model_path=MTCNN_R_PATH,
                o_model_path=MTCNN_O_PATH,
            )
            if len(bboxes) == 0:
                continue  # coba gamma berikutnya

            faces = Face_alignment(cand, default_square=True, landmarks=landmarks)
            face_img = faces[0] if isinstance(faces, list) else faces

            img_tensor = test_transform(face_img).to(DEVICE).unsqueeze(0)
            with torch.no_grad():
                embedding = model(img_tensor).cpu().numpy().flatten()

            logger.info(f"[FACE] Wajah terdeteksi (gamma={gamma})")
            return embedding, None

        return None, "no_face_detected"
    except Exception as e:
        logger.error(f"Face processing error: {e}", exc_info=True)
        return None, "processing_error"

def handle_frame(client, device_id: str, frame_type: str, img_bytes: bytes):
    """Proses frame sesuai tipe (recognize / enroll)."""

    # Simpan capture
    save_capture(img_bytes, device_id, frame_type)

    # ✅ FIX: Kirim img_bytes (BUKAN img_bgr) ke process_face
    embedding, error_reason = process_face(img_bytes)

    if embedding is None:
        logger.warning(f"[{device_id}] Failed: {error_reason}")
        send_result(client, device_id, frame_type, success=False, reason=error_reason)
        return

    # === RECOGNIZE ===
    if frame_type == "recognize":
        name, score = facebank.recognize(embedding, threshold=AUTH_THRESHOLD)
        if name and name != "unknown" and name != "":
            logger.info(f"[AUTH] Recognized: {name} (dist={score:.3f})")
            send_result(client, device_id, "recognize", success=True, user=name)
        else:
            logger.info(f"[AUTH] Not recognized (dist={score:.3f})")
            send_result(client, device_id, "recognize", success=False, reason="unknown_face")

    # === ENROLL ===
    elif frame_type == "enroll":
        # ESP32 lu nggak kirim "name", jadi auto-generate
        new_user_name = f"user_{len(facebank.names):03d}"
        facebank.add_face(new_user_name, embedding)
        # add_face() udah otomatis save ke facebank.pth & names.npy
        logger.info(f"[ENROLL] Registered & Saved: {new_user_name}")
        send_result(client, device_id, "enroll", success=True)

def send_result(client, device_id: str, frame_type: str, success: bool, user=None, reason=None):
    """
    Kirim hasil ke ESP32. Format sesuai yang diharapkan firmware:
      Recognize match : {"type":"recognize","match":true,"user":"andi"}
      Recognize gagal : {"type":"recognize","match":false,"reason":"unknown_face"}
      Enroll sukses   : {"type":"enroll","saved":true}
      Enroll gagal    : {"type":"enroll","saved":false,"reason":"no_face_detected"}
    """
    topic = TOPIC_CAM_RESULT.format(device_id=device_id)

    if frame_type == "recognize":
        payload = {"type": "recognize", "match": success}
        if success and user:
            payload["user"] = user
        if not success and reason:
            payload["reason"] = reason

    elif frame_type == "enroll":
        payload = {"type": "enroll", "saved": success}
        if not success and reason:
            payload["reason"] = reason
    else:
        return

    client.publish(topic, json.dumps(payload), qos=1)
    logger.info(f"[RESULT] -> {topic} : {json.dumps(payload)}")


# ==================== MQTT CALLBACK ====================
def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        client.subscribe(TOPIC_CAM_FRAME_META, qos=1)
        client.subscribe(TOPIC_CAM_FRAME_BIN, qos=1)
        logger.info("Connected to MQTT broker")
        logger.info(f"  Subscribed: {TOPIC_CAM_FRAME_META}")
        logger.info(f"  Subscribed: {TOPIC_CAM_FRAME_BIN}")
    else:
        logger.error(f"Failed to connect, rc={reason_code}")

def on_message(client, userdata, msg):
    topic = msg.topic

    # ✅ Extract device_id dari TOPIK (bukan dari JSON)
    # Format: doorlock/<device_id>/camera/frame/meta
    parts = topic.split("/")
    device_id = parts[1] if len(parts) >= 4 else "unknown"

    # === META (JSON kecil, datang SEBELUM frame biner) ===
    if topic.endswith("/camera/frame/meta"):
        try:
            meta = json.loads(msg.payload.decode("utf-8"))
            frame_type = meta.get("type", "recognize")

            # ✅ Simpan pakai device_id dari TOPIK (main_esp32_01)
            pending_meta[device_id] = frame_type
            logger.info(f"[META] device={device_id} type={frame_type}")
        except Exception as e:
            logger.error(f"[META] Parse error: {e}")
        return

    # === FRAME BINER (JPEG mentah) ===
    if topic.endswith("/camera/frame"):
        try:
            frame_type = pending_meta.pop(device_id, "recognize")
            img_bytes = msg.payload
            logger.info(f"[FRAME] device={device_id} type={frame_type} size={len(img_bytes)} bytes")
            handle_frame(client, device_id, frame_type, img_bytes)
        except Exception as e:
            logger.error(f"[FRAME] Error: {e}", exc_info=True)

# ==================== MAIN ====================
def main():
    logger.info("=" * 50)
    logger.info("Face Recognition Service (MobileFaceNet + MTCNN)")
    logger.info(f"Captures dir: {CAPTURES_DIR}")
    logger.info("=" * 50)

    client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    client.on_connect = on_connect
    client.on_message = on_message

    # Naikkan buffer karena menerima JPEG biner (bisa 30KB+)
    client.max_inflight_messages_set(20)

    try:
        client.connect(MQTT_HOST, MQTT_PORT, keepalive=60)
        logger.info(f"Connecting to {MQTT_HOST}:{MQTT_PORT} ...")
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info("Stopped by user")
    except Exception as e:
        logger.error(f"Fatal: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()