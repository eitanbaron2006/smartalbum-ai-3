
import React from 'react';

export interface PhotoTransform {
  x: number;
  y: number;
  scale: number;
}

export interface Photo {
  id: string;
  url: string;
  name: string;
  transform?: PhotoTransform;
}

export interface DesignSet {
  id: string;
  name: string;
  frontCoverUrl: string | null;
  backCoverUrl: string | null;
  backgroundUrl: string | null;
}

export interface AlbumSettings {
  albumTitle?: string;
  albumTitleFont: string;
  albumTitleColor: string;
  
  coverAiModel: string; // 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview'

  pageWidthCm: number;
  pageHeightCm: number;
  maxPhotosPerPage: number;
  
  // Outer page margin/padding
  pageMarginCm: number;
  coverPageMarginCm: number; // Specific margin for front cover
  pageBackgroundColor: string;
  defaultBackgroundImage?: string; // URL for global background
  
  // Photo borders/gap
  photoGapCm: number;
  coverPhotoGapCm: number; // Specific spacing for front cover
  
  // Photo Borders (Individual)
  photoBorderWidthMm: number;
  photoBorderColor: string;
  coverPhotoBorderWidthMm: number; // Specific for cover
  coverPhotoBorderColor: string;   // Specific for cover

  // Content Frame (Border around the whole grid)
  contentBorderWidthMm: number;
  contentBorderColor: string;
  
  // Shared/Saved backgrounds (simulated)
  savedBackgrounds: string[];
  savedDesignSets: DesignSet[];
}

// User & Album Management Types
export interface User {
  id: string;
  username: string;
  email: string; // Optional for simple auth
}

export interface AlbumData {
  photos: Photo[];
  settings: AlbumSettings;
  pages: AlbumPageData[];
}

export interface SavedAlbum {
  id: string;
  userId: string;
  name: string;
  thumbnailUrl?: string; // Optional preview of cover
  createdAt: number;
  updatedAt: number;
  data: AlbumData;
}

// Defines the bounding box of a specific shape (in percentages 0-100)
// This tells the editor where the "hole" is that the photo must cover.
export interface ShapeBounds {
  xPercent: number;
  yPercent: number;
  wPercent: number;
  hPercent: number;
}

export interface GridStyle {
  gridTemplateColumns: string;
  gridTemplateRows: string;
  gridTemplateAreas: string;
  isAiGenerated?: boolean;
  // Allows overriding style for specific photo indices (e.g. for absolute positioning or shapes)
  customWrapperStyle?: Record<number, React.CSSProperties>;
  // Explicit bounding boxes for irregular shapes to calculate drag constraints
  shapeBounds?: Record<number, ShapeBounds>;
  // Deprecated: allowUnsafePan (Replaced by precise shapeBounds logic)
  allowUnsafePan?: boolean; 
}

export interface AlbumPageData {
  id: string;
  photos: Photo[];
  layout?: GridStyle; // If undefined, use default auto-grid
  backgroundImage?: string; // Page-specific override
  isAiCover?: boolean;
  backup?: {
    photos: Photo[];
    layout?: GridStyle;
    isAiCover?: boolean;
    backgroundImage?: string;
  };
}

export const FONTS = [
  { name: 'Modern Sans', value: 'Inter, sans-serif' },
  { name: 'Classic Serif', value: '"Playfair Display", serif' },
  { name: 'Elegant', value: 'Merriweather, serif' },
  { name: 'Standard', value: 'Roboto, sans-serif' },
  { name: 'Handwritten', value: '"Dancing Script", cursive' },
];

export const DEFAULT_SETTINGS: AlbumSettings = {
  albumTitle: 'My Smart Album',
  albumTitleFont: '"Playfair Display", serif',
  albumTitleColor: '#FFFFFF',
  
  coverAiModel: 'gemini-2.5-flash-image',
  
  pageWidthCm: 20,
  pageHeightCm: 20,
  maxPhotosPerPage: 5,
  
  pageMarginCm: 0,
  coverPageMarginCm: 0,
  
  pageBackgroundColor: '#ffffff',
  
  photoGapCm: 0.1,
  coverPhotoGapCm: 0.1,
  
  photoBorderWidthMm: 0,
  photoBorderColor: '#ffffff',
  
  coverPhotoBorderWidthMm: 0,
  coverPhotoBorderColor: '#ffffff',

  contentBorderWidthMm: 0,
  contentBorderColor: '#000000',
  
  savedBackgrounds: [
     'https://images.unsplash.com/photo-1524964645367-176bd8e151dc?q=80&w=2670&auto=format&fit=crop', // Paper texture
     'https://images.unsplash.com/photo-1516981879613-9f5da904015f?q=80&w=2574&auto=format&fit=crop', // Wood texture
     'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2670&auto=format&fit=crop'  // Watercolor
  ],
  savedDesignSets: []
};
