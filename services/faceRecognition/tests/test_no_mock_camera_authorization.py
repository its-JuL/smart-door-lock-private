import unittest
from pathlib import Path


class CameraAuthorizationSafetyTests(unittest.TestCase):
    def test_node_mqtt_logger_does_not_contain_mock_camera_match(self):
        source = (Path(__file__).resolve().parents[3] / "services" / "mqttLogger.js").read_text(encoding="utf-8")
        self.assertNotIn("const mockMatch = true", source)
        self.assertNotIn('mockUserId = "cuid_user_123"', source)


if __name__ == "__main__":
    unittest.main()
