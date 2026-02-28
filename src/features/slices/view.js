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

// Render AU slice with special layout
function renderAUSlice(elements, state) {
  const processor = elements.find(e => e.type === 'processor');
  const command = elements.find(e => e.type === 'command');
  const readModels = elements.filter(e => e.type === 'readModel');
  
  let html = '';
  
  // Processor at top
  if (processor) {
    html += `
      <div class="slice-element slice-element-tappable" onclick="window.EventPad.openElementMenu('${processor.id}')">
        <div class="slice-element-icon" style="background: var(--processor); color: #fff;">⚙️</div>
        <span>${processor.name}</span>
      </div>
    `;
  }
  
  // ReadModels (left) + Command (right) on same row
  if (command || readModels.length > 0) {
    if (processor) html += '<div class="slice-arrow">↓</div>';
    html += '<div class="slice-row">';
    
    // ReadModels first (left)
    readModels.forEach(rm => {
      html += `
        <div class="slice-element slice-link" onclick="window.EventPad.jumpToElementSlice('${rm.id}')" title="Tap to see source slice">
          <div class="slice-element-icon" style="background: var(--readmodel); color: #000;">🟩</div>
          <span>${rm.name}</span>
          <span class="link-indicator">↗</span>
        </div>
      `;
    });
    
    // Command (right)
    if (command) {
      html += `
        <div class="slice-element slice-link" onclick="window.EventPad.jumpToElementSlice('${command.id}')" title="Tap to see source slice">
          <div class="slice-element-icon" style="background: var(--command); color: #fff;">🟦</div>
          <span>${command.name}</span>
          <span class="link-indicator">↗</span>
        </div>
      `;
    }
    html += '</div>';
  }
  
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
