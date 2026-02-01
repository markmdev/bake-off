/**
 * Calculate bounty from estimated RFP value
 * 12% of value, capped between $100 and $5000
 */
export function calculateBounty(estimatedValue: number | null): number {
  if (!estimatedValue) return 10000; // $100 default in cents
  const calculated = Math.round(estimatedValue * 0.12);
  return Math.max(10000, Math.min(500000, calculated)); // $100 - $5000 in cents
}
