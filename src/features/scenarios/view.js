// ===========================================
// SCENARIOS - View (SV: View Scenario)
// ===========================================

// Render scenario section for a slice (element-level only)
export function renderScenarioSection(scenarios, state) {
  if (!scenarios || scenarios.length === 0) return '';
  
  const cards = scenarios.map(scn => {
    // Build preview with colored references (Given/And/When/Then format)
    let previewLines = [];
    
    if (scn.given?.length > 0) {
      scn.given.forEach((g, i) => {
        const el = state.elements[g.elementId];
        if (el) {
          const keyword = i === 0 ? 'Given' : 'And';
          previewLines.push(`<span class="keyword">${keyword}</span> <span class="event-ref">${el.name}</span>`);
        }
      });
    }
    
    if (scn.type === 'SC' && scn.when?.commandId) {
      const cmd = state.elements[scn.when.commandId];
      if (cmd) {
        previewLines.push(`<span class="keyword">When</span> <span class="command-ref">${cmd.name}</span>`);
      }
    }
    
    if (scn.then) {
      if (scn.then.type === 'event') {
        const evt = state.elements[scn.then.eventId];
        if (evt) {
          previewLines.push(`<span class="keyword">Then</span> <span class="event-ref">${evt.name}</span>`);
        }
      } else if (scn.then.type === 'rejection') {
        previewLines.push(`<span class="keyword">Then</span> <span class="rejection-ref">Rejected: "${scn.then.reason || ''}"</span>`);
      } else if (scn.then.type === 'readModel') {
        const rm = state.elements[scn.then.readModelId];
        if (rm) {
          previewLines.push(`<span class="keyword">Then</span> <span class="rm-ref">${rm.name}</span>`);
        }
      }
    }
    
    return `
      <div class="scenario-card" onclick="window.EventPad.editScenario('${scn.id}')">
        <span class="close-btn" onclick="event.stopPropagation(); window.EventPad.deleteScenario('${scn.id}')">×</span>
        <div class="scenario-header">
          <span class="scenario-name">${scn.name}</span>
        </div>
        <div class="scenario-preview">${previewLines.join('<br>') || 'Tap to edit...'}</div>
      </div>
    `;
  }).join('');
  
  const sliceId = scenarios[0]?.sliceId || '';
  const sliceType = scenarios[0]?.type || 'SC';
  
  return `
    <div class="scenarios-section">
      <h4>SCENARIOS (${scenarios.length})</h4>
      ${cards}
      <button class="add-scenario-btn" onclick="event.stopPropagation(); window.EventPad.addScenario('${sliceId}', '${sliceType}')">+ Add scenario</button>
    </div>
  `;
}
