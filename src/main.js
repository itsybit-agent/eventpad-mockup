// ===========================================
// EVENTPAD - Main Entry Point
// ===========================================

import { loadEventStream } from './core/eventStore.js';
import { initSheets } from './ui/sheets.js';
import { render as renderFeed, toggleElement, jumpToElementSlice } from './ui/feed.js';

// Features
import { openCreateSheet, selectType, submitCreateElement, initCreateElement } from './features/createElement/sheet.js';
import { showActions } from './features/connect/actionSheet.js';
import { dispatchConnection } from './features/connect/command.js';
import { showPicker, pickElement, showSVPicker, pickSVTrigger, showMultiPicker, toggleMultiPickerItem, confirmMultiPick } from './features/connect/pickers.js';
import { promptSliceName, dispatchNameSlice, dismissSlicePrompt, initNameSlice } from './features/nameSlice/sheet.js';
import { undo, clearAll } from './features/undo/command.js';
import { toggleEventLog, copyEvent, copyAllEvents } from './features/eventLog/panel.js';
import { openPropertySheet, saveProperty, deleteProperty, renameElement, initProperties } from './features/properties/sheet.js';
import { deleteElement } from './features/deleteElement/command.js';
import { openElementMenu, menuRename, menuProperties, menuConnect, menuDelete } from './features/elementMenu/sheet.js';
import { showAddScenarioSheet, showScenarioEditorSheet } from './features/scenarios/sheet.js';
import { projectState } from './core/projections.js';

// ===========================================
// GLOBAL API (for onclick handlers in HTML)
// ===========================================

window.EventPad = {
  // createElement
  selectType,
  submitCreateElement,
  
  // connect
  showActions,
  dispatchConnection,
  showPicker,
  pickElement,
  showSVPicker,
  pickSVTrigger,
  showMultiPicker,
  toggleMultiPickerItem,
  confirmMultiPick,
  
  // nameSlice
  promptSliceName,
  dispatchNameSlice,
  dismissSlicePrompt,
  
  // undo
  undo,
  clearAll,
  
  // eventLog
  toggleEventLog,
  copyEvent,
  copyAllEvents,
  
  // feed
  toggleElement,
  jumpToElementSlice,
  
  // properties
  openPropertySheet,
  saveProperty,
  deleteProperty,
  renameElement,
  
  // deleteElement
  deleteElement,
  
  // elementMenu
  openElementMenu,
  menuRename,
  menuProperties,
  menuConnect,
  menuDelete,
  
  // scenarios
  addScenario: (sliceId, sliceType) => {
    showAddScenarioSheet(sliceId, sliceType, (scenarioId) => {
      // After adding, open the editor
      const state = projectState();
      const scenario = state.scenarios[scenarioId];
      const slice = state.slices[sliceId];
      if (scenario && slice) {
        showScenarioEditorSheet(scenario, slice, renderFeed);
      } else {
        renderFeed();
      }
    });
  },
  editScenario: (scenarioId) => {
    const state = projectState();
    const scenario = state.scenarios[scenarioId];
    if (scenario) {
      const slice = state.slices[scenario.sliceId];
      if (slice) {
        showScenarioEditorSheet(scenario, slice, renderFeed);
      }
    }
  }
};

// ===========================================
// INITIALIZATION
// ===========================================

function init() {
  // Load saved events
  loadEventStream();
  
  // Initialize UI components
  initSheets();
  initCreateElement();
  initNameSlice();
  initProperties();
  
  // Wire up FAB
  document.getElementById('fab').onclick = openCreateSheet;
  
  // Wire up header buttons
  document.getElementById('undoBtn').onclick = undo;
  document.querySelector('.header-btn:last-child').onclick = clearAll;
  
  // Wire up event log toggle
  document.querySelector('.event-log-toggle').onclick = toggleEventLog;
  
  // Wire up copy all button
  document.querySelector('.event-log-header .header-btn').onclick = copyAllEvents;
  
  // Initial render
  renderFeed();
  
  console.log('🟧 EventPad initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
