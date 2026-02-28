/**
 * Escape special regex characters in a string so it can be safely used in RegExp.
 * Prevents ReDoS and unintended regex behavior when building patterns from user input.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()[\]\\|]/g, "\\$&");
}
