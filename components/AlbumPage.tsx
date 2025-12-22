
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

const CM_TO_PX_SCALE = 35; 

interface RulerProps {
  lengthCm: number;
  orientation: 'horizontal' | 'vertical';
}

const Ruler: React.FC<RulerProps> = ({ lengthCm, orientation }) => {
  const ticks = Array.from({ length: lengthCm + 1 });
  return (
    <div className={`absolute flex pointer-events-none select-none ${orientation === 'horizontal' ? 'w-full h-8 top-full left-0 border-t border-gray-300' : 'h-full w-8 top-0 right-full border-r border-gray-300'}`}>
      {ticks.map((_, i) => (
        <React.Fragment key={i}>
          <div className="absolute bg-gray-400" style={orientation === 'horizontal' ? { left: `${i * CM_TO_PX_SCALE}px`, top: 0, width: '1px', height: '8px' } : { top: `${i * CM_TO_PX_SCALE}px`, right: 0, height: '1px', width: '8px' }} />
          {i < lengthCm && ( 
             <span className="absolute text-[8px] text-gray-500 font-medium" style={orientation === 'horizontal' ? { left: `${i * CM_TO_PX_SCALE - 1}px`, top: '8px' } : { top: `${i * CM_TO_PX_SCALE - 6}px`, right: '12px' }}>{i}</span>
          )}
          {i < lengthCm && (
            <div className="absolute bg-gray-300" style={orientation === 'horizontal' ? { left: `${(i + 0.5) * CM_TO_PX_SCALE}px`, top: 0, width: '1px', height: '4px' } : { top: `${(i + 0.5) * CM_TO_PX_SCALE}px`, right: 0, height: '1px', width: '4px' }} />
          )}
        </React.Fragment>
      ))}
      <span className="absolute text-[8px] text-gray-500 font-medium" style={orientation === 'horizontal' ? { left: `${lengthCm * CM_TO_PX_SCALE - 2}px`, top: '8px' } : { top: `${lengthCm * CM_TO_PX_SCALE - 5}px`, right: '10px' }}>{lengthCm}</span>
    </div>
  );
};

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
  const dragState = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const transform = photo.transform || { x: 0, y: 0, scale: 1 };

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) { setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height }); }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && naturalSize.w === 0) {
      if (imgRef.current.naturalWidth > 0) { setNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight }); }
    }
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight });
  };

  const isLoaded = naturalSize.w > 0 && naturalSize.h > 0 && containerSize.w > 0;
  const imgRatio = isLoaded ? naturalSize.w / naturalSize.h : 1;
  const containerRatio = isLoaded ? containerSize.w / containerSize.h : 1;
  const isWide = imgRatio > containerRatio;

  const styleProps: React.CSSProperties = isLoaded ? {
    position: 'absolute', top: '50%', left: '50%',
    width: isWide ? 'auto' : '100%', height: isWide ? '100%' : 'auto',
    minWidth: isWide ? '100%' : 'auto', minHeight: isWide ? 'auto' : '100%',
    maxWidth: 'none', maxHeight: 'none',
    transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
    willChange: 'transform', cursor: isDragging ? 'grabbing' : 'grab'
  } : { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 };

  const getClampedPosition = useCallback((x: number, y: number, currentScale: number) => {
    if (!isLoaded) return { x, y };
    const baseRenderedW = isWide ? containerSize.h * imgRatio : containerSize.w;
    const baseRenderedH = isWide ? containerSize.h : containerSize.w / imgRatio;
    const visualW = baseRenderedW * currentScale;
    const visualH = baseRenderedH * currentScale;

    if (allowUnsafePan || shapeBounds) {
      let bounds = { x: 0, y: 0, w: containerSize.w, h: containerSize.h };
      if (shapeBounds) {
        bounds = {
          x: (shapeBounds.xPercent / 100) * containerSize.w,
          y: (shapeBounds.yPercent / 100) * containerSize.h,
          w: (shapeBounds.wPercent / 100) * containerSize.w,
          h: (shapeBounds.hPercent / 100) * containerSize.h
        };
      }
      const cCenterX = containerSize.w / 2;
      const cCenterY = containerSize.h / 2;
      const shapeLeft = bounds.x;
      const shapeRight = bounds.x + bounds.w;
      const shapeTop = bounds.y;
      const shapeBottom = bounds.y + bounds.h;
      let finalX = x; let finalY = y;
      if (visualW < bounds.w) { finalX = (shapeLeft + bounds.w / 2) - cCenterX; }
      else { const maxX = shapeLeft - cCenterX + (visualW / 2); const minX = shapeRight - cCenterX - (visualW / 2); finalX = Math.min(Math.max(x, minX), maxX); }
      if (visualH < bounds.h) { finalY = (shapeTop + bounds.h / 2) - cCenterY; }
      else { const maxY = shapeTop - cCenterY + (visualH / 2); const minY = shapeBottom - cCenterY - (visualH / 2); finalY = Math.min(Math.max(y, minY), maxY); }
      return { x: finalX, y: finalY };
    }

    const imgHalfW = visualW / 2; const imgHalfH = visualH / 2;
    const cHalfW = containerSize.w / 2; const cHalfH = containerSize.h / 2;
    const maxX = Math.max(0, imgHalfW - cHalfW); const maxY = Math.max(0, imgHalfH - cHalfH);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }, [isLoaded, isWide, containerSize, imgRatio, shapeBounds, allowUnsafePan]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (readOnly || !isLoaded) return;
    e.preventDefault(); e.stopPropagation();
    setIsDragging(true);
    dragState.current = { startX: e.clientX, startY: e.clientY, initialX: transform.x, initialY: transform.y, scale: transform.scale };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (readOnly || !isLoaded) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragState.current = { startX: touch.clientX, startY: touch.clientY, initialX: transform.x, initialY: transform.y, scale: transform.scale };
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - dragState.current.startX; const deltaY = e.clientY - dragState.current.startY;
      const clamped = getClampedPosition(dragState.current.initialX + deltaX, dragState.current.initialY + deltaY, dragState.current.scale);
      onUpdate({ x: clamped.x, y: clamped.y, scale: dragState.current.scale });
    };
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragState.current.startX; const deltaY = touch.clientY - dragState.current.startY;
      const clamped = getClampedPosition(dragState.current.initialX + deltaX, dragState.current.initialY + deltaY, dragState.current.scale);
      onUpdate({ x: clamped.x, y: clamped.y, scale: dragState.current.scale });
    };
    const onTouchEnd = () => setIsDragging(false);
    window.addEventListener('mousemove', onMouseMove); window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false }); window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, isLoaded, containerSize, naturalSize, isWide, shapeBounds, getClampedPosition, onUpdate]); 

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheelNative = (e: WheelEvent) => {
      if (readOnly || !isLoaded) return;
      e.preventDefault(); e.stopPropagation();
      let newScale = Math.min(Math.max(transform.scale - (e.deltaY * 0.001), 1), 5);
      const clamped = getClampedPosition(transform.x, transform.y, newScale);
      onUpdate({ ...transform, x: clamped.x, y: clamped.y, scale: newScale });
    };
    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => container.removeEventListener('wheel', handleWheelNative);
  }, [readOnly, isLoaded, transform, onUpdate, getClampedPosition]);

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoaded) return;
    const newScale = parseFloat(e.target.value);
    const clamped = getClampedPosition(transform.x, transform.y, newScale);
    onUpdate({ ...transform, x: clamped.x, y: clamped.y, scale: newScale });
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full group overflow-hidden touch-none select-none ${!readOnly ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`} onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
      <img ref={imgRef} src={photo.url} alt={photo.name} onLoad={handleImageLoad} style={styleProps} className="pointer-events-none select-none block" loading="lazy" draggable={false} />
      {!readOnly && isLoaded && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-end gap-2 z-20">
          <div className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-white flex items-center gap-2 shadow-sm" onMouseDown={e => e.stopPropagation()} onTouchStart={e => e.stopPropagation()}>
             <ZoomIn className="w-3 h-3" />
             <input type="range" min="1" max="5" step="0.1" value={transform.scale} onChange={handleZoomChange} className="w-16 h-1 bg-white/30 rounded-full appearance-none cursor-pointer" />
          </div>
          <button onClick={(e) => { e.stopPropagation(); onUpdate({x:0,y:0,scale:1}); }} className="bg-black/60 backdrop-blur-sm p-1.5 rounded-lg text-white hover:bg-black/80 shadow-sm" onMouseDown={e => e.stopPropagation()}><RefreshCw className="w-3 h-3" /></button>
        </div>
      )}
      {!readOnly && isLoaded && transform.x === 0 && transform.y === 0 && transform.scale === 1 && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300">
           <div className="bg-black/30 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"><Move className="w-3 h-3" /> Drag to Pan</div>
        </div>
      )}
      {!readOnly && <div className="absolute inset-0 ring-inset ring-2 ring-transparent group-hover:ring-indigo-400/50 transition-all pointer-events-none z-10" />}
    </div>
  );
};

export const AlbumPage: React.FC<AlbumPageProps> = ({ page, settings, pageNumber, onUpdateLayout, onUpdatePhotoTransform, readOnly = false, onDownloadPage, onGenerateAiImage, onRevertAi, onUpdatePageBackground }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [layoutIndex, setLayoutIndex] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const widthPx = settings.pageWidthCm * CM_TO_PX_SCALE;
  const heightPx = settings.pageHeightCm * CM_TO_PX_SCALE;
  const effectiveMarginCm = pageNumber === 1 ? (settings.coverPageMarginCm ?? settings.pageMarginCm) : settings.pageMarginCm;
  const paddingPx = effectiveMarginCm * CM_TO_PX_SCALE;
  const effectiveGapCm = pageNumber === 1 ? (settings.coverPhotoGapCm ?? settings.photoGapCm) : settings.photoGapCm;
  const gapPx = effectiveGapCm * CM_TO_PX_SCALE;
  const halfGapPx = gapPx / 2;
  const effectiveBorderWidthMm = pageNumber === 1 ? (settings.coverPhotoBorderWidthMm ?? 0) : settings.photoBorderWidthMm;
  const effectiveBorderColor = pageNumber === 1 ? (settings.coverPhotoBorderColor ?? '#ffffff') : settings.photoBorderColor;
  const borderWidthPx = (effectiveBorderWidthMm / 10) * CM_TO_PX_SCALE;
  const contentBorderWidthPx = (settings.contentBorderWidthMm / 10) * CM_TO_PX_SCALE;
  const photoCount = page.photos.length;
  const bgImage = page.backgroundImage || settings.defaultBackgroundImage;

  useEffect(() => {
    if (!containerRef.current) return;
    setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    const observer = new ResizeObserver((entries) => { if (entries[0]) setContainerSize({ width: entries[0].contentRect.width, height: entries[0].contentRect.height }); });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  let scale = 1;
  if (containerSize.width > 0) {
      const wRatio = containerSize.width / widthPx;
      scale = readOnly && containerSize.height > 0 ? Math.max(wRatio, containerSize.height / heightPx) : wRatio;
  }

  const contentStyle: React.CSSProperties = readOnly ? { transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center center', position: 'absolute', top: '50%', left: '50%', width: widthPx, height: heightPx, boxSizing: 'border-box' } : { transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, width: widthPx, height: heightPx, boxSizing: 'border-box' };

  useEffect(() => { if (!page.layout) { const defaults = getLayoutsForCount(photoCount); onUpdateLayout(page.id, defaults[0]); } }, [photoCount, page.id]);

  const getGridStyle = (): React.CSSProperties => {
    const layout = page.layout || getFallbackLayout(photoCount);
    const isCustomLayout = !!layout.customWrapperStyle;
    return {
      '--photo-gap': `${gapPx}px`,
      '--half-gap': `${halfGapPx}px`,
      display: 'grid',
      gridTemplateColumns: layout.gridTemplateColumns,
      gridTemplateRows: layout.gridTemplateRows,
      gridTemplateAreas: layout.gridTemplateAreas,
      // CRITICAL: When using custom clip-paths, background color acts as the border
      backgroundColor: isCustomLayout ? effectiveBorderColor : 'transparent',
      // We set gap to 0 for custom layouts because the clip-path already accounts for half-gap internally
      gap: isCustomLayout ? '0px' : `${gapPx}px`,
      width: '100%', height: '100%', position: 'relative', zIndex: 2, boxSizing: 'border-box',
      border: contentBorderWidthPx > 0 ? `${contentBorderWidthPx}px solid ${settings.contentBorderColor}` : 'none'
    } as React.CSSProperties;
  };

  const handleLocalBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { onUpdatePageBackground(page.id, URL.createObjectURL(e.target.files[0])); e.target.value = ''; } };

  return (
    <div className={`flex flex-col items-center w-full ${readOnly ? 'h-full justify-center mb-0' : 'gap-3 mb-12'}`}>
      {!readOnly && (
        <div className="flex flex-nowrap items-center justify-between w-[98%] px-3 py-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 overflow-x-auto gap-3">
          <div className="flex items-center gap-2"><span className="font-bold text-gray-700 text-sm whitespace-nowrap">Page {pageNumber}</span><button onClick={() => setRefreshKey(k => k+1)} className="p-1 text-gray-400 hover:text-indigo-600"><RotateCcw className="w-3.5 h-3.5" /></button></div>
          <div className="flex items-center gap-2">
             <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => { const ts = getLayoutsForCount(photoCount); let ni = layoutIndex - 1; if (ni < 0) ni = ts.length - 1; setLayoutIndex(ni); onUpdateLayout(page.id, ts[ni]); }} className="p-1.5 hover:bg-white rounded-md text-gray-600"><ChevronLeft className="w-4 h-4" /></button>
                <div className="px-2 text-xs font-medium text-gray-500 flex items-center gap-1 whitespace-nowrap"><LayoutTemplate className="w-3 h-3" /> {layoutIndex === -1 ? 'AI' : `${layoutIndex + 1}`}</div>
                <button onClick={() => { const ts = getLayoutsForCount(photoCount); let ni = layoutIndex + 1; if (ni >= ts.length) ni = 0; setLayoutIndex(ni); onUpdateLayout(page.id, ts[ni]); }} className="p-1.5 hover:bg-white rounded-md text-gray-600"><ChevronRight className="w-4 h-4" /></button>
             </div>
             <button onClick={async () => { setIsGenerating(true); const l = await generateCreativeLayout(photoCount); if (l) { onUpdateLayout(page.id, l); setLayoutIndex(-1); } setIsGenerating(false); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-xs font-semibold">{isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Magic</button>
             <label className="p-1.5 bg-gray-50 hover:bg-gray-200 text-gray-600 rounded-md cursor-pointer block"><ImagePlus className="w-4 h-4" /><input type="file" className="hidden" accept="image/*" onChange={handleLocalBgUpload} /></label>
             {page.backgroundImage && <button onClick={() => onUpdatePageBackground(page.id, undefined)} className="bg-red-500 text-white rounded-full p-0.5"><X className="w-2 h-2" /></button>}
             {onGenerateAiImage && <button onClick={() => onGenerateAiImage(page.id)} className="p-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-md shadow-sm"><Wand2 className="w-4 h-4" /></button>}
             {(page.isAiCover || page.backup) && onRevertAi && <button onClick={() => onRevertAi(page.id)} className="p-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"><Undo2 className="w-4 h-4" /></button>}
             {onDownloadPage && <button onClick={() => onDownloadPage(page.id, pageNumber)} className="p-1.5 border border-gray-200 rounded-md"><Download className="w-4 h-4" /></button>}
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: readOnly ? '100%' : 'auto', maxWidth: readOnly ? 'none' : `${widthPx}px`, aspectRatio: readOnly ? undefined : `${settings.pageWidthCm} / ${settings.pageHeightCm}`, position: 'relative', margin: !readOnly ? '0 0 30px 30px' : '0 auto', flexShrink: 0 }}>
         <div style={contentStyle}>
             {!readOnly && <><div className="absolute top-0 -left-8 h-full pr-2"><Ruler orientation="vertical" lengthCm={settings.pageHeightCm} /></div><div className="absolute -bottom-8 left-0 w-full pt-2"><Ruler orientation="horizontal" lengthCm={settings.pageWidthCm} /></div></>}
            <div id={`album-page-${page.id}`} className={`bg-white overflow-hidden rounded-sm relative ${readOnly ? '' : 'page-shadow shadow-2xl'}`} style={{ width: `${widthPx}px`, height: `${heightPx}px`, backgroundColor: settings.pageBackgroundColor, padding: `${paddingPx}px` }}>
               {bgImage && <div className="absolute inset-0 pointer-events-none z-0" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
              {photoCount === 0 ? <div className="w-full h-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 gap-2 relative z-10"><LayoutTemplate className="w-6 h-6" /><span>Empty Page</span></div> : (
                <div style={getGridStyle()}>
                  {page.photos.map((photo, index) => {
                    const layout = page.layout || getFallbackLayout(photoCount);
                    const isCustomLayout = !!layout.customWrapperStyle;
                    const customStyle = layout.customWrapperStyle?.[index] || {};
                    return (
                      <div key={photo.id} style={{ 
                        gridArea: `img${index}`, 
                        // Only add standard border if NOT using custom clip-paths (as custom handles it via background bleed)
                        border: (!isCustomLayout && borderWidthPx > 0) ? `${borderWidthPx}px solid ${effectiveBorderColor}` : 'none', 
                        backgroundColor: '#e2e8f0', 
                        overflow: 'hidden', 
                        position: 'relative', 
                        ...customStyle 
                      }} className="w-full h-full min-w-0 min-h-0">
                        <EditablePhoto key={`${photo.id}-${refreshKey}`} photo={photo} readOnly={readOnly} shapeBounds={layout.shapeBounds?.[index]} allowUnsafePan={layout.allowUnsafePan} onUpdate={(transform) => onUpdatePhotoTransform(page.id, photo.id, transform)} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
         </div>
      </div>
      {!readOnly && <div className="text-[10px] uppercase tracking-widest text-gray-400 font-medium mt-2">{settings.pageWidthCm}cm × {settings.pageHeightCm}cm</div>}
    </div>
  );
};
