import sys
import unittest
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SERVICE_DIR))
from detection_validation import select_valid_face


class FaceDetectionValidationTests(unittest.TestCase):
    def test_rejects_empty_detections(self):
        face, reason = select_valid_face([], [], 640, 480)
        self.assertIsNone(face)
        self.assertEqual(reason, "no_face_detected")

    def test_rejects_tiny_detection_even_with_high_score(self):
        face, reason = select_valid_face([[10, 10, 38, 38, 0.999]], [[10] * 10], 640, 480)
        self.assertIsNone(face)
        self.assertEqual(reason, "face_too_small")

    def test_accepts_large_high_confidence_detection(self):
        face, reason = select_valid_face([[100, 80, 300, 320, 0.99]], [[1] * 10], 640, 480)
        self.assertEqual(face, 0)
        self.assertIsNone(reason)


if __name__ == "__main__":
    unittest.main()
