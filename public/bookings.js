function showMessage(type, text) {
  const box = document.querySelector('#ajaxMessage');
  if (!box) return;

  box.style.display = '';
  box.classList.remove('success', 'error');
  box.classList.add(type === 'success' ? 'success' : 'error');
  box.innerHTML = `<p>${text}</p>`;
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.delete-booking-btn');
    if (!btn) return;

    const routeId = btn.dataset.routeId;
    const bookingId = btn.dataset.bookingId;

    if (!routeId || !bookingId) {
      showMessage('error', 'Missing ids for deletion.');
      return;
    }

    const ok = window.confirm('Are you sure you want to delete this booking?');
    if (!ok) return;

    btn.disabled = true;

    try {
      const resp = await fetch(
        `/api/train-routes/${encodeURIComponent(routeId)}/bookings/${encodeURIComponent(bookingId)}`,
        {
          method: 'DELETE',
          headers: { Accept: 'application/json' },
        },
      );

      const payload = await resp.json().catch(() => null);

      if (!resp.ok) {
        const msg = payload && payload.error ? payload.error : `Request failed (${resp.status})`;
        showMessage('error', msg);
        btn.disabled = false;
        return;
      }

      const row = btn.closest('tr');
      if (row) row.remove();

      showMessage('success', payload.message || 'Booking deleted successfully.');
    } catch (e) {
      showMessage('error', `Network error: ${e.message}`);
      btn.disabled = false;
    }
  });
});
