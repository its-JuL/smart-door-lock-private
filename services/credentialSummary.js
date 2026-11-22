/**
 * Ringkasan autentikasi milik satu user untuk halaman "Autentikasi Saya".
 *
 * Halaman ini hanya untuk dibaca (read-only): user melihat metode apa saja
 * yang sudah terdaftar untuk dirinya, di ruangan mana, dan hasil permintaan
 * akses terakhir dari metode apa pun (RFID, PIN, sidik jari, wajah).
 */

const AUTH_METHOD_LABELS = {
    RFID: "Kartu RFID",
    FINGERPRINT: "Sidik Jari",
    PIN: "PIN",
    FACE: "Wajah",
    EXIT_BUTTON: "Tombol Keluar",
    UNKNOWN: "Tidak diketahui",
};

function labelAuthenticationMethod(method) {
    return AUTH_METHOD_LABELS[method] || AUTH_METHOD_LABELS.UNKNOWN;
}

function formatDateTime(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return `${new Intl.DateTimeFormat("id", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(date)} WIB`;
}

function roomNameOf(entity) {
    return entity?.room?.name || entity?.roomName || "-";
}

function roomRuidOf(entity) {
    return entity?.room?.ruid || entity?.roomRuid || "-";
}

function buildCredentialSummary({
    cards = [],
    pins = [],
    fingerprints = [],
    faces = [],
} = {}) {
    const cardRows = cards.map((card, index) => ({
        no: index + 1,
        name: card.card_name || card.card_number || "-",
        number: card.card_number || "-",
        status:
            card.banned === true
                ? "Diblokir"
                : card.card_status === "REGISTER"
                ? "Terdaftar"
                : "Belum terdaftar",
        isRegistered: card.banned !== true && card.card_status === "REGISTER",
        rooms:
            Array.isArray(card.room) && card.room.length
                ? card.room.map((room) => room.name || room.ruid).join(", ")
                : "-",
        createdAt: formatDateTime(card.createdAt),
    }));

    const pinRows = pins.map((pin, index) => ({
        no: index + 1,
        deviceId: pin.deviceId || "-",
        room: roomNameOf(pin),
        status: pin.isActive === false ? "Nonaktif" : "Aktif",
        isActive: pin.isActive !== false,
        createdAt: formatDateTime(pin.createdAt),
    }));

    const fingerprintRows = fingerprints.map((mapping, index) => ({
        no: index + 1,
        deviceId: mapping.deviceId || "-",
        fingerId: mapping.fingerId ?? "-",
        room: roomNameOf(mapping),
        roomRuid: roomRuidOf(mapping),
        status: mapping.isActive === false ? "Nonaktif" : "Aktif",
        isActive: mapping.isActive !== false,
        createdAt: formatDateTime(mapping.createdAt),
    }));

    const faceRows = faces.map((face, index) => ({
        no: index + 1,
        room: roomNameOf(face),
        roomRuid: roomRuidOf(face),
        status: face.isActive === false ? "Nonaktif" : "Aktif",
        isActive: face.isActive !== false,
        createdAt: formatDateTime(face.createdAt),
    }));

    const summary = {
        cards: cardRows,
        pins: pinRows,
        fingerprints: fingerprintRows,
        faces: faceRows,
        counts: {
            cards: cardRows.length,
            pins: pinRows.length,
            fingerprints: fingerprintRows.length,
            faces: faceRows.length,
        },
    };

    summary.hasAny =
        summary.counts.cards +
            summary.counts.pins +
            summary.counts.fingerprints +
            summary.counts.faces >
        0;

    return summary;
}

function buildAccessHistory(records = [], limit = 20) {
    return records.slice(0, limit).map((record, index) => ({
        no: index + 1,
        method: record.authenticationMethod || "UNKNOWN",
        methodLabel: labelAuthenticationMethod(record.authenticationMethod),
        room: roomNameOf(record),
        credential:
            record.Card?.card_name ||
            record.Card?.card_number ||
            record.unregisteredCard ||
            "-",
        status: record.isSuccess ? "Berhasil" : "Ditolak",
        isSuccess: record.isSuccess === true,
        time: formatDateTime(record.createdAt),
    }));
}

module.exports = {
    AUTH_METHOD_LABELS,
    labelAuthenticationMethod,
    buildCredentialSummary,
    buildAccessHistory,
    formatDateTime,
};
