
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlbumPageData, AlbumSettings, GridStyle, Photo, PhotoTransform, ShapeBounds } from '../types';
import { Sparkles, Loader2, ChevronLeft, ChevronRight, LayoutTemplate, ZoomIn, RefreshCw, Move, RotateCcw, Download, Wand2, Undo2, ImagePlus, X } from 'lucide-react';
import { generateCreativeLayout } from '../services/geminiService';
import { getLayoutsForCount, getFallbackLayout } from '../services/layoutTemplates';

interface AlbumPageProps {
  page: AlbumPageData;
  settings: AlbumSettings;
  pageNumber: number;
  onUpdateLayout: (pageId: string, layout: GridStyle) => void;
  onUpdatePhotoTransform: (pageId: string, photoId: string, transform: PhotoTransform) => void;
  readOnly?: boolean;
  onDownloadPage?: (pageId: string, pageNum: number) => void;
  onGenerateAiImage?: (pageId: string) => void;
  onRevertAi?: (pageId: string) => void;
  onUpdatePageBackground: (pageId: string, bgUrl: string | undefined) => void;
}

const CM_TO_PX_SCALE = 35; // Scale factor for viewing on screen

// --- Ruler Component ---
interface RulerProps {
  lengthCm: number;
  orientation: 'horizontal' | 'vertical';
}

const Ruler: React.FC<RulerProps> = ({ lengthCm, orientation }) => {
  // Create ticks for each CM and 0.5 CM
  const ticks = Array.from({ length: lengthCm + 1 });

  return (
    <div 
      className={`absolute flex pointer-events-none select-none ${
        orientation === 'horizontal' 
          ? 'w-full h-8 top-full left-0 border-t border-gray-300' 
          : 'h-full w-8 top-0 right-full border-r border-gray-300'
      }`}
    >
      {ticks.map((_, i) => (
        <React.Fragment key={i}>
          {/* Major Tick (CM) */}
          <div
            className="absolute bg-gray-400"
            style={orientation === 'horizontal' ? {
              left: `${i * CM_TO_PX_SCALE}px`,
              top: 0,
              width: '1px',
              height: '8px'
            } : {
              top: `${i * CM_TO_PX_SCALE}px`,
              right: 0,
              height: '1px',
              width: '8px'
            }}
          />
          
          {/* Number Label */}
          {i < lengthCm && ( 
             <span 
                className="absolute text-[8px] text-gray-500 font-medium"
                style={orientation === 'horizontal' ? {
                  left: `${i * CM_TO_PX_SCALE - 1}px`,
                  top: '8px'
                } : {
                  top: `${i * CM_TO_PX_SCALE - 6}px`,
                  right: '12px'
                }}
             >
                {i}
             </span>
          )}

          {/* Half CM Tick */}
          {i < lengthCm && (
            <div
              className="absolute bg-gray-300"
              style={orientation === 'horizontal' ? {
                left: `${(i + 0.5) * CM_TO_PX_SCALE}px`,
                top: 0,
                width: '1px',
                height: '4px'
              } : {
                top: `${(i + 0.5) * CM_TO_PX_SCALE}px`,
                right: 0,
                height: '1px',
                width: '4px'
              }}
            />
          )}
        </React.Fragment>
      ))}
      
      {/* Final number at the end */}
      <span 
          className="absolute text-[8px] text-gray-500 font-medium"
          style={orientation === 'horizontal' ? {
            left: `${lengthCm * CM_TO_PX_SCALE - 2}px`,
            top: '8px'
          } : {
            top: `${lengthCm * CM_TO_PX_SCALE - 5}px`,
            right: '10px'
          }}
       >
          {lengthCm}
       </span>
    </div>
  );
};


// --- Inner Component for Interactive Photo ---
interface EditablePhotoProps {
  photo: Photo;
  readOnly: boolean;
  onUpdate: (transform: PhotoTransform) => void;
  shapeBounds?: ShapeBounds;
  allowUnsafePan?: boolean;
}

