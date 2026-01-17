let isFirstInvocation = true;
let firstInvocationTimestamp: number | null = null;

/**
 * Returns true on the first invocation within a serverless runtime instance.
 * Subsequent calls within the same instance return false.
 */
export function isColdStart(): boolean {
  if (isFirstInvocation) {
    isFirstInvocation = false;
    firstInvocationTimestamp = Date.now();
    return true;
  }
  return false;
}

export function getColdStartInfo() {
  return {
    firstInvocationTimestamp,
  };
}
