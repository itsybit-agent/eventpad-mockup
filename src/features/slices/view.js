// ===========================================
// SLICES - View (SV: View Slice)
// ===========================================

import { getScenariosForSlice, getSliceDetail, findSourceSlice } from '../../core/projections.js';
import { renderScenarioSection } from '../scenarios/view.js';

// Type label mapping
const typeBadgeLabels = {
  screen: 'SCREEN',
  command: 'COMMAND', 
  event: 'EVENT',
  readModel: 'READ MODEL',
  processor: 'PROCESSOR'
};

// Render properties inline
function renderInlineProperties(props) {
  if (!props || props.length === 0) return '';
  return `<div class="slice-element-props">${props.map(p => 
    `<span class="prop-badge">${p.name}</span>`
  ).join('')}</div>`;
}

// Render slice elements based on slice type
function renderSliceElements(elements, sliceType, state) {
  if (sliceType === 'AU') {
    return renderAUSlice(elements, state);
  }
  
  // Default: vertical list - all elements tappable for editing
  return elements.map((el, i) => `
    ${i > 0 ? '<div class="slice-arrow"></div>' : ''}
    <div class="slice-element" data-type="${el.type}" onclick="window.EventPad.openElementMenu('${el.id}')">
      <div class="slice-element-header">
        <span class="element-type-badge ${el.type}">${typeBadgeLabels[el.type] || el.type}</span>
        <span class="slice-element-name">${el.name}</span>
      </div>
      ${renderInlineProperties(el.properties)}
    </div>
  `).join('');
}

// Render AU slice as: [SV slice] → ⚙️ Processor → [SC slice]
function renderAUSlice(elements, state) {
  const processor = elements.find(e => e.type === 'processor');
  const command = elements.find(e => e.type === 'command');
  const triggerEvent = elements.find(e => e.type === 'event' && 
    state.connections.some(c => c.from === e.id && c.to === processor?.id && c.relation === 'trigger')
  );
  const readModels = elements.filter(e => e.type === 'readModel');

  // Find linked SV and SC slices by name
  const svSlice = triggerEvent ? Object.values(state.slices).find(s =>
    s.type === 'SV' && s.elements.includes(triggerEvent.id)
  ) : null;
  const scSlice = command ? Object.values(state.slices).find(s =>
    s.type === 'SC' && s.elements.includes(command.id)
  ) : null;

  let html = '<div class="au-layout">';

  // Left: SV slice pill
  html += '<div class="au-side">';
  if (svSlice?.name) {
    html += `
      <div class="slice-element slice-link au-linked" onclick="window.EventPad.jumpToElementSlice('${triggerEvent.id}')" title="Go to State View">
        <span class="au-slice-label">SV</span>
        <span>${svSlice.name}</span>
        <span class="link-indicator">↗</span>
      </div>`;
  } else if (triggerEvent) {
    html += `
      <div class="slice-element" data-type="event">
        <span>🟧 ${triggerEvent.name}</span>
      </div>`;
  } else {
    html += `<div class="au-empty" onclick="window.EventPad.openElementMenu('${processor?.id}')">+ Set State View trigger</div>`;
  }
  if (readModels.length > 0) {
    readModels.forEach(rm => {
      html += `<div class="slice-element slice-link au-context" onclick="window.EventPad.jumpToElementSlice('${rm.id}')" title="Context read model">
        <span>🟩 ${rm.name}</span><span class="link-indicator">↗</span></div>`;
    });
  }
  html += '</div>';

  // Centre: Processor
  html += `<div class="au-center">
    <div class="au-arrow">&rarr;</div>
    <div class="slice-element slice-element-tappable au-processor" onclick="window.EventPad.openElementMenu('${processor?.id}')">
      <span>⚙️ ${processor?.name || 'Processor'}</span>
    </div>
    <div class="au-arrow">&rarr;</div>
  </div>`;

  // Right: SC slice pill
  html += '<div class="au-side">';
  if (scSlice?.name) {
    html += `
      <div class="slice-element slice-link au-linked" onclick="window.EventPad.jumpToElementSlice('${command.id}')" title="Go to State Change">
        <span class="au-slice-label">SC</span>
        <span>${scSlice.name}</span>
        <span class="link-indicator">↗</span>
      </div>`;
  } else if (command) {
    html += `
      <div class="slice-element" data-type="command">
        <span>🟦 ${command.name}</span>
      </div>`;
  } else {
    html += `<div class="au-empty" onclick="window.EventPad.openElementMenu('${processor?.id}')">+ Set State Change</div>`;
  }
  html += '</div>';

  html += '</div>';
  return html;
}

// Render a slice card
export function renderSliceCard(slice, state) {
  // Use SliceDetail read model to get elements with properties
  const sliceDetail = getSliceDetail(slice.id, state);
  const sliceElements = sliceDetail ? sliceDetail.elements : [];
  const scenarios = getScenariosForSlice(slice.id, state);
  
  // Safe slice name for onclick (escape quotes)
  const safeName = (slice.name || '').replace(/'/g, "\\'");
  
  // Build scenario cards HTML (from scenarios feature)
  const scenarioCardsHtml = renderScenarioSection(scenarios, state);
  
  const sliceTypeLabel = slice.type === 'SC' ? 'STATE CHANGE' : slice.type === 'SV' ? 'STATE VIEW' : 'AUTOMATION';
  
  return `
    <div class="slice-card" data-slice-id="${slice.id}">
      <div class="slice-header" onclick="window.EventPad.promptSliceName('${slice.id}', '${safeName}')">
        <span class="slice-name">${slice.name || '(tap to name)'}</span>
        <span class="slice-type ${slice.type}">${sliceTypeLabel}${slice.complete === false ? ' ⏳' : ''}</span>
      </div>
      <div class="slice-elements">
        ${renderSliceElements(sliceElements, slice.type, state)}
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