const EditablePhoto: React.FC<EditablePhotoProps> = ({ photo, readOnly, onUpdate, shapeBounds, allowUnsafePan }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  
  const dragState = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    scale: 1
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const transform = photo.transform || { x: 0, y: 0, scale: 1 };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && naturalSize.w === 0) {
      if (imgRef.current.naturalWidth > 0) {
        setNaturalSize({
          w: imgRef.current.naturalWidth,
          h: imgRef.current.naturalHeight
        });
      }
    }
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({
      w: e.currentTarget.naturalWidth,
      h: e.currentTarget.naturalHeight
    });
  };

  const isLoaded = naturalSize.w > 0 && naturalSize.h > 0 && containerSize.w > 0;
  const imgRatio = isLoaded ? naturalSize.w / naturalSize.h : 1;
  const containerRatio = isLoaded ? containerSize.w / containerSize.h : 1;
  const isWide = imgRatio > containerRatio;

  const styleProps: React.CSSProperties = isLoaded ? {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: isWide ? 'auto' : '100%',
    height: isWide ? '100%' : 'auto',
    minWidth: isWide ? '100%' : 'auto',
    minHeight: isWide ? 'auto' : '100%',
    maxWidth: 'none',
    maxHeight: 'none',
    transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
    willChange: 'transform',
    cursor: isDragging ? 'grabbing' : 'grab'
  } : {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    position: 'absolute',
    top: 0,
    left: 0
  };

  const getClampedPosition = useCallback((x: number, y: number, currentScale: number) => {
    if (!isLoaded) return { x, y };

    const baseRenderedW = isWide ? containerSize.h * imgRatio : containerSize.w;
    const baseRenderedH = isWide ? containerSize.h : containerSize.w / imgRatio;
    const visualW = baseRenderedW * currentScale;
    const visualH = baseRenderedH * currentScale;

    // --- LOGIC FOR COMPLEX SHAPES (Unsafe Pan or ShapeBounds) ---
    if (allowUnsafePan || shapeBounds) {
      let bounds = { 
        x: 0, y: 0, w: containerSize.w, h: containerSize.h 
      };

      if (shapeBounds) {
        bounds = {
          x: (shapeBounds.xPercent / 100) * containerSize.w,
          y: (shapeBounds.yPercent / 100) * containerSize.h,
          w: (shapeBounds.wPercent / 100) * containerSize.w,
          h: (shapeBounds.hPercent / 100) * containerSize.h
        };
      }

      // Calculate the visual edges of the image relative to container center
      const cCenterX = containerSize.w / 2;
      const cCenterY = containerSize.h / 2;

      const shapeLeft = bounds.x;
      const shapeRight = bounds.x + bounds.w;
      const shapeTop = bounds.y;
      const shapeBottom = bounds.y + bounds.h;

      // Constraint: Image must cover the shape.
      let finalX = x;
      let finalY = y;

      // Check Width Coverage
      if (visualW < bounds.w) {
        finalX = (shapeLeft + bounds.w / 2) - cCenterX;
      } else {
        const maxX = shapeLeft - cCenterX + (visualW / 2);
        const minX = shapeRight - cCenterX - (visualW / 2);
        finalX = Math.min(Math.max(x, minX), maxX);
      }

      // Check Height Coverage
      if (visualH < bounds.h) {
         finalY = (shapeTop + bounds.h / 2) - cCenterY;
      } else {
        const maxY = shapeTop - cCenterY + (visualH / 2);
        const minY = shapeBottom - cCenterY - (visualH / 2);
        finalY = Math.min(Math.max(y, minY), maxY);
      }

      return { x: finalX, y: finalY };
    }

    // --- STANDARD LOGIC FOR RECTANGLES ---
    const imgHalfW = visualW / 2;
    const imgHalfH = visualH / 2;
    const cHalfW = containerSize.w / 2;
    const cHalfH = containerSize.h / 2;

    const maxX = Math.max(0, imgHalfW - cHalfW);
    const maxY = Math.max(0, imgHalfH - cHalfH);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y))
    };

  }, [isLoaded, isWide, containerSize, imgRatio, shapeBounds, allowUnsafePan]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || !isLoaded) return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: transform.x,
      initialY: transform.y,
      scale: transform.scale
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (readOnly || !isLoaded) return;
    const touch = e.touches[0];
    
    setIsDragging(true);
    dragState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      initialX: transform.x,
      initialY: transform.y,
      scale: transform.scale
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - dragState.current.startX;
      const deltaY = e.clientY - dragState.current.startY;

      const rawX = dragState.current.initialX + deltaX;
      const rawY = dragState.current.initialY + deltaY;

      const clamped = getClampedPosition(rawX, rawY, dragState.current.scale);
      onUpdate({ x: clamped.x, y: clamped.y, scale: dragState.current.scale });
    };

    const onMouseUp = () => {
      setIsDragging(false);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragState.current.startX;
      const deltaY = touch.clientY - dragState.current.startY;

      const rawX = dragState.current.initialX + deltaX;
      const rawY = dragState.current.initialY + deltaY;

      const clamped = getClampedPosition(rawX, rawY, dragState.current.scale);
      onUpdate({ x: clamped.x, y: clamped.y, scale: dragState.current.scale });
    };

    const onTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, isLoaded, containerSize, naturalSize, isWide, shapeBounds, getClampedPosition, onUpdate]); 

  // Native Wheel Listener to Prevent Page Scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (readOnly || !isLoaded) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      let newScale = transform.scale - (e.deltaY * 0.001);
      newScale = Math.min(Math.max(newScale, 1), 5);
      
      const clamped = getClampedPosition(transform.x, transform.y, newScale);
      onUpdate({ ...transform, x: clamped.x, y: clamped.y, scale: newScale });
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, [readOnly, isLoaded, transform, onUpdate, getClampedPosition]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoaded) return;
    const newScale = parseFloat(e.target.value);
    const clamped = getClampedPosition(transform.x, transform.y, newScale);
    onUpdate({ ...transform, x: clamped.x, y: clamped.y, scale: newScale });
  };

  const resetTransform = () => {
    onUpdate({ x: 0, y: 0, scale: 1 });
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full group overflow-hidden touch-none select-none ${!readOnly ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <img
        ref={imgRef}
        src={photo.url}
        alt={photo.name}
        onLoad={handleImageLoad}
        style={styleProps}
        className="pointer-events-none select-none block"
        loading="lazy"
        draggable={false}
      />
      
      {!readOnly && isLoaded && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-end gap-2 z-20">
          <div className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-white flex items-center gap-2 shadow-sm" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
             <ZoomIn className="w-3 h-3" />
             <input 
               type="range" 
               min="1" 
               max="5" 
               step="0.1" 
               value={transform.scale} 
               onChange={handleZoomChange}
               className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
             />
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); resetTransform(); }}
            onTouchEnd={(e) => { e.stopPropagation(); resetTransform(); }}
            className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-white hover:bg-black/80 shadow-sm"
            title="Reset Position & Zoom"
            onMouseDown={e => e.stopPropagation()} 
            onTouchStart={e => e.stopPropagation()}
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {!readOnly && isLoaded && transform.x === 0 && transform.y === 0 && transform.scale === 1 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
           <div className="bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
             <Move className="w-3 h-3" /> Drag to Pan
           </div>
        </div>
      )}

      {!readOnly && (
         <div className="absolute inset-0 ring-inset ring-2 ring-transparent group-hover:ring-indigo-400/50 transition-all pointer-events-none z-10" />
      )}
    </div>
  );
};

