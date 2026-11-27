const METHOD_ALIASES = {
  rfid: "RFID",
  card: "RFID",
  fingerprint: "FINGERPRINT",
  pin: "PIN",
  camera: "FACE",
  face: "FACE",
  "face recognition": "FACE",
  "exit button": "EXIT_BUTTON",
};

function normalizeAuthenticationMethod(method) {
  return METHOD_ALIASES[String(method || "").trim().toLowerCase()] || "UNKNOWN";
}

function buildAccessRecordData({
  roomId,
  deviceId,
  userId,
  cardId,
  unregisteredCard,
  method,
  isSuccess,
  detail,
  capturePath,
}) {
  const data = {
    authenticationMethod: normalizeAuthenticationMethod(method),
    isSuccess: Boolean(isSuccess),
  };
  if (roomId) data.roomId = roomId;
  if (deviceId) data.deviceId = deviceId;
  if (userId) data.userId = userId;
  if (cardId) data.cardId = cardId;
  if (unregisteredCard) data.unregisteredCard = unregisteredCard;
  if (detail) data.detail = detail;
  if (capturePath) data.capturePath = capturePath;
  return data;
}

module.exports = { buildAccessRecordData, normalizeAuthenticationMethod };
