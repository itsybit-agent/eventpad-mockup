// ===========================================
// PROJECTIONS (Read Models)
// ===========================================

import { getEventStream, EventTypes } from './eventStore.js';

// Element ordering hierarchy (top to bottom)
// Screens/Processors → Commands/ReadModels → Events
function getElementOrder(elementType) {
  const order = {
    'screen': 1,
    'processor': 1,
    'command': 2,
    'readModel': 3,
    'event': 4
  };
  return order[elementType] || 5;
}

export function sortSliceElements(elements, state) {
  return [...elements].sort((a, b) => {
    const typeA = state.elements[a]?.type;
    const typeB = state.elements[b]?.type;
    return getElementOrder(typeA) - getElementOrder(typeB);
  });
}

export function projectState() {
  const eventStream = getEventStream();
  
  const state = {
    elements: {},      // id -> element
    slices: {},        // id -> slice
    connections: [],   // { from, to, relation }
    scenarios: {},     // id -> scenario
    pendingSlice: null
  };

  for (const event of eventStream) {
    switch (event.type) {
      case EventTypes.ElementCreated:
        state.elements[event.data.elementId] = {
          id: event.data.elementId,
          type: event.data.elementType,
          name: event.data.name,
          properties: []
        };
        break;
        
      case EventTypes.ElementDeleted:
        delete state.elements[event.data.elementId];
        break;
        
      case EventTypes.PropertyAdded:
        if (state.elements[event.data.elementId]) {
          state.elements[event.data.elementId].properties.push({
            id: event.data.propertyId,
            name: event.data.name,
            type: event.data.propertyType
          });
        }
        break;
      
      case 'PropertyUpdated':
        if (state.elements[event.data.elementId]) {
          const props = state.elements[event.data.elementId].properties;
          const idx = props.findIndex(p => p.id === event.data.propertyId);
          if (idx >= 0) {
            props[idx] = {
              id: event.data.propertyId,
              name: event.data.name,
              type: event.data.propertyType
            };
          }
        }
        break;
        
      case EventTypes.PropertyRemoved:
        if (state.elements[event.data.elementId]) {
          state.elements[event.data.elementId].properties = 
            state.elements[event.data.elementId].properties.filter(
              p => p.id !== event.data.propertyId
            );
        }
        break;
        
      case 'ElementRenamed':
        if (state.elements[event.data.elementId]) {
          state.elements[event.data.elementId].name = event.data.name;
        }
        break;
        
      case EventTypes.ProducerSet:
      case EventTypes.ConsumerAdded:
      case EventTypes.TriggerSet:
      case EventTypes.ProcessorOutputSet:
      case EventTypes.InputScreenSet:
      case EventTypes.DisplayScreenSet:
        state.connections.push({
          from: event.data.fromId,
          to: event.data.toId,
          relation: event.data.relation
        });
        break;
        
      case EventTypes.SliceInferred:
        state.slices[event.data.sliceId] = {
          id: event.data.sliceId,
          type: event.data.sliceType,
          elements: sortSliceElements(event.data.elements, state),
          name: null,
          complete: event.data.complete
        };
        if (!event.data.complete || !state.slices[event.data.sliceId].name) {
          state.pendingSlice = event.data.sliceId;
        }
        break;
        
      case EventTypes.SliceNamed:
        if (state.slices[event.data.sliceId]) {
          state.slices[event.data.sliceId].name = event.data.name;
          if (state.pendingSlice === event.data.sliceId) {
            state.pendingSlice = null;
          }
        }
        break;
      
      case EventTypes.SliceElementAdded:
      case 'SliceElementAdded':
        if (state.slices[event.data.sliceId]) {
          const slice = state.slices[event.data.sliceId];
          slice.elements.push(event.data.elementId);
          slice.elements = sortSliceElements(slice.elements, state);
        }
        break;
        
      case EventTypes.SliceElementRemoved:
        if (state.slices[event.data.sliceId]) {
          const slice = state.slices[event.data.sliceId];
          slice.elements = slice.elements.filter(id => id !== event.data.elementId);
        }
        break;
        
      case EventTypes.SliceDeleted:
        delete state.slices[event.data.sliceId];
        break;
      
      case EventTypes.SliceCompleted:
      case 'SliceCompleted':
        if (state.slices[event.data.sliceId]) {
          state.slices[event.data.sliceId].complete = true;
        }
        break;
        
      // Scenario events
      case EventTypes.ScenarioAdded:
        state.scenarios[event.data.scenarioId] = {
          id: event.data.scenarioId,
          sliceId: event.data.sliceId,
          name: event.data.name,
          type: event.data.scenarioType,
          given: [],
          when: null,
          then: null
        };
        break;
        
      case EventTypes.ScenarioDeleted:
        delete state.scenarios[event.data.scenarioId];
        break;
        
      case EventTypes.GivenSet:
        if (state.scenarios[event.data.scenarioId]) {
          state.scenarios[event.data.scenarioId].given = event.data.events;
        }
        break;
        
      case EventTypes.WhenSet:
        if (state.scenarios[event.data.scenarioId]) {
          state.scenarios[event.data.scenarioId].when = {
            commandId: event.data.commandId,
            values: event.data.values
          };
        }
        break;
        
      case EventTypes.ThenEventSet:
        if (state.scenarios[event.data.scenarioId]) {
          state.scenarios[event.data.scenarioId].then = {
            type: 'event',
            eventId: event.data.eventId,
            values: event.data.values
          };
        }
        break;
        
      case EventTypes.ThenRejectionSet:
        if (state.scenarios[event.data.scenarioId]) {
          state.scenarios[event.data.scenarioId].then = {
            type: 'rejection',
            reason: event.data.reason
          };
        }
        break;
        
      case EventTypes.ThenReadModelSet:
        if (state.scenarios[event.data.scenarioId]) {
          state.scenarios[event.data.scenarioId].then = {
            type: 'readModel',
            readModelId: event.data.readModelId,
            values: event.data.values
          };
        }
        break;
    }
  }

  return state;
}

// Find slice containing an element
export function findSliceForElement(elementId, state = null) {
  state = state || projectState();
  return Object.values(state.slices).find(s => s.elements.includes(elementId));
}

// Find non-AU slice containing an element (source slice)
export function findSourceSlice(elementId, state = null) {
  state = state || projectState();
  return Object.values(state.slices).find(s => 
    s.type !== 'AU' && s.elements.includes(elementId)
  );
}

// Get scenarios for a slice
export function getScenariosForSlice(sliceId, state = null) {
  state = state || projectState();
  return Object.values(state.scenarios).filter(s => s.sliceId === sliceId);
}