export const AlbumPage: React.FC<AlbumPageProps> = ({ page, settings, pageNumber, onUpdateLayout, onUpdatePhotoTransform, readOnly = false, onDownloadPage, onGenerateAiImage, onRevertAi, onUpdatePageBackground }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0); 
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const widthPx = settings.pageWidthCm * CM_TO_PX_SCALE;
  const heightPx = settings.pageHeightCm * CM_TO_PX_SCALE;

  // Logic for page margin (Cover specific vs general)
  const effectiveMarginCm = pageNumber === 1 
    ? (settings.coverPageMarginCm ?? settings.pageMarginCm) 
    : settings.pageMarginCm;
  const paddingPx = effectiveMarginCm * CM_TO_PX_SCALE;
  
  // Logic for cover spacing
  const effectiveGapCm = pageNumber === 1 
     ? (settings.coverPhotoGapCm ?? settings.photoGapCm) 
     : settings.photoGapCm;
  const gapPx = effectiveGapCm * CM_TO_PX_SCALE;

  // Logic for borders
  const effectiveBorderWidthMm = pageNumber === 1
     ? (settings.coverPhotoBorderWidthMm ?? 0)
     : settings.photoBorderWidthMm;
  const effectiveBorderColor = pageNumber === 1
     ? (settings.coverPhotoBorderColor ?? '#ffffff')
     : settings.photoBorderColor;

  const borderWidthPx = (effectiveBorderWidthMm / 10) * CM_TO_PX_SCALE;

  // Page Content Frame (around all photos)
  const contentBorderWidthPx = (settings.contentBorderWidthMm / 10) * CM_TO_PX_SCALE;

  const photoCount = page.photos.length;
  
  // Resolve Background Image: Page specific -> Global default -> Color
  const bgImage = page.backgroundImage || settings.defaultBackgroundImage;

  // Use ResizeObserver to determine the actual width of the responsive container
  useEffect(() => {
    if (!containerRef.current) return;
    setContainerWidth(containerRef.current.offsetWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const scale = containerWidth > 0 ? containerWidth / widthPx : 1;

  useEffect(() => {
    if (!page.layout) {
       const defaults = getLayoutsForCount(photoCount);
       onUpdateLayout(page.id, defaults[0]);
    }
  }, [photoCount, page.id]);

  const cycleLayout = (direction: 'next' | 'prev') => {
    const templates = getLayoutsForCount(photoCount);
    let nextIndex = direction === 'next' ? layoutIndex + 1 : layoutIndex - 1;
    if (nextIndex >= templates.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = templates.length - 1;
    setLayoutIndex(nextIndex);
    onUpdateLayout(page.id, templates[nextIndex]);
  };

  const handleGenerateAiLayout = async () => {
    setIsGenerating(true);
    const layout = await generateCreativeLayout(photoCount);
    if (layout) {
      onUpdateLayout(page.id, layout);
      setLayoutIndex(-1); 
    }
    setIsGenerating(false);
  };

  const handleRefreshPhotos = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleLocalBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const url = URL.createObjectURL(e.target.files[0]);
       onUpdatePageBackground(page.id, url);
       e.target.value = ''; // Reset input to allow re-uploading same file if needed
    }
  };

  const getGridStyle = (): React.CSSProperties => {
    const layout = page.layout || getFallbackLayout(photoCount);
    return {
      display: 'grid',
      gridTemplateColumns: layout.gridTemplateColumns,
      gridTemplateRows: layout.gridTemplateRows,
      gridTemplateAreas: layout.gridTemplateAreas,
      gap: `${gapPx}px`,
      width: '100%',
      height: '100%',
      position: 'relative', 
      zIndex: 2, // Above background
      boxSizing: 'border-box',
      border: contentBorderWidthPx > 0 ? `${contentBorderWidthPx}px solid ${settings.contentBorderColor}` : 'none'
    };
  };

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${readOnly ? 'mb-0' : 'mb-12'}`}>
      
      {!readOnly && (
        <div className="flex flex-nowrap items-center justify-between w-[98%] max-w-full md:w-auto md:max-w-md lg:max-w-lg px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-x-auto gap-3 scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-bold text-gray-700 text-sm whitespace-nowrap">Page {pageNumber}</span>
            <button 
              onClick={handleRefreshPhotos}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-indigo-600 transition-colors flex-shrink-0"
              title="Reload Photos"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
             <div className="flex items-center bg-gray-100 rounded-lg p-0.5 flex-shrink-0">
                <button 
                  onClick={() => cycleLayout('prev')}
                  disabled={photoCount === 0}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 disabled:opacity-30 transition-all"
                  title="Previous Layout"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-2 text-xs font-medium text-gray-500 flex items-center gap-1 whitespace-nowrap">
                   <LayoutTemplate className="w-3 h-3" />
                   {layoutIndex === -1 ? 'AI' : `${layoutIndex + 1}`}
                </div>
                <button 
                  onClick={() => cycleLayout('next')}
                  disabled={photoCount === 0}
                  className="p-1.5 hover:bg-white rounded-md text-gray-600 disabled:opacity-30 transition-all"
                  title="Next Layout"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
             </div>

             <button
              onClick={handleGenerateAiLayout}
              disabled={isGenerating || photoCount === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:shadow-md transition-all disabled:opacity-50 text-xs font-semibold whitespace-nowrap flex-shrink-0"
              title="Generate Unique AI Layout"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Magic
            </button>

            {/* Page Specific Background Overrides */}
             <div className="relative group/bg">
                <label className="p-1.5 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-md cursor-pointer flex-shrink-0 block" title="Set Page Background">
                    <ImagePlus className="w-4 h-4" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleLocalBgUpload} />
                </label>
                {page.backgroundImage && (
                   <button 
                      onClick={() => onUpdatePageBackground(page.id, undefined)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm"
                      title="Clear Page Background"
                   >
                     <X className="w-2 h-2" />
                   </button>
                )}
             </div>
             
            {onGenerateAiImage && (
              <button
                onClick={() => onGenerateAiImage(page.id)}
                className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-md shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex-shrink-0"
                title="Magic Edit (Nano Banana)"
                disabled={photoCount === 0}
              >
                <Wand2 className="w-4 h-4" />
              </button>
            )}

            {(page.isAiCover || page.backup) && onRevertAi && (
              <button
                onClick={() => onRevertAi(page.id)}
                className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-all flex-shrink-0"
                title="Revert Changes"
              >
                <Undo2 className="w-4 h-4" />
              </button>
            )}

            {onDownloadPage && (
              <button
                onClick={() => onDownloadPage(page.id, pageNumber)}
                className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-indigo-600 rounded-md transition-colors border border-gray-200 flex-shrink-0"
                title="Download this page as PNG"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

          </div>
        </div>
      )}

      {/* ASPECT RATIO CONTAINER */}
      <div 
        ref={containerRef}
        className="transition-all duration-300 ease-out"
        style={{
          width: '100%',
          maxWidth: `${widthPx}px`,
          aspectRatio: `${settings.pageWidthCm} / ${settings.pageHeightCm}`,
          position: 'relative',
          margin: !readOnly ? '0 0 30px 30px' : '0 auto',
          flexShrink: 0,
        }}
      >
         {/* Scaled Content */}
         <div style={{ 
            transform: `scale(${scale})`, 
            transformOrigin: 'top left', 
            position: 'absolute', 
            top: 0, 
            left: 0,
            width: widthPx,
            height: heightPx,
            boxSizing: 'border-box',
          }}>
             
             {!readOnly && (
               <>
                 <div className="absolute top-0 -left-8 h-full pr-2">
                    <Ruler orientation="vertical" lengthCm={settings.pageHeightCm} />
                 </div>
                 <div className="absolute -bottom-8 left-0 w-full pt-2">
                    <Ruler orientation="horizontal" lengthCm={settings.pageWidthCm} />
                 </div>
               </>
             )}

            <div
              id={`album-page-${page.id}`}
              className={`bg-white overflow-hidden rounded-sm relative ${readOnly ? '' : 'page-shadow shadow-2xl'}`}
              style={{
                width: `${widthPx}px`,
                height: `${heightPx}px`,
                backgroundColor: settings.pageBackgroundColor,
                padding: `${paddingPx}px`,
              }}
            >
               {/* Background Layer */}
               {bgImage && (
                  <div 
                     className="absolute inset-0 pointer-events-none z-0"
                     style={{
                        backgroundImage: `url(${bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                     }}
                  />
               )}

              {photoCount === 0 ? (
                <div className="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 rounded-lg gap-2 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-gray-100/50 backdrop-blur-sm flex items-center justify-center">
                    <LayoutTemplate className="w-6 h-6 text-gray-300" />
                  </div>
                  <span className="text-sm">Empty Page</span>
                </div>
              ) : (
                <div style={getGridStyle()}>
                  {page.photos.map((photo, index) => {
                    const customStyle = page.layout?.customWrapperStyle?.[index] || {};
                    const bounds = page.layout?.shapeBounds?.[index];
                    const allowUnsafe = page.layout?.allowUnsafePan;
                    
                    return (
                      <div
                        key={photo.id}
                        style={{
                          gridArea: `img${index}`,
                          border: borderWidthPx > 0 ? `${borderWidthPx}px solid ${effectiveBorderColor}` : 'none',
                          backgroundColor: '#e2e8f0', 
                          overflow: 'hidden',
                          position: 'relative',
                          ...customStyle 
                        }}
                        className="w-full h-full min-w-0 min-h-0"
                      >
                        <EditablePhoto 
                          key={`${photo.id}-${refreshKey}`}
                          photo={photo} 
                          readOnly={readOnly} 
                          shapeBounds={bounds}
                          allowUnsafePan={allowUnsafe}
                          onUpdate={(transform) => onUpdatePhotoTransform(page.id, photo.id, transform)}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
         </div>
      </div>
      
      {!readOnly && (
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mt-2">
          {settings.pageWidthCm}cm × {settings.pageHeightCm}cm
        </div>
      )}
    </div>
  );
};
