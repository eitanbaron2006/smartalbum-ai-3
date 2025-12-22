
import React, { useState, useEffect, useRef } from 'react';
import { AlbumPageData, AlbumSettings } from '../types';
import { Sparkles, X, ChevronLeft, ChevronRight, Wand2, Check, RefreshCw, Loader2, Image as ImageIcon, ZoomIn, Layers, LayoutDashboard } from 'lucide-react';
import { generateAiPageDesign } from '../services/geminiService';

interface MagicEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPageId: string;
  pages: AlbumPageData[];
  settings: AlbumSettings;
  onApply: (pageId: string, newImageUrl: string) => void;
  onCapturePage: (pageId: string) => Promise<string | null>;
  currentPrompt: string;
  onPromptChange: (prompt: string) => void;
}

export const MagicEditor: React.FC<MagicEditorProps> = ({
  isOpen,
  onClose,
  initialPageId,
  pages,
  settings,
  onApply,
  onCapturePage,
  currentPrompt,
  onPromptChange
}) => {
  const [currentPageId, setCurrentPageId] = useState(initialPageId);
  const [currentLayoutImage, setCurrentLayoutImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingCapture, setIsLoadingCapture] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // 'refine' = send screenshot of current layout. 'recompose' = send raw individual photos.
  const [mode, setMode] = useState<'refine' | 'recompose'>('refine');

  useEffect(() => {
    if (isOpen) {
      setCurrentPageId(initialPageId);
      setGeneratedImage(null);
      loadPageImage(initialPageId);
    }
  }, [isOpen, initialPageId]);

  const loadPageImage = async (pageId: string) => {
    setIsLoadingCapture(true);
    setCurrentLayoutImage(null);
    setGeneratedImage(null);
    // Slight delay to ensure DOM is ready/visible if switching
    setTimeout(async () => {
      const dataUrl = await onCapturePage(pageId);
      setCurrentLayoutImage(dataUrl);
      setIsLoadingCapture(false);
    }, 100);
  };

  const handleNextPage = () => {
    const idx = pages.findIndex(p => p.id === currentPageId);
    if (idx < pages.length - 1) {
      const nextId = pages[idx + 1].id;
      setCurrentPageId(nextId);
      loadPageImage(nextId);
    }
  };

  const handlePrevPage = () => {
    const idx = pages.findIndex(p => p.id === currentPageId);
    if (idx > 0) {
      const prevId = pages[idx - 1].id;
      setCurrentPageId(prevId);
      loadPageImage(prevId);
    }
  };

  // Helper to convert Blob URL to Base64
  const convertPhotosToBase64 = async (photos: any[]): Promise<string[]> => {
    const promises = photos.map(async (photo) => {
      try {
        const response = await fetch(photo.url);
        const blob = await response.blob();
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.error("Failed to convert photo", photo.id);
        return "";
      }
    });
    const results = await Promise.all(promises);
    return results.filter(s => s !== "");
  };

  const handleGenerate = async () => {
    const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
    const currentPage = pages[currentPageIndex];
    
    // Prepare input images based on mode
    let inputImages: string[] = [];

    setIsGenerating(true);

    try {
      if (mode === 'refine') {
         if (!currentLayoutImage) return;
         inputImages = [currentLayoutImage];
      } else {
         // Recompose mode: Send raw photos
         if (currentPage.photos.length === 0) {
            alert("No photos on this page to recompose.");
            setIsGenerating(false);
            return;
         }
         inputImages = await convertPhotosToBase64(currentPage.photos);
      }

      const isFrontCover = currentPageIndex === 0;

      const result = await generateAiPageDesign(
        inputImages,
        isFrontCover ? (settings.albumTitle || 'Photo Album') : '', 
        settings.coverAiModel, 
        currentPrompt,
        mode
      );
      setGeneratedImage(result);
    } catch (e) {
      console.error(e);
      alert("Failed to generate design. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (generatedImage) {
      onApply(currentPageId, generatedImage);
      setGeneratedImage(null);
      // alert("Design applied!");
    }
  };

  if (!isOpen) return null;

  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const currentPage = pages[currentPageIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Magic Editor</h2>
            <p className="text-white/50 text-xs">AI Studio ({settings.coverAiModel})</p>
          </div>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/10">
          <button 
            onClick={handlePrevPage}
            disabled={currentPageIndex === 0}
            className="text-white/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white/90 font-medium text-sm w-20 text-center">
            Page {currentPageIndex + 1} / {pages.length}
          </span>
          <button 
            onClick={handleNextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="text-white/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Preview Area */}
        <div className="flex-1 bg-black/40 relative p-6 flex items-center justify-center gap-6 overflow-y-auto">
          
          {/* Original / Current Layout */}
          <div className="flex flex-col gap-2 max-w-[45%] w-full">
            <div className="flex items-center justify-between text-white/70 text-xs uppercase tracking-wider font-semibold">
              <span>{mode === 'refine' ? 'Current Layout' : `Source Photos (${currentPage.photos.length})`}</span>
              {isLoadingCapture && <Loader2 className="w-3 h-3 animate-spin" />}
            </div>
            
            <div className="relative aspect-square w-full bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-xl">
              {mode === 'refine' ? (
                // Refine Mode: Show the layout screenshot
                currentLayoutImage ? (
                  <img src={currentLayoutImage} alt="Original" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                )
              ) : (
                 // Recompose Mode: Show a grid of source photos
                 <div className="w-full h-full p-2 grid grid-cols-2 gap-2 overflow-auto bg-gray-900 content-start">
                    {currentPage.photos.map(p => (
                       <img key={p.id} src={p.url} className="w-full h-24 object-cover rounded-md border border-white/10" alt="" />
                    ))}
                 </div>
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="text-white/30">
            <ChevronRight className="w-8 h-8" />
          </div>

          {/* Generated Result */}
          <div className="flex flex-col gap-2 max-w-[45%] w-full">
            <div className="text-white/70 text-xs uppercase tracking-wider font-semibold flex justify-between">
              <span>AI Result</span>
              {generatedImage && <span className="text-green-400">Ready</span>}
            </div>
            <div 
              className={`relative aspect-square w-full bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-xl flex items-center justify-center group
               ${isGenerating ? 'ring-2 ring-rose-500/50' : ''}
               ${generatedImage ? 'cursor-zoom-in hover:border-rose-500/50 transition-colors' : ''}
              `}
              onClick={() => generatedImage && setIsPreviewOpen(true)}
            >
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 animate-pulse">
                   <div className="w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center">
                     <Sparkles className="w-6 h-6 text-rose-500" />
                   </div>
                   <p className="text-rose-200 text-sm font-medium">
                     {mode === 'refine' ? 'Refining...' : 'Designing from scratch...'}
                   </p>
                </div>
              ) : generatedImage ? (
                <>
                  <img src={generatedImage} alt="Generated" className="w-full h-full object-contain animate-in zoom-in duration-300" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <ZoomIn className="w-4 h-4" /> Full Screen
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 text-white/20">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Enter a prompt and hit generate</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right/Bottom: Controls */}
        <div className="w-full md:w-96 bg-gray-900 border-l border-white/10 p-6 flex flex-col gap-6 shadow-2xl z-10">
          
          {/* Mode Selector */}
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
             <button
                onClick={() => setMode('refine')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'refine' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
             >
               <Layers className="w-3 h-3" />
               Refine Layout
             </button>
             <button
                onClick={() => setMode('recompose')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${mode === 'recompose' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
             >
               <LayoutDashboard className="w-3 h-3" />
               Design from Scratch
             </button>
          </div>

          <div>
            <label className="block text-white font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-400" />
              Magic Prompt ({mode === 'refine' ? 'Refine' : 'Full Design'})
            </label>
            <p className="text-white/50 text-xs mb-3">
              {mode === 'refine' 
                ? "Enhance current layout. E.g. 'Add a vintage texture and warmer lighting'" 
                : "Create a new layout using these photos. E.g. 'Arrange photos in a circle with floral border'"}
            </p>
            <textarea
              value={currentPrompt}
              onChange={(e) => onPromptChange(e.target.value)}
              placeholder={mode === 'refine' ? "e.g. Make it look cinematic..." : "e.g. Collage style with white borders..."}
              className="w-full h-32 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none text-sm leading-relaxed"
            />
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'refine' && !currentLayoutImage) || (mode === 'recompose' && currentPage.photos.length === 0)}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {generatedImage ? 'Regenerate' : 'Generate Design'}
                </>
              )}
            </button>

            {generatedImage && (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2">
                <button
                   onClick={() => setGeneratedImage(null)}
                   className="py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Discard
                </button>
                <button
                   onClick={handleApply}
                   className="py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Design
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Preview Modal */}
      {isPreviewOpen && generatedImage && (
        <div 
          className="fixed inset-0 z-[110] bg-black/95 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200 backdrop-blur-sm"
          onClick={() => setIsPreviewOpen(false)}
        >
          <button 
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            onClick={() => setIsPreviewOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
          
          <img 
            src={generatedImage} 
            alt="Full Screen Preview" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
            onClick={(e) => e.stopPropagation()} 
          />
          
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
             <button
                onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); setGeneratedImage(null); }}
                className="px-6 py-2 bg-gray-800 text-white rounded-full font-medium hover:bg-gray-700 border border-gray-600"
             >
               Discard
             </button>
             <button
                onClick={(e) => { e.stopPropagation(); setIsPreviewOpen(false); handleApply(); }}
                className="px-6 py-2 bg-green-600 text-white rounded-full font-bold hover:bg-green-500 shadow-lg shadow-green-900/50"
             >
               Apply Design
             </button>
          </div>
        </div>
      )}
    </div>
  );
};
