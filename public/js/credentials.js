{
    // =========================================================
    // Helper Functions
    // =========================================================

    const request = async (url, options) => {
        const r = await fetch(url, options);
        const d = await r.json();

        if (!r.ok || !d.success) {
            throw new Error(d.message || 'Permintaan gagal');
        }

        return d.data;
    };

    const toast = (theme, title, desc) => {
        window.showToast
            ? showToast({ theme, title, desc })
            : alert(`${title}: ${desc}`);
    };

    const date = (value) => {
        return value
            ? new Intl.DateTimeFormat('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
              }).format(new Date(value))
            : '-';
    };


    // =========================================================
    // PIN
    // =========================================================

    const pinList = document.querySelector('#pin-list');

    const loadPins = async () => {
        if (!pinList) return;

        try {
            const pins = await request(pinList.dataset.listEndpoint);

            pinList.innerHTML = pins.length
                ? pins.map(p => `
                    <div class="credential-row pin-grid" data-id="${p.id}">
                        <span>${p.fullName || p.username || p.userId}</span>
                        <span>${p.deviceId}</span>
                        <span>${p.roomName || '-'}</span>
                        <span class="status-pill ${p.isActive ? 'active' : 'inactive'}">
                            ${p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <span>${date(p.createdAt)}</span>
                        <span>
                            <button class="btn btn-sm btn-outline-primary pin-edit">
                                Ubah
                            </button>
                            <button class="btn btn-sm btn-outline-danger pin-delete">
                                Hapus
                            </button>
                        </span>
                    </div>
                `).join('')
                : '<p class="text-center text-muted py-4 mb-0">Belum ada PIN terdaftar.</p>';

        } catch (e) {
            pinList.innerHTML = `
                <p class="text-center text-danger py-4 mb-0">
                    ${e.message}
                </p>
            `;
        }
    };


    document.querySelector('#pin-form')?.addEventListener('submit', async e => {
        e.preventDefault();

        const pinForm = e.currentTarget;

        try {
            await request(pinList.dataset.createEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    Object.fromEntries(new FormData(pinForm))
                )
            });

            pinForm.reset();

            toast(
                'success',
                'PIN tersimpan',
                'PIN pengguna telah disimpan dan command dikirim ke hardware.'
            );

            loadPins();

        } catch (err) {
            toast(
                'danger',
                'Gagal menyimpan PIN',
                err.message
            );
        }
    });


    pinList?.addEventListener('click', async e => {
        const row = e.target.closest('[data-id]');

        if (!row) return;

        const id = row.dataset.id;

        try {
            if (
                e.target.closest('.pin-delete') &&
                confirm('Hapus PIN ini?')
            ) {
                await request(
                    `${pinList.dataset.deleteEndpoint}/${id}`,
                    {
                        method: 'DELETE'
                    }
                );

                loadPins();
            }

            if (e.target.closest('.pin-edit')) {
                const newPin = prompt('Masukkan PIN baru (6 digit):');

                if (/^\d{6}$/.test(newPin || '')) {
                    await request(
                        `${pinList.dataset.updateEndpoint}/${id}`,
                        {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ newPin })
                        }
                    );

                    toast(
                        'success',
                        'PIN diperbarui',
                        'PIN berhasil diperbarui.'
                    );
                }
            }

        } catch (err) {
            toast(
                'danger',
                'Permintaan gagal',
                err.message
            );
        }
    });


    // =========================================================
    // Fingerprint
    // =========================================================

    const fpList = document.querySelector('#fingerprint-list');

    const loadFingerprint = async () => {
        if (!fpList) return;

        try {
            const rows = await request(
                fpList.dataset.listEndpoint
            );

            fpList.innerHTML = rows.length
                ? rows.map(x => `
                    <div class="credential-row fingerprint-grid" data-id="${x.id}">
                        <span>${x.username || '-'}</span>
                        <span>${x.roomName}</span>
                        <span>${x.deviceId}</span>
                        <span>${x.fingerId}</span>

                        <span class="status-pill ${x.isActive ? 'active' : 'inactive'}">
                            ${x.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>

                        <span>
                            <button class="btn btn-sm btn-outline-primary fp-toggle">
                                ${x.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>

                            <button class="btn btn-sm btn-outline-danger fp-delete">
                                Hapus
                            </button>
                        </span>
                    </div>
                `).join('')
                : '<p class="text-center text-muted py-4 mb-0">Belum ada fingerprint terdaftar.</p>';

        } catch (e) {
            fpList.innerHTML = `
                <p class="text-center text-danger py-4 mb-0">
                    ${e.message}
                </p>
            `;
        }
    };


    fpList?.addEventListener('click', async e => {
        const row = e.target.closest('[data-id]');

        if (!row) return;

        try {
            if (
                e.target.closest('.fp-delete') &&
                confirm('Hapus mapping fingerprint ini?')
            ) {
                await request(
                    `${fpList.dataset.deleteEndpoint}/${row.dataset.id}`,
                    {
                        method: 'DELETE'
                    }
                );

                loadFingerprint();
            }

            if (e.target.closest('.fp-toggle')) {
                const active =
                    e.target.textContent.trim() !== 'Aktifkan';

                await request(
                    `${fpList.dataset.updateEndpoint}/${row.dataset.id}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            isActive: !active
                        })
                    }
                );

                loadFingerprint();
            }

        } catch (err) {
            toast(
                'danger',
                'Permintaan gagal',
                err.message
            );
        }
    });


    // =========================================================
    // Load Users untuk Fingerprint Dropdown
    // =========================================================

    const fingerprintUserSelects =
        document.querySelectorAll('.fingerprint-user-select');

    const loadFingerprintUsers = async () => {
        if (!fingerprintUserSelects.length) return;

        try {
            const users = await request('/api/v1/user/list');

            fingerprintUserSelects.forEach(select => {
                select.innerHTML =
                    '<option value="">Pilih pengguna</option>' +
                    users.map(user => `
                        <option value="${user.id}">
                            ${user.profil?.full_name || user.username}
                            — ${user.username}
                        </option>
                    `).join('');
            });

        } catch (error) {
            fingerprintUserSelects.forEach(select => {
                select.innerHTML =
                    '<option value="">Gagal memuat pengguna</option>';
            });

            toast(
                'danger',
                'Gagal memuat pengguna',
                error.message
            );
        }
    };


    // =========================================================
    // Load Users untuk Face Recognition Dropdown
    // =========================================================

    const faceUserSelects =
        document.querySelectorAll('.face-user-select');

    const loadFaceUsers = async () => {
        if (!faceUserSelects.length) return;

        try {
            const users = await request('/api/v1/user/list');

            faceUserSelects.forEach(select => {
                select.innerHTML =
                    '<option value="">Pilih pengguna</option>' +
                    users.map(user => `
                        <option value="${user.id}">
                            ${user.profil?.full_name || user.username}
                            — ${user.username}
                        </option>
                    `).join('');
            });

        } catch (error) {
            faceUserSelects.forEach(select => {
                select.innerHTML =
                    '<option value="">Gagal memuat pengguna</option>';
            });

            toast(
                'danger',
                'Gagal memuat pengguna',
                error.message
            );
        }
    };

    // =========================================================
    // Load Users untuk PIN Dropdown
    // =========================================================

    const pinUserSelects = document.querySelectorAll('.pin-user-select');

    const loadPinUsers = async () => {
        if (!pinUserSelects.length) return;

        try {
            const users = await request('/api/v1/user/list');

            pinUserSelects.forEach(select => {
                select.innerHTML =
                    '<option value="">Pilih pengguna</option>' +
                    users.map(user => `
                        <option value="${user.id}">
                            ${user.profil?.full_name || user.username}
                            — ${user.username}
                        </option>
                    `).join('');
            });

        } catch (error) {
            pinUserSelects.forEach(select => {
                select.innerHTML =
                    '<option value="">Gagal memuat pengguna</option>';
            });

            toast('danger', 'Gagal memuat pengguna', error.message);
        }
    };

      // ============================================
      // FACE RECOGNITION PREVIEW
      // ============================================
      let facePreviewInterval = null;

      const loadLatestFaceCapture = async () => {
        const img = document.getElementById('face-preview-image');
        const placeholder = document.getElementById('face-preview-placeholder');
        const info = document.getElementById('face-preview-info');
        if (!img || !placeholder) return;

        try {
          const data = await request('/api/v1/face/latest-capture');
          if (data && data.path) {
            img.src = data.path + '?t=' + Date.now();
            img.style.display = 'block';
            placeholder.style.display = 'none';
            if (info) info.textContent = `Capture: ${data.filename} — ${new Date(data.timestamp).toLocaleString('id-ID')}`;
          } else {
            img.style.display = 'none';
            placeholder.style.display = 'block';
            if (info) info.textContent = '';
          }
        } catch (e) {
          img.style.display = 'none';
          placeholder.style.display = 'block';
        }
      };

      if (document.getElementById('face-preview-container')) {
        loadLatestFaceCapture();
        facePreviewInterval = setInterval(loadLatestFaceCapture, 3000);
        window.addEventListener('beforeunload', () => clearInterval(facePreviewInterval));
      }

      document.getElementById('refresh-capture-btn')?.addEventListener('click', () => {
        loadLatestFaceCapture();
        toast('success', 'Refreshed', 'Preview diperbarui');
      });


    // =========================================================
    // Form Handlers
    // =========================================================

    // Fingerprint Enroll
    document.querySelector('#fingerprint-enroll-form')
        ?.addEventListener('submit', async e => {
            e.preventDefault();

            const fingerprintForm = e.currentTarget;

            try {
                const data = await request(
                    '/api/v1/fingerprint/register',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(
                            Object.fromEntries(
                                new FormData(fingerprintForm)
                            )
                        )
                    }
                );

                toast(
                    'success',
                    'Enroll fingerprint dimulai',
                    `Session ${data.sessionId}. Tempelkan jari pada sensor.`
                );

            } catch (err) {
                toast(
                    'danger',
                    'Gagal memulai enroll fingerprint',
                    err.message
                );
            }
        });


    // Fingerprint Sync
    document.querySelector('#fingerprint-sync-form')
        ?.addEventListener('submit', async e => {
            e.preventDefault();

            try {
                const data = await request(
                    '/api/v1/fingerprint/sync-existing',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(
                            Object.fromEntries(
                                new FormData(e.currentTarget)
                            )
                        )
                    }
                );

                toast(
                    'success',
                    'Fingerprint disinkronkan',
                    `ID jari ${data.fingerId} telah dipetakan ke ${data.username}. Hardware tidak diubah.`
                );

                loadFingerprint();

            } catch (err) {
                toast(
                    'danger',
                    'Gagal sinkron fingerprint',
                    err.message
                );
            }
        });


    // Face Recognition Enrollment
    document.querySelector('#face-registration-form')
        ?.addEventListener('submit', async e => {
            e.preventDefault();

            try {
                const data = await request(
                    '/api/v1/face/initiate-enrollment',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(
                            Object.fromEntries(
                                new FormData(e.currentTarget)
                            )
                        )
                    }
                );

                toast(
                    'success',
                    'Enroll wajah dimulai',
                    `Session ${data.sessionId}. Hadapkan wajah ke kamera.`
                );

            } catch (err) {
                toast(
                    'danger',
                    'Gagal memulai enroll wajah',
                    err.message
                );
            }
        });


    // RFID Sync
    document.querySelector('#rfid-sync-form')
        ?.addEventListener('submit', async e => {
            e.preventDefault();

            try {
                const data = await request(
                    '/api/v1/card/sync-existing',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(
                            Object.fromEntries(
                                new FormData(e.currentTarget)
                            )
                        )
                    }
                );

                toast(
                    'success',
                    'RFID disinkronkan',
                    `UID ${data.cardNumber} telah dipetakan ke ${data.username}. Hardware tidak diubah.`
                );

            } catch (err) {
                toast(
                    'danger',
                    'Gagal sinkron RFID',
                    err.message
                );
            }
        });


    // RFID Enrollment
    document.querySelector('#rfid-enroll-form')
        ?.addEventListener('submit', async e => {
            e.preventDefault();

            try {
                const data = await request(
                    '/api/v1/card/initiate-enrollment',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(
                            Object.fromEntries(
                                new FormData(e.currentTarget)
                            )
                        )
                    }
                );

                toast(
                    'success',
                    'Enroll RFID dimulai',
                    `Session ${data.sessionId}. Tempelkan kartu RFID pada reader.`
                );

            } catch (err) {
                toast(
                    'danger',
                    'Gagal memulai enroll RFID',
                    err.message
                );
            }
        });


    // =========================================================
    // Load Semua Data
    // =========================================================

    loadPins();
    loadFingerprint();
    loadFingerprintUsers();
    loadFaceUsers();
    loadPinUsers();

}
