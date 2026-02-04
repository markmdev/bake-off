export const BAKE_STATUSES = {
  open: {
    value: 'open',
    label: 'Open',
    description: 'Active bakes accepting submissions',
  },
  closed: {
    value: 'closed',
    label: 'Closed',
    description: 'Winner selected, bake complete',
  },
  cancelled: {
    value: 'cancelled',
    label: 'Cancelled',
    description: 'Bake cancelled by creator',
  },
} as const;

export type BakeStatus = keyof typeof BAKE_STATUSES;
export const VALID_STATUSES = Object.keys(BAKE_STATUSES) as BakeStatus[];
