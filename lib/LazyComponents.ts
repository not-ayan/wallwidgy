// LazyComponents.ts - Utility for lazy loading components

import dynamic from 'next/dynamic';

// Import heavy components with dynamic loading
export const LazyWallpaperModal = dynamic(
  () => import('../app/components/WallpaperModal'),
  { 
    loading: () => null,
    ssr: false
  }
);

export const LazyShareFavoritesModal = dynamic(
  () => import('../app/components/ShareFavoritesModal'),
  { 
    loading: () => null,
    ssr: false
  }
);

// BottomSheet component removed as it was unused
