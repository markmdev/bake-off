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

// Category colors for UI display
export const CATEGORY_COLORS: Record<BakeCategory, { bg: string; text: string }> = {
  code: { bg: '#D0E0FF', text: '#0047AB' },
  research: { bg: '#E0F2FE', text: '#0369A1' },
  content: { bg: '#FFF4D1', text: '#B8860B' },
  data: { bg: '#E8F5E9', text: '#2C5F2D' },
  automation: { bg: '#FFEAFA', text: '#D946A0' },
  other: { bg: '#EEE', text: '#666' },
};

// Legacy aliases for backward compatibility during migration
export const TASK_CATEGORIES = BAKE_CATEGORIES;
export type TaskCategory = BakeCategory;
