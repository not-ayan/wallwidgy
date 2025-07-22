import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detects if the current device might have limited GPU capabilities
 * where blur effects could cause performance issues
 */
export function shouldDisableBlurEffects(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for low memory devices (common indicator of limited GPU)
  const lowMemory = (navigator as any).deviceMemory !== undefined && (navigator as any).deviceMemory < 4;
  
  // Check for older mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  
  // Check for older browsers or specific problematic devices
  const isOldBrowser = 
    /msie|trident/.test(userAgent) || // IE
    (/safari/.test(userAgent) && !/chrome/.test(userAgent) && parseInt((userAgent.match(/version\/(\d+)/) || ['', '0'])[1], 10) < 13); // Older Safari
    
  // Check for hardware concurrency (CPU cores - limited cores often mean limited GPU)
  const limitedCores = navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency < 4;
  
  // Attempt to detect if backdrop-filter is supported
  let supportsBackdropFilter = false;
  try {
    supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)');
  } catch (e) {
    // If CSS.supports is not available or fails, assume no support
    supportsBackdropFilter = false;
  }
  
  // Return true if any conditions suggest we should disable blur
  return (lowMemory && isMobile) || isOldBrowser || (limitedCores && isMobile) || !supportsBackdropFilter;
}
