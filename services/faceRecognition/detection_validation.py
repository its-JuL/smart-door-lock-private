"""Quality gates for MTCNN face detections."""

MIN_FACE_SCORE = 0.98
MIN_FACE_PIXELS = 80
MIN_FACE_AREA_RATIO = 0.02
MAX_FACE_AREA_RATIO = 0.80
MIN_ASPECT_RATIO = 0.45
MAX_ASPECT_RATIO = 1.80


def select_valid_face(bboxes, landmarks, image_width, image_height):
    """Return (index, None) for the best usable face or (None, reason)."""
    if bboxes is None or len(bboxes) == 0:
        return None, "no_face_detected"
    if landmarks is None or len(landmarks) != len(bboxes):
        return None, "invalid_face_landmarks"

    image_area = image_width * image_height
    candidates = []
    rejection_reason = "face_detection_rejected"
    for index, bbox in enumerate(bboxes):
        if len(bbox) < 5:
            rejection_reason = "invalid_face_bbox"
            continue
        x1, y1, x2, y2, score = map(float, bbox[:5])
        width, height = x2 - x1, y2 - y1
        if width < MIN_FACE_PIXELS or height < MIN_FACE_PIXELS:
            rejection_reason = "face_too_small"
            continue
        if score < MIN_FACE_SCORE:
            rejection_reason = "face_confidence_too_low"
            continue
        aspect_ratio = width / height
        area_ratio = (width * height) / image_area
        if not MIN_ASPECT_RATIO <= aspect_ratio <= MAX_ASPECT_RATIO:
            rejection_reason = "invalid_face_aspect_ratio"
            continue
        if not MIN_FACE_AREA_RATIO <= area_ratio <= MAX_FACE_AREA_RATIO:
            rejection_reason = "invalid_face_size"
            continue
        candidates.append((score, width * height, index))

    if not candidates:
        return None, rejection_reason
    return max(candidates)[2], None
