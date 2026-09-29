(() => {
  const form = document.querySelector('#rfid-enroll-form');
  if (!form) return;

  const notify = (theme, title, desc) => {
    if (window.showToast) return window.showToast({ theme, title, desc });
    window.alert(`${title}: ${desc}`);
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const submitButton = currentForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton?.textContent;
    if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Mengirim perintah...'; }

    try {
      const response = await fetch('/api/v1/card/initiate-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(currentForm)))
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || body.title || 'Permintaan gagal');
      notify('success', 'Enroll RFID dimulai', `Session ${body.data.sessionId}. Tempelkan kartu RFID pada reader.`);
    } catch (error) {
      notify('danger', 'Gagal memulai enroll RFID', error.message);
    } finally {
      if (submitButton) { submitButton.disabled = false; submitButton.textContent = originalLabel; }
    }
  });

  const syncForm = document.querySelector('#rfid-sync-form');
  syncForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/v1/card/sync-existing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(syncForm))),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Permintaan gagal');
      const card = body.data;
      notify('success', 'RFID disinkronkan', `UID ${card.cardNumber} dipetakan ke ${card.username}. Hardware tidak diubah.`);
      syncForm.reset();
      const device = syncForm.querySelector('[name="deviceId"]');
      if (device) device.value = 'main_esp32_01';
    } catch (error) {
      notify('danger', 'Gagal sinkron RFID', error.message);
    }
  });

  // =========================================================
  // Load Users untuk Dropdown Card/RFID
  // =========================================================
  const cardUserSelects = document.querySelectorAll('.card-user-select');
  const loadCardUsers = async () => {
    if (!cardUserSelects.length) return;
    try {
      const res = await fetch('/api/v1/user/list');
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.message || 'Gagal');
      const users = body.data;

      cardUserSelects.forEach(select => {
        select.innerHTML =
          '<option value="">Pilih pengguna</option>' +
          users.map(user => `
            <option value="${user.id}">
              ${user.profil?.full_name || user.username} — ${user.username}
            </option>
          `).join('');
      });
    } catch (error) {
      cardUserSelects.forEach(select => {
        select.innerHTML = '<option value="">Gagal memuat pengguna</option>';
      });
      notify('danger', 'Gagal memuat pengguna', error.message);
    }
  };
  loadCardUsers();

})();
