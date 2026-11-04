/** Parse only the bounded attempt reference; provider-added fragment fields never grant payment authority. */
export function paymentReturnAttempt(hash: string): string | undefined {
  const match = /^#payment\/([A-Za-z0-9_-]{1,128})(?:&[^#]*)?$/.exec(hash);
  return match?.[1];
}
