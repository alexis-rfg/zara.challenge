const RELATIVE_URL_PREFIXES = ['/', './', '../'] as const;

const isRelativeUrl = (value: string): boolean => {
  return RELATIVE_URL_PREFIXES.some((prefix) => value.startsWith(prefix));
};

/**
 * Normalizes remote asset URLs to HTTPS and rejects unsupported protocols.
 *
 * Relative application assets are allowed as-is. Absolute `http://` URLs are
 * upgraded to `https://` to avoid mixed-content failures on HTTPS deployments.
 *
 * @param value - Raw asset URL.
 * @returns A safe URL string suitable for use in image `src` attributes.
 * @throws {Error} When the URL is empty, malformed, or uses an unsupported protocol.
 */
export const toSecureAssetUrl = (value: string): string => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error('Asset URL cannot be empty');
  }

  if (isRelativeUrl(trimmedValue)) {
    return trimmedValue;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error(`Asset URL is invalid: ${trimmedValue}`);
  }

  if (parsedUrl.protocol === 'http:') {
    parsedUrl.protocol = 'https:';
    return parsedUrl.toString();
  }

  if (parsedUrl.protocol === 'https:') {
    return parsedUrl.toString();
  }

  throw new Error(`Asset URL uses unsupported protocol: ${parsedUrl.protocol}`);
};
