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

  const svSlice = triggerEvent ? Object.values(state.slices).find(s =>
    s.type === 'SV' && s.elements.includes(triggerEvent.id)
  ) : null;
  const scSlice = command ? Object.values(state.slices).find(s =>
    s.type === 'SC' && s.elements.includes(command.id)
  ) : null;

  // SV side elements
  function renderSVContent() {
    if (svSlice?.name) {
      const svEls = svSlice.elements.map(id => state.elements[id]).filter(Boolean);
      return svEls.map(el => `
        <div class="au-el" data-type="${el.type}" onclick="window.EventPad.jumpToElementSlice('${el.id}')">
          ${typeBadgeLabels[el.type] ? `<span class="element-type-badge ${el.type}">${typeBadgeLabels[el.type]}</span>` : ''}
          <span class="au-el-name">${el.name}</span>
        </div>`).join('<div class="au-el-arrow">↓</div>');
    } else if (triggerEvent) {
      return `<div class="au-el" data-type="event"><span class="element-type-badge event">EVENT</span><span class="au-el-name">${triggerEvent.name}</span></div>`;
    }
    return `<div class="au-empty" onclick="window.EventPad.openElementMenu('${processor?.id}')">+ Set State View</div>`;
  }

  // SC side elements
  function renderSCContent() {
    if (scSlice?.name) {
      const scEls = scSlice.elements.map(id => state.elements[id]).filter(Boolean);
      return scEls.map(el => `
        <div class="au-el" data-type="${el.type}" onclick="window.EventPad.jumpToElementSlice('${el.id}')">
          ${typeBadgeLabels[el.type] ? `<span class="element-type-badge ${el.type}">${typeBadgeLabels[el.type]}</span>` : ''}
          <span class="au-el-name">${el.name}</span>
        </div>`).join('<div class="au-el-arrow">↓</div>');
    } else if (command) {
      return `<div class="au-el" data-type="command"><span class="element-type-badge command">COMMAND</span><span class="au-el-name">${command.name}</span></div>`;
    }
    return `<div class="au-empty" onclick="window.EventPad.openElementMenu('${processor?.id}')">+ Set State Change</div>`;
  }

  return `
    <div class="au2-layout">
      <!-- Gear on top, centred -->
      <div class="au2-processor-row">
        <div class="au2-connector-line"></div>
        <div class="au2-processor slice-element-tappable" onclick="window.EventPad.openElementMenu('${processor?.id}')">
          ⚙️ ${processor?.name || 'Processor'}
        </div>
        <div class="au2-connector-line"></div>
      </div>
      <!-- V lines down to sides -->
      <div class="au2-branch-row">
        <div class="au2-branch-left"></div>
        <div class="au2-branch-spacer"></div>
        <div class="au2-branch-right"></div>
      </div>
      <!-- SV and SC side by side -->
      <div class="au2-sides">
        <div class="au2-side au2-sv">
          <div class="au2-side-label">State View</div>
          ${renderSVContent()}
        </div>
        <div class="au2-divider"></div>
        <div class="au2-side au2-sc">
          <div class="au2-side-label">State Change</div>
          ${renderSCContent()}
        </div>
      </div>
    </div>
  `;
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
