// ===========================================
// PROPERTIES - Edit Element Properties
// ===========================================

import { appendEvent, EventTypes } from '../../core/eventStore.js';
import { projectState } from '../../core/projections.js';
import { showSheet, hideAllSheets } from '../../ui/sheets.js';
import { showToast } from '../../ui/toast.js';
import { render } from '../../ui/feed.js';

let editingElementId = null;
let editingPropertyId = null;
let pendingPropagation = null; // { propNames, fromElementId }

export function openPropertySheet(elementId, propertyId = null) {
  const state = projectState();
  const element = state.elements[elementId];
  if (!element) return;
  
  editingElementId = elementId;
  editingPropertyId = propertyId;
  
  const sheet = document.getElementById('propertySheet');
  const title = document.getElementById('propertySheetTitle');
  const nameInput = document.getElementById('propertyNameInput');
  const typeSelect = document.getElementById('propertyTypeSelect');
  const deleteBtn = document.getElementById('deletePropertyBtn');
  
  if (propertyId) {
    // Editing existing property
    const prop = element.properties.find(p => p.id === propertyId);
    if (prop) {
      title.textContent = `Edit Property`;
      nameInput.value = prop.name;
      typeSelect.value = prop.type || 'string';
      deleteBtn.style.display = 'block';
    }
  } else {
    // Adding new property
    title.textContent = `Add Property to ${element.name}`;
    nameInput.value = '';
    typeSelect.value = 'string';
    deleteBtn.style.display = 'none';
  }
  
  showSheet('propertySheet');
  setTimeout(() => nameInput.focus(), 300);
}

export function saveProperty() {
  const nameInput = document.getElementById('propertyNameInput');
  const typeSelect = document.getElementById('propertyTypeSelect');
  
  const name = nameInput.value.trim();
  if (!name || !editingElementId) return;
  
  const propertyType = typeSelect.value;
  
  if (editingPropertyId) {
    // Update existing property
    appendEvent('PropertyUpdated', {
      elementId: editingElementId,
      propertyId: editingPropertyId,
      name,
      propertyType
    });
    showToast('Property updated');
  } else {
    // Add new property — support comma-separated names
    const names = name.split(',').map(n => n.trim()).filter(Boolean);
    const savedElementId = editingElementId;
    names.forEach((n, i) => {
      appendEvent(EventTypes.PropertyAdded, {
        elementId: savedElementId,
        propertyId: 'prop_' + Date.now() + '_' + i,
        name: n,
        propertyType
      });
    });

    editingElementId = null;
    editingPropertyId = null;
    hideAllSheets();
    render();

    // Offer propagation to downstream elements
    const downstream = getDownstreamElements(savedElementId);
    if (downstream.length > 0) {
      openPropagateSheet(names, savedElementId, downstream);
    } else {
      showToast(names.length > 1 ? `${names.length} properties added` : 'Property added');
    }
    return;
  }

  editingElementId = null;
  editingPropertyId = null;
  hideAllSheets();
  render();
}

// Find connected downstream elements (command → event → readModel)
function getDownstreamElements(elementId) {
  const state = projectState();
  const el = state.elements[elementId];
  if (!el) return [];

  const downstream = [];

  if (el.type === 'command') {
    // command → events via 'produces' or 'producer'
    state.connections
      .filter(c => c.from === elementId && (c.relation === 'produces' || c.relation === 'producer'))
      .forEach(c => { if (state.elements[c.to]) downstream.push(state.elements[c.to]); });
    // also reverse: event → command via 'producer'
    state.connections
      .filter(c => c.to === elementId && c.relation === 'producer')
      .forEach(c => { if (state.elements[c.from]) downstream.push(state.elements[c.from]); });
  } else if (el.type === 'event') {
    // event → readModels via 'consumer' or 'updatedBy'
    state.connections
      .filter(c => (c.from === elementId && c.relation === 'consumer') || (c.to === elementId && c.relation === 'updatedBy'))
      .forEach(c => {
        const targetId = c.from === elementId ? c.to : c.from;
        if (state.elements[targetId]?.type === 'readModel') downstream.push(state.elements[targetId]);
      });
  } else if (el.type === 'screen') {
    // screen → command
    state.connections
      .filter(c => c.from === elementId && (c.relation === 'input' || c.relation === 'triggers'))
      .forEach(c => { if (state.elements[c.to]) downstream.push(state.elements[c.to]); });
  }

  // Deduplicate
  return [...new Map(downstream.map(e => [e.id, e])).values()];
}

function openPropagateSheet(propNames, fromElementId, targets) {
  pendingPropagation = { propNames, fromElementId };

  const state = projectState();
  const fromEl = state.elements[fromElementId];

  document.getElementById('propagateSubtitle').textContent =
    `"${propNames.join(', ')}" added to ${fromEl?.name}`;

  document.getElementById('propagateTargets').innerHTML = targets.map(t => `
    <label class="checkbox-item" style="display:flex; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid var(--border);">
      <input type="checkbox" checked data-element-id="${t.id}">
      <span class="element-type-dot ${t.type}"></span>
      <span>${t.name}</span>
    </label>
  `).join('');

  showSheet('propagateSheet');
}

export function confirmPropagate() {
  if (!pendingPropagation) return;
  const { propNames } = pendingPropagation;

  const checked = [...document.querySelectorAll('#propagateTargets input[type=checkbox]:checked')];
  const state = projectState();

  checked.forEach(cb => {
    const targetId = cb.dataset.elementId;
    const el = state.elements[targetId];
    if (!el) return;
    propNames.forEach((n, i) => {
      // Skip if prop with same name already exists
      if (!el.properties?.find(p => p.name === n)) {
        appendEvent(EventTypes.PropertyAdded, {
          elementId: targetId,
          propertyId: 'prop_' + Date.now() + '_' + i + '_' + targetId,
          name: n,
          propertyType: 'string'
        });
      }
    });
  });

  pendingPropagation = null;
  hideAllSheets();
  showToast(`Propagated to ${checked.length} element${checked.length !== 1 ? 's' : ''}`);
  render();
}

export function skipPropagate() {
  pendingPropagation = null;
  hideAllSheets();
  showToast('Properties added');
}

export function deleteProperty() {
  if (!editingElementId || !editingPropertyId) return;
  
  if (!confirm('Delete this property?')) return;
  
  appendEvent(EventTypes.PropertyRemoved, {
    elementId: editingElementId,
    propertyId: editingPropertyId
  });
  
  editingElementId = null;
  editingPropertyId = null;
  hideAllSheets();
  showToast('Property deleted');
  render();
}

export function renameElement(elementId) {
  const state = projectState();
  const element = state.elements[elementId];
  if (!element) return;
  
  const newName = prompt('Rename element:', element.name);
  if (!newName || newName === element.name) return;
  
  appendEvent('ElementRenamed', {
    elementId,
    name: newName
  });
  
  showToast('Element renamed');
  render();
}

// Initialize
export function initProperties() {
  const nameInput = document.getElementById('propertyNameInput');
  if (nameInput) {
    nameInput.onkeydown = (e) => {
      if (e.key === 'Enter') saveProperty();
    };
  }
}
