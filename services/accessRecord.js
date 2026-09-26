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

function buildAccessRecordData({ roomId, userId, cardId, unregisteredCard, method, isSuccess }) {
  const data = {
    authenticationMethod: normalizeAuthenticationMethod(method),
    isSuccess: Boolean(isSuccess),
  };
  if (roomId) data.roomId = roomId;
  if (userId) data.userId = userId;
  if (cardId) data.cardId = cardId;
  if (unregisteredCard) data.unregisteredCard = unregisteredCard;
  return data;
}

module.exports = { buildAccessRecordData, normalizeAuthenticationMethod };
