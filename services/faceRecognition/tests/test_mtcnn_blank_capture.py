import sys
import unittest
from pathlib import Path

import cv2
import torch

SERVICE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_DIR))
from MTCNN.MTCNN import create_mtcnn_net


class MtcnnBlankFrameTests(unittest.TestCase):
    def test_real_no_face_capture_returns_empty_arrays(self):
        image_path = SERVICE_DIR / "captures" / "20260903_173257_941527_main_esp32_01_recognize.jpg"
        image = cv2.imread(str(image_path))
        boxes, landmarks = create_mtcnn_net(
            image, 32, torch.device("cpu"),
            p_model_path="MTCNN/weights/pnet_Weights",
            r_model_path="MTCNN/weights/rnet_Weights",
            o_model_path="MTCNN/weights/onet_Weights",
        )
        self.assertEqual(len(boxes), 0)
        self.assertEqual(len(landmarks), 0)


if __name__ == "__main__":
    unittest.main()
