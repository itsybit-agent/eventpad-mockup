// ===========================================
// CREATE ELEMENT - UI Sheet
// ===========================================

import { typeLabels } from '../../core/constants.js';
import { showSheet, hideSheet, hideAllSheets } from '../../ui/sheets.js';
import { showToast } from '../../ui/toast.js';
import { dispatchCreateElement } from './command.js';
import { render } from '../../ui/feed.js';

let selectedType = null;

export function getSelectedType() {
  return selectedType;
}

export function selectType(type) {
  selectedType = type;
  hideSheet('createSheet');
  document.getElementById('nameSheetTitle').textContent = `Name your ${typeLabels[type]}`;
  document.getElementById('elementNameInput').value = '';
  showSheet('nameSheet');
  setTimeout(() => document.getElementById('elementNameInput').focus(), 300);
}

export function submitCreateElement() {
  const name = document.getElementById('elementNameInput').value.trim();
  if (!name || !selectedType) return;

  dispatchCreateElement(selectedType, name);

  hideAllSheets();
  showToast(`${typeLabels[selectedType]} created!`);
  render();
}

export function openCreateSheet() {
  showSheet('createSheet');
}

// Initialize
export function initCreateElement() {
  document.getElementById('elementNameInput').onkeydown = (e) => {
    if (e.key === 'Enter') submitCreateElement();
  };
}
