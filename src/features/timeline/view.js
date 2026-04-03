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

  // Render each slice as its own column, AU slices wider
  let html = '';

  slices.forEach(slice => {
    if (slice.type === 'AU') {
      html += renderTimelineAUSlice(slice, state);
    } else {
      html += renderTimelineSlice(slice, state);
    }
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

function renderTimelineAUSlice(slice, state) {
  const elements = slice.elements.map(id => state.elements[id]).filter(Boolean);
  const processor = elements.find(e => e.type === 'processor');

  const svSlice = processor ? Object.values(state.slices).find(s =>
    s.type === 'SV' && elements.some(e => s.elements.includes(e.id))
  ) : null;
  const scSlice = processor ? Object.values(state.slices).find(s =>
    s.type === 'SC' && elements.some(e => s.elements.includes(e.id))
  ) : null;

  const svElements = svSlice ? svSlice.elements.map(id => state.elements[id]).filter(Boolean) : [];
  const scElements = scSlice ? scSlice.elements.map(id => state.elements[id]).filter(Boolean) : [];

  const renderSide = (els) => els.map((el, i) => `
    ${i > 0 ? '<div class="tl-arrow">↓</div>' : ''}
    ${renderTimelineElement(el)}
  `).join('');

  return `
    <div class="tl-slice tl-slice-au tl-slice-au-wide">
      <div class="tl-slice-name">${slice.name}</div>
      <!-- Gear top centre -->
      <div class="tl-au-gear">⚙️ ${processor?.name || 'Processor'}</div>
      <!-- Branch lines -->
      <div class="tl-au-branches">
        <div class="tl-au-branch-left"></div>
        <div class="tl-au-branch-right"></div>
      </div>
      <!-- SV + SC side by side -->
      <div class="tl-au-sides">
        <div class="tl-au-side">
          <div class="tl-au-side-label">State View</div>
          ${svElements.length ? renderSide(svElements) : '<div class="tl-au-empty">—</div>'}
        </div>
        <div class="tl-au-divider"></div>
        <div class="tl-au-side">
          <div class="tl-au-side-label">State Change</div>
          ${scElements.length ? renderSide(scElements) : '<div class="tl-au-empty">—</div>'}
        </div>
      </div>
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
