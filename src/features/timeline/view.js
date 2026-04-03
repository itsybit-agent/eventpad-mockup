// ===========================================
// TIMELINE VIEW — Horizontal slice display
// ===========================================

import { projectState } from '../../core/projections.js';

const typeIcons = { event: '🟧', command: '🟦', readModel: '🟩', screen: '⏹️', processor: '⚙️' };
const typeColors = { event: 'var(--event)', command: 'var(--command)', readModel: 'var(--readmodel)', screen: 'var(--screen)', processor: 'var(--processor)' };

let viewMode = false; // false = edit, true = timeline

export function isViewMode() { return viewMode; }

export function toggleViewMode() {
  viewMode = !viewMode;

  const feed = document.getElementById('feed');
  const timeline = document.getElementById('timelineView');
  const fab = document.getElementById('fab');
  const btn = document.getElementById('viewModeBtn');
  const logToggle = document.querySelector('.event-log-toggle');

  if (viewMode) {
    feed.style.display = 'none';
    timeline.style.display = 'flex';
    fab.style.display = 'none';
    if (logToggle) logToggle.style.display = 'none';
    btn.textContent = '✏️ Edit';
    btn.classList.add('active');
    renderTimeline();
  } else {
    feed.style.display = 'block';
    timeline.style.display = 'none';
    fab.style.display = 'flex';
    if (logToggle) logToggle.style.display = 'flex';
    btn.textContent = '📺 View';
    btn.classList.remove('active');
  }
}

export function renderTimeline() {
  if (!viewMode) return;

  const state = projectState();
  const slices = Object.values(state.slices).filter(s => s.name);
  const looseElements = Object.values(state.elements).filter(el =>
    !Object.values(state.slices).some(s => s.elements.includes(el.id))
  );

  const container = document.getElementById('timelineScroll');

  // Group slices by type
  const svSlices = slices.filter(s => s.type === 'SV');
  const scSlices = slices.filter(s => s.type === 'SC');
  const auSlices = slices.filter(s => s.type === 'AU');
  const unnamed = slices.filter(s => !s.name);

  // Render columns: SV | SC | AU | loose
  let html = '';

  // Lane headers
  const lanes = [
    { label: '🟩 State Views', slices: svSlices },
    { label: '🟦 State Changes', slices: scSlices },
    { label: '⚙️ Automations', slices: auSlices },
  ];

  lanes.forEach(lane => {
    if (lane.slices.length === 0) return;
    html += `<div class="timeline-lane">`;
    html += `<div class="timeline-lane-header">${lane.label}</div>`;
    lane.slices.forEach(slice => {
      html += renderTimelineSlice(slice, state);
    });
    html += `</div>`;
  });

  // Loose elements
  if (looseElements.length > 0) {
    html += `<div class="timeline-lane">`;
    html += `<div class="timeline-lane-header">⬜ Unconnected</div>`;
    looseElements.forEach(el => {
      html += renderTimelineElement(el);
    });
    html += `</div>`;
  }

  container.innerHTML = html || '<div class="timeline-empty">No named slices yet. Build your model in Edit mode first.</div>';
}

function renderTimelineSlice(slice, state) {
  const elements = slice.elements.map(id => state.elements[id]).filter(Boolean);

  let inner = '';
  elements.forEach((el, i) => {
    if (i > 0) inner += `<div class="tl-arrow">↓</div>`;
    inner += renderTimelineElement(el);
  });

  return `
    <div class="tl-slice tl-slice-${slice.type.toLowerCase()}">
      <div class="tl-slice-name">${slice.name}</div>
      ${inner}
    </div>
  `;
}

function renderTimelineElement(el) {
  const props = el.properties?.length
    ? `<div class="tl-props">${el.properties.map(p => `<span class="tl-prop">${p.name}</span>`).join('')}</div>`
    : '';
  return `
    <div class="tl-element" data-type="${el.type}">
      <span class="tl-icon">${typeIcons[el.type] || '▪'}</span>
      <span class="tl-name">${el.name}</span>
      ${props}
    </div>
  `;
}
