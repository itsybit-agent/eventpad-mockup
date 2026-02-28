// ===========================================
// SCENARIOS - Commands
// ===========================================

import { appendEvent, EventTypes } from '../../core/eventStore.js';

// Generate unique ID
function uid() {
  return 'scn_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// Add scenario to slice
export function addScenario(sliceId, name, scenarioType) {
  const scenarioId = uid();
  appendEvent(EventTypes.ScenarioAdded, {
    sliceId,
    scenarioId,
    name,
    scenarioType
  });
  return scenarioId;
}

// Delete scenario
export function deleteScenario(scenarioId, sliceId) {
  appendEvent(EventTypes.ScenarioDeleted, {
    scenarioId,
    sliceId
  });
}

// Set Given events
export function setGiven(scenarioId, events) {
  appendEvent(EventTypes.GivenSet, {
    scenarioId,
    events // [{elementId, values}]
  });
}

// Set When command (SC scenarios only)
export function setWhen(scenarioId, commandId, values) {
  appendEvent(EventTypes.WhenSet, {
    scenarioId,
    commandId,
    values
  });
}

// Set Then event (SC scenarios - success)
export function setThenEvent(scenarioId, eventId, values) {
  appendEvent(EventTypes.ThenEventSet, {
    scenarioId,
    eventId,
    values
  });
}

// Set Then rejection (SC scenarios - failure)
export function setThenRejection(scenarioId, reason) {
  appendEvent(EventTypes.ThenRejectionSet, {
    scenarioId,
    reason
  });
}

// Set Then read model (SV scenarios)
export function setThenReadModel(scenarioId, readModelId, values) {
  appendEvent(EventTypes.ThenReadModelSet, {
    scenarioId,
    readModelId,
    values
  });
}
