export const calendarKinds = ['gregorian', 'lunar'] as const;
export type CalendarKind = (typeof calendarKinds)[number];

export const birthInputSources = ['user-entered', 'imported', 'test-fixture'] as const;
export type BirthInputSource = (typeof birthInputSources)[number];

export const chartSystems = ['zi-wei-dou-shu', 'ba-zi'] as const;
export type ChartSystem = (typeof chartSystems)[number];

export const chartSexValues = ['male', 'female', 'unknown'] as const;
export type ChartSexValue = (typeof chartSexValues)[number];

export const trueSolarTimeStatuses = ['deferred', 'resolved', 'unavailable'] as const;
export type TrueSolarTimeStatus = (typeof trueSolarTimeStatuses)[number];

export const ruleSourcePriorities = [
  'iztro-first',
  'lunar-javascript-first',
  'manual-canonical-fixture',
] as const;
export type RuleSourcePriority = (typeof ruleSourcePriorities)[number];
