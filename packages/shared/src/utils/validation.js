/**
 * Check if string is a valid URL.
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if URL is a YouTube video URL.
 */
export function isYouTubeUrl(url) {
  if (!isValidUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtube.com') {
      return (
        parsed.pathname.startsWith('/watch') ||
        parsed.pathname.startsWith('/shorts/') ||
        parsed.pathname.startsWith('/embed/')
      );
    }
    return host === 'youtu.be';
  } catch {
    return false;
  }
}

/**
 * Check if URL is a Vimeo video URL.
 */
export function isVimeoUrl(url) {
  if (!isValidUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    return host === 'vimeo.com' && /^\/\d+/.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Check if URL points directly to a video file.
 */
export function isDirectVideoUrl(url) {
  if (!isValidUrl(url)) return false;
  const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.m4v'];
  const lowerUrl = url.toLowerCase().split('?')[0] ?? '';
  return videoExtensions.some((ext) => lowerUrl.endsWith(ext));
}

/**
 * Check if URL is from any supported video platform.
 */
export function isSupportedVideoUrl(url) {
  return isYouTubeUrl(url) || isVimeoUrl(url) || isDirectVideoUrl(url);
}

/**
 * Extract video ID from a YouTube URL.
 */
export function extractYouTubeId(url) {
  if (!isYouTubeUrl(url)) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace('www.', '');
    if (host === 'youtu.be') {
      return parsed.pathname.slice(1) || null;
    }
    if (parsed.pathname.startsWith('/shorts/')) {
      return parsed.pathname.split('/')[2] || null;
    }
    return parsed.searchParams.get('v');
  } catch {
    return null;
  }
}

/**
 * Validate email format.
 */
export function validateEmail(email) {
  return /^[\w.-]+@[\w.-]+\.\w{2,}$/.test(email);
}

/**
 * Validate password strength (min 8 chars, at least 1 letter and 1 number).
 */
export function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true };
}
