const DEVICE_ID_PATTERN = /^[a-z0-9_]+$/;
const MAX_DEVICE_ID_LENGTH = 31;

function normalizeDoorDeviceId(value) {
  const deviceId = String(value || "").trim().toLowerCase();
  if (!deviceId) throw new Error("Device ID is required");
  if (deviceId.length > MAX_DEVICE_ID_LENGTH) {
    throw new Error(`Device ID must not exceed ${MAX_DEVICE_ID_LENGTH} characters`);
  }
  if (!DEVICE_ID_PATTERN.test(deviceId)) {
    throw new Error("Device ID may only contain lowercase letters, numbers, and underscores");
  }
  return deviceId;
}

function buildDeviceProvisioningData(value) {
  const doorDeviceId = normalizeDoorDeviceId(value);
  const numericSuffix = doorDeviceId.match(/(\d+)$/)?.[1];
  const cameraDeviceId = numericSuffix
    ? `esp32cam_${numericSuffix}`
    : `${doorDeviceId}_cam`;

  return {
    doorDeviceId,
    cameraDeviceId,
    mainMqttClientId: doorDeviceId,
    cameraMqttClientId: cameraDeviceId,
  };
}

module.exports = {
  MAX_DEVICE_ID_LENGTH,
  normalizeDoorDeviceId,
  buildDeviceProvisioningData,
};
