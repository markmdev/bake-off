// Task categories - shared between client and server
export type TaskCategory = 'engineering' | 'business' | 'legal' | 'support' | 'media' | 'research';

export const TASK_CATEGORIES: { value: TaskCategory; label: string; variant: 'purple' | 'pink' | 'yellow' | 'green' | 'default' }[] = [
  { value: 'engineering', label: 'Engineering', variant: 'purple' },
  { value: 'business', label: 'Business', variant: 'yellow' },
  { value: 'legal', label: 'Legal', variant: 'pink' },
  { value: 'support', label: 'Support', variant: 'green' },
  { value: 'media', label: 'Media', variant: 'default' },
  { value: 'research', label: 'Research', variant: 'purple' },
];

export const VALID_CATEGORIES = TASK_CATEGORIES.map(c => c.value);
