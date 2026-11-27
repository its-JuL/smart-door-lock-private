from pathlib import Path


def capture_directory(service_dir: Path) -> Path:
    """Return the Express static /capture directory."""
    return Path(service_dir).resolve().parents[1] / "capture"


def build_auth_event(device_id: str, success: bool, user_id=None, reason=None, capture_path=None) -> dict:
    payload = {
        "device_id": device_id,
        "method": "camera",
        "result": "granted" if success else "denied",
        "detail": "Face recognized" if success else (reason or "unknown_face"),
    }
    if success and user_id:
        payload["user_id"] = str(user_id)
    if capture_path:
        payload["capture_path"] = f"/capture/{Path(capture_path).name}"
    return payload


def build_registration_event(device_id: str, context: dict, success: bool, reason=None) -> dict:
    payload = {
        "device_id": device_id,
        "method": "face",
        "result": "granted" if success else "denied",
        "session_id": context.get("session_id"),
        "user_id": context.get("user_id"),
        "detail": "Face enrolled from website" if success else (reason or "Face enrollment failed"),
    }
    return {key: value for key, value in payload.items() if value is not None}
