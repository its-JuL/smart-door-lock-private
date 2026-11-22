const ADMIN_ROLES = new Set(["ADMIN"]);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function createAccessScope({ userId, roleName, buildings = [] }) {
  if (ADMIN_ROLES.has(roleName)) {
    return {
      type: "ALL",
      userId,
      roleName,
      buildingIds: [],
      roomIds: [],
      roomRuids: [],
      deviceIds: [],
    };
  }

  if (roleName === "OPERATOR") {
    const rooms = buildings.flatMap((building) => building.rooms || []);
    return {
      type: "ASSIGNED",
      userId,
      roleName,
      buildingIds: unique(buildings.map((building) => building.id)),
      roomIds: unique(rooms.map((room) => room.id)),
      roomRuids: unique(rooms.map((room) => room.ruid)),
      deviceIds: unique(rooms.map((room) => room.device?.device_id)),
    };
  }

  if (roleName === "USER") {
    return {
      type: "OWN",
      userId,
      roleName,
      buildingIds: [],
      roomIds: [],
      roomRuids: [],
      deviceIds: [],
    };
  }

  return {
    type: "NONE",
    userId,
    roleName,
    buildingIds: [],
    roomIds: [],
    roomRuids: [],
    deviceIds: [],
  };
}

function canAccessDevice(scope, deviceId) {
  if (!scope || !deviceId) return false;
  return scope.type === "ALL" ||
    (scope.type === "ASSIGNED" && scope.deviceIds.includes(deviceId));
}

function canAccessRoom(scope, room = {}) {
  if (!scope) return false;
  if (scope.type === "ALL") return true;
  if (scope.type !== "ASSIGNED") return false;
  return Boolean(
    (room.id && scope.roomIds.includes(room.id)) ||
    (room.ruid && scope.roomRuids.includes(room.ruid))
  );
}

function canAccessCard(scope, card = {}) {
  if (!scope) return false;
  if (scope.type === "ALL") return true;
  if (scope.type !== "ASSIGNED") return false;
  return (card.room || []).some((room) => canAccessRoom(scope, room));
}

function deviceWhereForScope(scope, requestedDeviceId) {
  if (scope?.type === "ALL") {
    return requestedDeviceId ? { deviceId: requestedDeviceId } : {};
  }

  const deviceIds = scope?.type === "ASSIGNED" ? scope.deviceIds : [];
  if (requestedDeviceId) {
    return deviceIds.includes(requestedDeviceId)
      ? { deviceId: requestedDeviceId }
      : { deviceId: { in: [] } };
  }
  return { deviceId: { in: deviceIds } };
}

function roomWhereForScope(scope) {
  if (scope?.type === "ALL") return {};
  return {
    id: {
      in: scope?.type === "ASSIGNED" ? scope.roomIds : [],
    },
  };
}

function cardWhereForScope(scope) {
  if (scope?.type === "ALL") return {};
  return {
    room: {
      some: roomWhereForScope(scope),
    },
  };
}

function filterDevicesForScope(devices, scope) {
  if (!Array.isArray(devices)) return [];
  if (scope?.type !== "ASSIGNED") return devices;
  const allowedRoomIds = new Set(scope.roomIds || []);
  return devices.filter(
    (device) => device && device.roomId && allowedRoomIds.has(device.roomId)
  );
}

module.exports = {
  createAccessScope,
  canAccessDevice,
  canAccessRoom,
  canAccessCard,
  deviceWhereForScope,
  roomWhereForScope,
  cardWhereForScope,
  filterDevicesForScope,
};
