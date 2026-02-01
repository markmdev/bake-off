/**
 * Simple djb2 hash algorithm for generating consistent hash values from strings.
 * Useful for deterministic mock data generation.
 */
export function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/**
 * Converts a hash value to a number within a specified range.
 * @param hash - The hash value to convert
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @param offset - Optional offset to get different values from the same hash
 * @returns A number in the range [min, max]
 */
export function hashToRange(
  hash: number,
  min: number,
  max: number,
  offset?: number
): number {
  return min + ((hash + (offset || 0)) % (max - min + 1));
}
