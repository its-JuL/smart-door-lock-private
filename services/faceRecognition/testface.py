"""
TEST OFFLINE - test pipeline wajah tanpa MQTT/hardware.
Pemakaian:
    python testface.py gambar1.jpg                # test deteksi saja
    python testface.py gambar1.jpg gambar2.jpg    # deteksi + bandingkan 2 gambar
"""
import sys
import cv2
import numpy as np
import torch
from torchvision import transforms as trans

from MTCNN.MTCNN import create_mtcnn_net
from utils.align_trans import Face_alignment
from face_model import MobileFaceNet

# ==================== KONFIGURASI (sama dengan service) ====================
MODEL_PATH = "Weights/MobileFace_Net"
MTCNN_P_PATH = "MTCNN/weights/pnet_Weights"
MTCNN_R_PATH = "MTCNN/weights/rnet_Weights"
MTCNN_O_PATH = "MTCNN/weights/onet_Weights"

DEVICE = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
AUTH_THRESHOLD = 1.2  # threshold L2 kuadrat, sama dengan facebank_manager

test_transform = trans.Compose([
    trans.ToTensor(),
    trans.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5]),
])


def brighten(img, gamma):
    inv = 1.0 / gamma
    lut = np.array([((i / 255.0) ** inv) * 255.0 for i in range(256)], dtype=np.uint8)
    return cv2.LUT(img, lut)


def detect_and_embed(model, img):
    bboxes, landmarks = create_mtcnn_net(
        img, 32, DEVICE,
        p_model_path=MTCNN_P_PATH,
        r_model_path=MTCNN_R_PATH,
        o_model_path=MTCNN_O_PATH,
    )
    if len(bboxes) == 0:
        return None, 0

    faces = Face_alignment(img, default_square=True, landmarks=landmarks)
    face_img = faces[0] if isinstance(faces, list) else faces

    t = test_transform(face_img).to(DEVICE).unsqueeze(0)
    with torch.no_grad():
        emb = model(t).cpu().numpy().flatten()
    return emb, len(bboxes)


def embed_with_gamma_sweep(model, img):
    """Coba gambar asli dulu, lalu versi yang diterangkan (untuk foto gelap/backlight)."""
    for gamma in [1.0, 1.6, 2.2]:
        cand = img if gamma == 1.0 else brighten(img, gamma)
        emb, n = detect_and_embed(model, cand)
        if emb is not None:
            return emb, gamma, n
    return None, None, 0


def main():
    print(f"Device: {DEVICE}")
    model = MobileFaceNet(512).to(DEVICE)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
    model.eval()
    print("Model loaded.\n")

    paths = sys.argv[1:]
    if not paths:
        print("Pemakaian: python testface.py gambar1.jpg [gambar2.jpg]")
        sys.exit(1)

    embeddings = []
    for p in paths:
        img = cv2.imread(p)
        if img is None:
            print(f"[SKIP] Tidak bisa baca: {p}")
            continue

        emb, gamma, n = embed_with_gamma_sweep(model, img)
        if emb is None:
            print(f"[FAIL] {p} -> wajah TIDAK terdeteksi (bahkan setelah brighten)")
        else:
            print(f"[OK]   {p} -> {n} wajah, gamma={gamma}")
            embeddings.append((p, emb))

    # Bandingkan 2 gambar pertama yang sukses
    if len(embeddings) >= 2:
        e1, e2 = embeddings[0][1], embeddings[1][1]
        dist = float(np.sum((e1 - e2) ** 2))  # L2 kuadrat, sama dgn facebank_manager
        print("-" * 60)
        print(f"Gambar 1 : {embeddings[0][0]}")
        print(f"Gambar 2 : {embeddings[1][0]}")
        print(f"L2 distance : {dist:.3f}")
        print(f"Threshold   : {AUTH_THRESHOLD}")
        print("Hasil       :", "MATCH (orang sama)" if dist < AUTH_THRESHOLD else "TIDAK MATCH")


if __name__ == "__main__":
    main()