// ===========================================
// ELEMENT MENU - Unified edit entry point
// ===========================================

import { projectState } from '../../core/projections.js';
import { typeIcons, typeLabels } from '../../core/constants.js';
import { showSheet, hideAllSheets } from '../../ui/sheets.js';
import { render } from '../../ui/feed.js';
import { openPropertySheet, renameElement } from '../properties/sheet.js';
import { deleteElement } from '../deleteElement/command.js';
import { showActions } from '../connect/actionSheet.js';

let currentElementId = null;

export function openElementMenu(elementId) {
  const state = projectState();
  const element = state.elements[elementId];
  if (!element) return;
  
  currentElementId = elementId;
  
  const title = document.getElementById('elementMenuTitle');
  const options = document.getElementById('elementMenuOptions');
  
  title.innerHTML = `
    <span style="display: inline-flex; align-items: center; gap: 8px;">
      <span style="background: var(--${element.type}); color: ${element.type === 'command' || element.type === 'processor' ? '#fff' : '#000'}; padding: 4px 8px; border-radius: 6px;">${typeIcons[element.type]}</span>
      ${element.name}
    </span>
  `;
  
  // Build properties preview
  const propsPreview = element.properties.length > 0 
    ? element.properties.slice(0, 3).map(p => p.name).join(', ') + (element.properties.length > 3 ? '...' : '')
    : 'No properties';
  
  options.innerHTML = `
    <div class="sheet-option" onclick="window.EventPad.menuRename()">
      <div class="sheet-option-icon" style="background: var(--surface-hover);">✏️</div>
      <div class="sheet-option-text">
        <div class="sheet-option-title">Rename</div>
        <div class="sheet-option-desc">Change element name</div>
      </div>
    </div>
    <div class="sheet-option" onclick="window.EventPad.menuProperties()">
      <div class="sheet-option-icon" style="background: var(--surface-hover);">📝</div>
      <div class="sheet-option-text">
        <div class="sheet-option-title">Properties</div>
        <div class="sheet-option-desc">${propsPreview}</div>
      </div>
    </div>
    <div class="sheet-option" onclick="window.EventPad.menuConnect()">
      <div class="sheet-option-icon" style="background: var(--surface-hover);">🔗</div>
      <div class="sheet-option-text">
        <div class="sheet-option-title">Connect</div>
        <div class="sheet-option-desc">Link to other elements</div>
      </div>
    </div>
    <div class="sheet-option" onclick="window.EventPad.menuDelete()" style="border-top: 1px solid var(--border); margin-top: 8px; padding-top: 8px;">
      <div class="sheet-option-icon" style="background: #c0392b;">🗑️</div>
      <div class="sheet-option-text">
        <div class="sheet-option-title" style="color: #e74c3c;">Delete</div>
        <div class="sheet-option-desc">Remove element</div>
      </div>
    </div>
  `;
  
  showSheet('elementMenuSheet');
}

export function menuRename() {
  hideAllSheets();
  if (currentElementId) {
    renameElement(currentElementId);
  }
}

export function menuProperties() {
  hideAllSheets();
  if (currentElementId) {
    openPropertySheet(currentElementId);
  }
}

export function menuConnect() {
  hideAllSheets();
  if (currentElementId) {
    // Small delay to let sheet close
    setTimeout(() => {
      showActions(currentElementId);
    }, 100);
  }
}

export function menuDelete() {
  hideAllSheets();
  if (currentElementId) {
    deleteElement(currentElementId);
  }
}

export function getCurrentMenuElementId() {
  return currentElementId;
}
