// Performance optimizations utility

/**
 * Debounce function - limits how often a function can be called
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified period
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Detect if the device is a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get device performance tier (low, medium, high)
 * Uses hardware concurrency as a proxy for device capability
 */
export function getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
  if (typeof navigator === 'undefined') return 'medium';
  
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  
  if (hardwareConcurrency <= 2) return 'low';
  if (hardwareConcurrency <= 4) return 'medium';
  return 'high';
}

/**
 * Apply appropriate animation settings based on device performance
 */
export function getOptimizedAnimations() {
  const performanceTier = getDevicePerformanceTier();
  const isMobile = isMobileDevice();
  
  return {
    enableFancyAnimations: performanceTier === 'high' && !isMobile,
    transitionDuration: isMobile ? '150ms' : '300ms',
    enableParallaxEffects: performanceTier === 'high',
    reducedMotion: typeof window !== 'undefined' ? 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  };
}

/**
 * Lazy load an image and run a callback when loaded
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = reject;
  });
}
