const input = document.getElementById('filterInput');

function applyFilter() {
  const q = (input.value || '').trim().toLowerCase();
  const n = Number(q);
  const qIsNumber = q !== '' && Number.isInteger(n) && String(n) === q;

  document.querySelectorAll('.detail-row').forEach((tr) => {
    const routeId = String(tr.getAttribute('data-route-id') || '');
    const searchText = (tr.getAttribute('data-search') || '').toLowerCase();
    const match = !q || (qIsNumber ? routeId === q : routeId.includes(q) || searchText.includes(q));

    if (match) {
      tr.style.display = '';
    } else {
      tr.style.display = 'none';
    }
  });
}

if (input) {
  input.addEventListener('input', applyFilter);
}
