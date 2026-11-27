{
  const list = document.getElementById('authentication-history-list');
  const filter = document.getElementById('authentication-history-filter');
  const escapeHtml = value => String(value ?? '-').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const formatDate = value => value ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value)) : '-';

  const render = records => {
    if (!records.length) {
      list.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Belum ada riwayat yang sesuai.</td></tr>';
      return;
    }
    list.innerHTML = records.map(record => {
      const name = record.user?.profil?.full_name || record.user?.username || 'Tidak dikenal';
      const evidence = record.capturePath
        ? `<a href="${escapeHtml(record.capturePath)}" target="_blank" rel="noopener">Lihat capture</a>`
        : '';
      return `<tr>
        <td>${escapeHtml(formatDate(record.createdAt))}</td>
        <td><strong>${escapeHtml(name)}</strong><br><small class="text-muted">${escapeHtml(record.user?.email || record.userId || '-')}</small></td>
        <td>${escapeHtml(record.room?.name || record.room?.ruid || '-')}</td>
        <td><code>${escapeHtml(record.device?.device_id || record.deviceId || '-')}</code></td>
        <td>${escapeHtml(record.authenticationMethod)}</td>
        <td><span class="status-pill ${record.isSuccess ? 'active' : 'inactive'}">${record.isSuccess ? 'Berhasil' : 'Gagal'}</span></td>
        <td>${escapeHtml(record.detail || '-')}${evidence ? `<br>${evidence}` : ''}</td>
      </tr>`;
    }).join('');
  };

  const loadHistory = async () => {
    if (!list) return;
    const params = new URLSearchParams(new FormData(filter));
    [...params.entries()].forEach(([key, value]) => { if (!value) params.delete(key); });
    list.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Memuat riwayat...</td></tr>';
    try {
      const response = await fetch(`${list.dataset.listEndpoint}?${params}`);
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.message || 'Permintaan gagal');
      render(body.data || []);
    } catch (error) {
      list.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-4">${escapeHtml(error.message)}</td></tr>`;
    }
  };

  filter?.addEventListener('submit', event => { event.preventDefault(); loadHistory(); });
  loadHistory();
}
