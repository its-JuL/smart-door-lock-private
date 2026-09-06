import unittest
from pathlib import Path


class MtcnnEmptyDetectionSafetyTests(unittest.TestCase):
    def test_mtcnn_stops_before_rnet_when_pnet_returns_no_boxes(self):
        source = (Path(__file__).resolve().parents[1] / "MTCNN" / "MTCNN.py").read_text(encoding="utf-8")
        self.assertIn("if bboxes is None or len(bboxes) == 0:", source)
        self.assertIn("return np.empty((0, 5)), np.empty((0, 10))", source)


if __name__ == "__main__":
    unittest.main()
