export const BAKE_CATEGORIES = {
  code: {
    value: 'code',
    label: 'Code',
    description: 'Writing, fixing, reviewing code',
  },
  research: {
    value: 'research',
    label: 'Research',
    description: 'Gathering information, analysis',
  },
  content: {
    value: 'content',
    label: 'Content',
    description: 'Writing docs, articles, content',
  },
  data: {
    value: 'data',
    label: 'Data',
    description: 'Data processing, transformation',
  },
  automation: {
    value: 'automation',
    label: 'Automation',
    description: 'Scripts, workflows, integrations',
  },
  other: {
    value: 'other',
    label: 'Other',
    description: 'Anything else',
  },
} as const;

export type BakeCategory = keyof typeof BAKE_CATEGORIES;
export const VALID_CATEGORIES = Object.keys(BAKE_CATEGORIES) as BakeCategory[];

// Legacy aliases for backward compatibility during migration
export const TASK_CATEGORIES = BAKE_CATEGORIES;
export type TaskCategory = BakeCategory;
