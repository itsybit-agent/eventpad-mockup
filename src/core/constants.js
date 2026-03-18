// Event Types
export const EventTypes = {
  // Element events
  ElementCreated: 'ElementCreated',
  ElementDeleted: 'ElementDeleted',
  PropertyAdded: 'PropertyAdded',
  PropertyRemoved: 'PropertyRemoved',
  
  // Connection events
  ProducerSet: 'ProducerSet',
  ConsumerAdded: 'ConsumerAdded',
  TriggerSet: 'TriggerSet',
  ProcessorOutputSet: 'ProcessorOutputSet',
  InputScreenSet: 'InputScreenSet',
  DisplayScreenSet: 'DisplayScreenSet',
  
  // Slice events
  SliceInferred: 'SliceInferred',
  SliceNamed: 'SliceNamed',
  SliceDeleted: 'SliceDeleted',
  SliceElementAdded: 'SliceElementAdded',
  SliceElementRemoved: 'SliceElementRemoved',
  SliceCompleted: 'SliceCompleted',
  
  // Scenario events
  ScenarioAdded: 'ScenarioAdded',
  ScenarioDeleted: 'ScenarioDeleted',
  GivenSet: 'GivenSet',
  WhenSet: 'WhenSet',
  ThenEventSet: 'ThenEventSet',
  ThenRejectionSet: 'ThenRejectionSet',
  ThenReadModelSet: 'ThenReadModelSet'
};

// Element type icons
export const typeIcons = {
  event: '🟧',
  command: '🟦',
  readModel: '🟩',
  screen: '⏹️',
  processor: '⚙️'
};

// Element type labels
export const typeLabels = {
  event: 'Event',
  command: 'Command',
  readModel: 'Read Model',
  screen: 'Screen',
  processor: 'Processor'
};

// Element actions by type
export const elementActions = {
  event: [
    { label: 'What produces this?', target: 'command', relation: 'producer', sliceType: 'SC' },
    { label: 'What does this update?', target: 'readModel', relation: 'consumer', sliceType: 'SV' }
  ],
  command: [
    { label: 'What screen triggers this?', target: 'screen', relation: 'input' },
    { label: 'What events does this produce?', target: 'event', relation: 'produces', sliceType: 'SC' }
  ],
  readModel: [
    { label: 'Pick source events', target: 'event', relation: 'updatedBy', sliceType: 'SV', multiPicker: true },
    { label: 'Create new source event', target: 'event', relation: 'updatedBy', sliceType: 'SV' },
    { label: 'What screen displays this?', target: 'screen', relation: 'display' }
  ],
  processor: [
    { label: 'What triggers this?', target: 'event', relation: 'trigger', svPicker: true },
    { label: 'What additional context?', target: 'readModel', relation: 'context', picker: true },
    { label: 'What command does this invoke?', target: 'command', relation: 'invokes', picker: true }
  ],
  screen: [
    { label: 'Connect to command', target: 'command', relation: 'triggers', picker: true },
    { label: 'Connect to read model', target: 'readModel', relation: 'displays', picker: true }
  ]
};

// Connection labels
export const connectionLabels = {
  producer: 'produces',
  consumer: 'updates',
  trigger: 'triggers',
  invokes: 'invokes',
  input: 'triggered by',
  display: 'displayed on',
  produces: 'produces',
  updatedBy: 'updated by',
  triggers: 'triggers',
  displays: 'displays',
  context: 'uses context'
};

export const reverseConnectionLabels = {
  producer: 'produced by',
  consumer: 'updated by',
  trigger: 'triggered by',
  invokes: 'invoked by',
  produces: 'produced by',
  triggers: 'triggered by',
  displays: 'displayed by',
  input: 'triggers',
  display: 'displays'
};
