/**
 * Validate that a URL is a valid GitHub repository URL.
 * Accepts: https://github.com/owner/repo or https://github.com/owner/repo.git
 */
export function isValidGitHubRepoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'github.com') return false;
    // Path should be /owner/repo or /owner/repo.git
    const pathMatch = parsed.pathname.match(/^\/[\w.-]+\/[\w.-]+(\.git)?$/);
    return pathMatch !== null;
  } catch {
    return false;
  }
}
