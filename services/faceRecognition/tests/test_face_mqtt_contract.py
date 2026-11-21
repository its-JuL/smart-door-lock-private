import json
import sys
import unittest
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parents[1]
if str(SERVICE_DIR) not in sys.path:
    sys.path.insert(0, str(SERVICE_DIR))

from face_mqtt_contract import build_auth_event, build_registration_event, capture_directory


class FaceMqttContractTests(unittest.TestCase):
    def test_recognition_success_builds_backend_auth_event(self):
        self.assertEqual(
            build_auth_event("main_esp32_01", success=True, user_id="user-123"),
            {
                "device_id": "main_esp32_01",
                "method": "camera",
                "result": "granted",
                "user_id": "user-123",
                "detail": "Face recognized",
            },
        )

    def test_recognition_failure_does_not_invent_user(self):
        self.assertEqual(
            build_auth_event("main_esp32_01", success=False, reason="unknown_face"),
            {
                "device_id": "main_esp32_01",
                "method": "camera",
                "result": "denied",
                "detail": "unknown_face",
            },
        )

    def test_enrollment_event_keeps_web_session_and_user(self):
        context = {"session_id": "face-session", "user_id": "user-123"}
        self.assertEqual(
            build_registration_event("main_esp32_01", context, success=True),
            {
                "device_id": "main_esp32_01",
                "method": "face",
                "result": "granted",
                "session_id": "face-session",
                "user_id": "user-123",
                "detail": "Face enrolled from website",
            },
        )

    def test_capture_directory_is_the_web_static_capture_directory(self):
        project_root = SERVICE_DIR.parents[1]
        self.assertEqual(capture_directory(SERVICE_DIR), project_root / "capture")


if __name__ == "__main__":
    unittest.main()
