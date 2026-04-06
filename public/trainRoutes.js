function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

function makeErrorSpan(msg) {
  const span = document.createElement('span');
  span.className = 'error';
  span.textContent = msg;
  return span;
}

function makeDetailsBox(trainRoute) {
  const box = document.createElement('div');
  box.className = 'details-box';

  const addLine = (label, value) => {
    const line = document.createElement('div');

    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;

    const text = document.createTextNode(String(value ?? ''));

    line.appendChild(strong);
    line.appendChild(text);
    box.appendChild(line);
  };

  addLine('Train type', trainRoute?.trainType);
  addLine('Ticket price', trainRoute?.cost);
  addLine('Day / Time', `${trainRoute?.dayOfWeek ?? ''} / ${trainRoute?.departureTime ?? ''}`);

  return box;
}

async function loadDetails(trainRouteId, detailsRow, detailsCell) {
  detailsRow.dataset.loading = 'true';
  detailsCell.textContent = 'Loading...';
  detailsRow.style.display = '';

  try {
    const resp = await fetch(`/api/train-routes/${encodeURIComponent(trainRouteId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    const payload = await resp.json().catch(() => null);

    if (!resp.ok) {
      const msg = payload && payload.error ? payload.error : `Request failed (${resp.status})`;
      clearNode(detailsCell);
      detailsCell.appendChild(makeErrorSpan(msg));
      return;
    }

    const trainRoute = payload && payload.data ? payload.data : null;

    clearNode(detailsCell);
    detailsCell.appendChild(makeDetailsBox(trainRoute));
  } catch (e) {
    clearNode(detailsCell);
    detailsCell.appendChild(makeErrorSpan(`Network error: ${e.message}`));
  } finally {
    detailsRow.dataset.loading = 'false';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const table = document.querySelector('#trainRoutesTable');
  if (!table) return;

  table.addEventListener('click', async (ev) => {
    if (ev.target.closest('a')) return;

    const row = ev.target.closest('tr.train-route-row');
    if (!row) return;

    const trainRouteId = row.dataset.trainRouteId;
    const detailsRow = document.querySelector(`#train-route-details-${CSS.escape(trainRouteId)}`);
    if (!detailsRow) return;

    const detailsCell = detailsRow.querySelector('td');
    if (!detailsCell) return;

    await loadDetails(trainRouteId, detailsRow, detailsCell);
  });
});
