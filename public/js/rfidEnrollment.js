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
})();
