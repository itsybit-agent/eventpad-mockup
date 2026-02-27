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
    // Add new property
    const propertyId = 'prop_' + Date.now();
    appendEvent(EventTypes.PropertyAdded, {
      elementId: editingElementId,
      propertyId,
      name,
      propertyType
    });
    showToast('Property added');
  }
  
  editingElementId = null;
  editingPropertyId = null;
  hideAllSheets();
  render();
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
