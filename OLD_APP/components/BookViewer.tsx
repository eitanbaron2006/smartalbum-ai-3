
import React, { useState, useEffect } from 'react';
import { AlbumPageData, AlbumSettings } from '../types';
import { AlbumPage } from './AlbumPage';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';

interface BookViewerProps {
  pages: AlbumPageData[];
  settings: AlbumSettings;
  onClose: () => void;
}

interface Spread {
  left: AlbumPageData | null;
  right: AlbumPageData | null;
  isCover?: boolean;
  isBackCover?: boolean;
}

export const BookViewer: React.FC<BookViewerProps> = ({ pages, settings, onClose }) => {
  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [spreads, setSpreads] = useState<Spread[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Construct the book spreads based on specific user rules
    if (pages.length === 0) return;

    const newSpreads: Spread[] = [];
    
    // 1. Front Cover Spread
    const frontCover = pages[0];
    newSpreads.push({ left: null, right: frontCover, isCover: true });

    // 2. First Single Page Spread
    if (pages.length > 2) {
      newSpreads.push({ left: null, right: pages[2] });
    }

    // 3. Content Spreads
    const contentPages = pages.slice(3);
    for (let i = 0; i < contentPages.length; i += 2) {
      const left = contentPages[i];
      const right = contentPages[i + 1] || null;
      newSpreads.push({ left, right });
    }

    // 4. Back Cover Spread
    if (pages.length > 1) {
      newSpreads.push({ left: pages[1], right: null, isBackCover: true });
    }

    setSpreads(newSpreads);
    setCurrentSpreadIndex(0);
  }, [pages]);

  const goToNext = () => {
    if (currentSpreadIndex < spreads.length - 1) {
      setCurrentSpreadIndex(prev => prev + 1);
    }
  };

  const goToPrev = () => {
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex(prev => prev - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSpreadIndex, spreads.length]);

  if (spreads.length === 0) return null;

  const currentSpread = spreads[currentSpreadIndex];

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1a1a] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at center, #333 0%, #000 100%)' }} />

      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 text-white/80">
        <div className="flex items-center gap-3">
           <BookOpen className="w-5 h-5" />
           <div className="flex flex-col">
              {settings.albumTitle && (
                <span className="font-bold text-lg leading-none text-white">{settings.albumTitle}</span>
              )}
              <span className="text-xs opacity-70 font-medium tracking-wide">
                SPREAD {currentSpreadIndex + 1} / {spreads.length}
              </span>
           </div>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all flex items-center gap-2 text-sm font-medium"
        >
          <X className="w-4 h-4" /> Exit Preview
        </button>
      </div>

      {/* Book Stage */}
      <div className="relative flex items-center justify-center w-full h-full p-4 md:p-10 perspective-[2000px]">
        
        {/* Previous Button */}
        <button 
          onClick={goToPrev}
          disabled={currentSpreadIndex === 0}
          className={`absolute z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-0 text-white transition-all backdrop-blur-md shadow-lg
            ${isMobile 
               ? 'top-[5vh] left-[5vw] rotate-90' 
               : 'left-4 md:left-8'
            }`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* The Book */}
        <div className="relative flex shadow-2xl transition-transform duration-500 ease-out"
             style={isMobile ? {
               // Mobile Landscape Mode Logic
               position: 'fixed',
               top: '50%',
               left: '50%',
               // Rotate 90deg to landscape
               transform: 'translate(-50%, -50%) rotate(90deg)',
               // Width becomes the viewport height (so the book is as wide as the phone is tall)
               width: '90vh', 
               // Aspect ratio controls height automatically
               aspectRatio: `${settings.pageWidthCm * 2} / ${settings.pageHeightCm}`,
               // Height (which is width on screen) shouldn't exceed screen width
               maxHeight: '90vw',
               zIndex: 40
             } : { 
               height: '85vh', 
               aspectRatio: `${settings.pageWidthCm * 2} / ${settings.pageHeightCm}`,
               maxHeight: '900px'
             }}>
          
          {/* Left Page Container */}
          <div className={`flex-1 relative overflow-hidden origin-right transition-all duration-500
                ${currentSpread.left ? 'shadow-[-15px_0_30px_-10px_rgba(0,0,0,0.5)]' : ''}
                ${currentSpreadIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}
              `}
               style={{ 
                 backgroundColor: settings.pageBackgroundColor,
                 borderTopLeftRadius: '4px', 
                 borderBottomLeftRadius: '4px',
                 transform: `rotateY(0deg)`,
                 transformStyle: 'preserve-3d'
               }}
          >
             {currentSpread.left && (
               <div className="w-full h-full origin-center">
                  <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/20 to-transparent z-20 pointer-events-none mix-blend-multiply" />
                  <AlbumPage 
                    page={currentSpread.left} 
                    pageNumber={-1} // Hide number
                    settings={settings} 
                    onUpdateLayout={() => {}} 
                    onUpdatePhotoTransform={() => {}} 
                    readOnly={true} 
                  />
               </div>
             )}
             {!currentSpread.left && currentSpreadIndex === 1 && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 font-serif italic">
                  Inside Front Cover
                </div>
             )}
          </div>

          {/* Spine / Center Fold */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0 z-30 shadow-[0_0_30px_5px_rgba(0,0,0,0.4)]" />

          {/* Right Page Container */}
          <div className={`flex-1 relative overflow-hidden origin-left transition-all duration-500
                 ${currentSpread.right ? 'shadow-[15px_0_30px_-10px_rgba(0,0,0,0.5)]' : ''}
                 ${currentSpreadIndex === spreads.length - 1 && !currentSpread.right ? 'opacity-0 pointer-events-none' : 'opacity-100'}
               `}
               style={{ 
                 backgroundColor: settings.pageBackgroundColor,
                 borderTopRightRadius: '4px', 
                 borderBottomRightRadius: '4px'
               }}
          >
             {currentSpread.right && (
               <div className="w-full h-full origin-center">
                  <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none mix-blend-multiply" />
                  <AlbumPage 
                    page={currentSpread.right} 
                    pageNumber={-1} 
                    settings={settings} 
                    onUpdateLayout={() => {}} 
                    onUpdatePhotoTransform={() => {}} 
                    readOnly={true} 
                  />
                  {/* Title Overlay for Front Cover - Only show if NOT AI Cover */}
                  {currentSpread.isCover && settings.albumTitle && !currentSpread.right.isAiCover && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30 px-6">
                       <h1 
                         style={{ 
                           fontFamily: settings.albumTitleFont,
                           color: settings.albumTitleColor,
                           textShadow: '0 2px 10px rgba(0,0,0,0.2)'
                         }}
                         className="text-4xl md:text-6xl text-center leading-tight break-words max-w-full"
                       >
                         {settings.albumTitle}
                       </h1>
                    </div>
                  )}
               </div>
             )}
             {!currentSpread.right && currentSpreadIndex === spreads.length - 2 && (
                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 font-serif italic">
                  Inside Back Cover
                </div>
             )}
          </div>

        </div>

        {/* Next Button */}
        <button 
          onClick={goToNext}
          disabled={currentSpreadIndex === spreads.length - 1}
          className={`absolute z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-0 text-white transition-all backdrop-blur-md shadow-lg
            ${isMobile 
               ? 'bottom-[5vh] left-[5vw] rotate-90' 
               : 'right-4 md:right-8'
            }`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>

      </div>

      {/* Footer Info */}
      <div className="absolute bottom-4 text-white/40 text-xs tracking-widest uppercase pointer-events-none">
         {currentSpread.isCover ? 'Front Cover' : 
          currentSpread.isBackCover ? 'Back Cover' : 'Open Book'}
      </div>
    </div>
  );
};
