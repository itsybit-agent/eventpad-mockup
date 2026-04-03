// ===========================================
// SLICES - View (SV: View Slice)
// ===========================================

import { getScenariosForSlice, getSliceDetail, findSourceSlice } from '../../core/projections.js';
import { renderScenarioSection } from '../scenarios/view.js';

// Render properties inline
function renderInlineProperties(props) {
  if (!props || props.length === 0) return '';
  return `<div class="slice-element-props">${props.map(p => 
    `<span class="prop-badge">${p.name}</span>`
  ).join('')}</div>`;
}

// Render a single element — colored dot + name only (color = type)
function renderElement(el, onclick) {
  return `
    <div class="slice-element" data-type="${el.type}" onclick="${onclick}">
      <div class="slice-element-header">
        <span class="element-type-dot ${el.type}"></span>
        <span class="slice-element-name">${el.name}</span>
      </div>
      ${renderInlineProperties(el.properties)}
    </div>
  `;
}

// Render slice elements based on slice type
function renderSliceElements(elements, sliceType, sliceId, state) {
  if (sliceType === 'AU') {
    return renderAUSlice(elements, state);
  }

  const screen = elements.find(e => e.type === 'screen');
  const rest = elements.filter(e => e.type !== 'screen');

  const screenEl = screen
    ? renderElement(screen, `window.EventPad.openElementMenu('${screen.id}')`)
    : `<div class="slice-element screen-missing" onclick="window.EventPad.addScreenToSlice('${sliceId}')">
        <div class="slice-element-header">
          <span class="element-type-dot screen"></span>
          <span class="slice-element-name" style="opacity:0.45">+ Add screen</span>
        </div>
      </div>`;

  const restEls = rest.map(el =>
    `<div class="slice-arrow"></div>` +
    renderElement(el, `window.EventPad.openElementMenu('${el.id}')`)
  ).join('');

  return screenEl + restEls;
}

// Render AU slice: ⚙️ Processor centred, SV left / SC right below
function renderAUSlice(elements, state) {
  const processor = elements.find(e => e.type === 'processor');

  // Use connections for accuracy — avoid element-array ambiguity
  const triggerConn = processor ? state.connections.find(c => c.to === processor.id && c.relation === 'trigger') : null;
  const triggerEvent = triggerConn ? state.elements[triggerConn.from] : null;

  const invokesConn = processor ? state.connections.find(c => c.from === processor.id && c.relation === 'invokes') : null;
  const command = invokesConn ? state.elements[invokesConn.to] : null;

  const svSlice = triggerEvent ? Object.values(state.slices).find(s =>
    s.type === 'SV' && s.elements.includes(triggerEvent.id)
  ) : null;
  const scSlice = command ? Object.values(state.slices).find(s =>
    s.type === 'SC' && s.elements.includes(command.id)
  ) : null;

  // Additional context SV inputs (processor → readModel via 'context')
  const contextConns = processor ? state.connections.filter(c => c.from === processor.id && c.relation === 'context') : [];
  const contextReadModels = contextConns.map(c => state.elements[c.to]).filter(Boolean);

  function renderAUSideEls(slice, fallbackEl) {
    if (slice?.name) {
      const els = slice.elements.map(id => state.elements[id]).filter(Boolean);
      return els.map((el, i) => `
        ${i > 0 ? '<div class="au-el-arrow">↓</div>' : ''}
        <div class="au-el" data-type="${el.type}" onclick="window.EventPad.jumpToElementSlice('${el.id}')">
          <span class="element-type-dot ${el.type}"></span>
          <span class="au-el-name">${el.name}</span>
        </div>`).join('');
    } else if (fallbackEl) {
      return `<div class="au-el" data-type="${fallbackEl.type}">
        <span class="element-type-dot ${fallbackEl.type}"></span>
        <span class="au-el-name">${fallbackEl.name}</span>
      </div>`;
    }
    return `<div class="au-empty" onclick="window.EventPad.openElementMenu('${processor?.id}')">+ Set</div>`;
  }

  const contextHtml = contextReadModels.length > 0 ? `
    <div class="au2-context-row">
      ${contextReadModels.map(rm => `
        <div class="au-el au-context" data-type="readModel" onclick="window.EventPad.jumpToElementSlice('${rm.id}')">
          <span class="element-type-dot readModel"></span>
          <span class="au-el-name">${rm.name}</span>
        </div>
      `).join('')}
    </div>` : '';

  return `
    <div class="au2-layout">
      ${contextHtml}
      <div class="au2-processor-row">
        <div class="au2-connector-line"></div>
        <div class="au2-processor slice-element-tappable" onclick="window.EventPad.openElementMenu('${processor?.id}')">
          ⚙️ ${processor?.name || 'Processor'}
        </div>
        <div class="au2-connector-line"></div>
      </div>
      <div class="au2-branch-row">
        <div class="au2-branch-left"></div>
        <div class="au2-branch-spacer"></div>
        <div class="au2-branch-right"></div>
      </div>
      <div class="au2-sides">
        <div class="au2-side au2-sv">
          <div class="au2-side-label">State View</div>
          ${renderAUSideEls(svSlice, triggerEvent)}
        </div>
        <div class="au2-divider"></div>
        <div class="au2-side au2-sc">
          <div class="au2-side-label">State Change</div>
          ${renderAUSideEls(scSlice, command)}
        </div>
      </div>
    </div>
  `;
}

// Render a slice card
export function renderSliceCard(slice, state) {
  const sliceDetail = getSliceDetail(slice.id, state);
  const sliceElements = sliceDetail ? sliceDetail.elements : [];
  const scenarios = getScenariosForSlice(slice.id, state);

  const safeName = (slice.name || '').replace(/'/g, "\\'");

  const scenarioCardsHtml = renderScenarioSection(scenarios, state);

  const sliceTypeLabel = slice.type === 'SC' ? 'STATE CHANGE' : slice.type === 'SV' ? 'STATE VIEW' : 'AUTOMATION';

  return `
    <div class="slice-card" data-slice-id="${slice.id}">
      <div class="slice-header" onclick="window.EventPad.promptSliceName('${slice.id}', '${safeName}')">
        <span class="slice-name">${slice.name || '(tap to name)'}</span>
        <span class="slice-type ${slice.type}">${sliceTypeLabel}${slice.complete === false ? ' ⏳' : ''}</span>
      </div>
      <div class="slice-elements">
        ${renderSliceElements(sliceElements, slice.type, slice.id, state)}
        <button class="add-element-btn" onclick="event.stopPropagation(); window.EventPad.openCreateSheet()">+ Add element</button>
      </div>
      ${scenarioCardsHtml || `
        <div class="scenarios-section">
          <h4>SCENARIOS (0)</h4>
          <button class="add-scenario-btn" onclick="event.stopPropagation(); window.EventPad.addScenario('${slice.id}', '${slice.type}')">+ Add scenario</button>
        </div>
      `}
    </div>
  `;
}

// Jump to element's source slice
export function jumpToElementSlice(elementId) {
  const sourceSlice = findSourceSlice(elementId);

  if (sourceSlice) {
    const sliceCard = document.querySelector(`[data-slice-id="${sourceSlice.id}"]`);
    if (sliceCard) {
      sliceCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sliceCard.style.outline = '2px solid var(--accent)';
      setTimeout(() => sliceCard.style.outline = '', 1500);
    }
  }
}
