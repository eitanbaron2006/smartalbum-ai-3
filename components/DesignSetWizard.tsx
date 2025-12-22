
import React, { useState } from 'react';
import { generateCoverDesign, generateBackgroundTexture } from '../services/geminiService';
import { Loader2, Sparkles, X, Check, RefreshCw, Image as ImageIcon, Book, Wand2 } from 'lucide-react';
import { AlbumPageData, AlbumSettings } from '../types';

interface DesignSetWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySet: (frontUrl: string | null, backUrl: string | null, bgUrl: string | null) => void;
  onSaveSet: (name: string, set: { front: string | null; back: string | null; bg: string | null }) => void;
  albumTitle: string;
  pages: AlbumPageData[];
  settings: AlbumSettings;
}

const getClosestAspectRatio = (width: number, height: number): '16:9' | '9:16' | '4:3' | '3:4' | '1:1' => {
    const ratio = width / height;
    const supportedRatios = {
        '16:9': 16 / 9, // ~1.778
        '4:3': 4 / 3,   // ~1.333
        '1:1': 1,
        '3:4': 3 / 4,   // 0.75
        '9:16': 9 / 16  // ~0.563
    };

    let closestRatioKey: keyof typeof supportedRatios = '1:1';
    let minDiff = Infinity;

    for (const key in supportedRatios) {
        const rKey = key as keyof typeof supportedRatios;
        const diff = Math.abs(ratio - supportedRatios[rKey]);
        if (diff < minDiff) {
            minDiff = diff;
            closestRatioKey = rKey;
        }
    }
    return closestRatioKey;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DesignSetWizard: React.FC<DesignSetWizardProps> = ({
  isOpen,
  onClose,
  onApplySet,
  onSaveSet,
  albumTitle,
  pages,
  settings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState({ front: false, back: false, bg: false });
  const [results, setResults] = useState<{ front: string | null; back: string | null; bg: string | null }>({
    front: null,
    back: null,
    bg: null
  });

  if (!isOpen) return null;

  const albumAspectRatio = getClosestAspectRatio(settings.pageWidthCm, settings.pageHeightCm);

  // Helper to convert photos to base64
  const convertPhotosToBase64 = async (photos: any[]): Promise<string[]> => {
    const promises = photos.slice(0, 4).map(async (photo) => { // Limit to 4 photos max
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

  // --- SEQUENTIAL GENERATION LOGIC ---
  const handleGenerateAll = async () => {
    if (!prompt.trim()) return;
    
    // 1. Generate Front Cover
    const frontUrl = await generateFrontInternal();
    if (!frontUrl) return; // Stop if front failed

    await sleep(1500); // Add a small delay to help with rate limits

    // 2. Generate Back Cover (using Front as style context)
    await generateBackInternal(frontUrl);

    await sleep(1500); // Add a small delay to help with rate limits

    // 3. Generate Background (based on TEXT PROMPT ONLY to avoid title bleed)
    // This will run even if the back cover fails, which is better UX.
    await generateBgInternal(null);
  };

  const generateFrontInternal = async (): Promise<string | null> => {
    setIsGenerating(prev => ({ ...prev, front: true }));
    try {
      // Get context images from Page 1 (The user's actual photos)
      let inputImages: string[] = [];
      if (pages.length > 0) {
        inputImages = await convertPhotosToBase64(pages[0].photos);
      }

      const url = await generateCoverDesign(
        `${prompt}`, 
        'front', 
        inputImages, 
        undefined, // No style reference for the first step
        settings.coverAiModel, // Use model from settings
        albumTitle,
        albumAspectRatio
      );
      
      setResults(prev => ({ ...prev, front: url }));
      return url;
    } catch (error) {
      console.error("Failed to generate front cover:", error);
      setResults(prev => ({ ...prev, front: null }));
      return null;
    } finally {
      setIsGenerating(prev => ({ ...prev, front: false }));
    }
  };

  const generateBackInternal = async (styleRefUrl: string | null): Promise<string | null> => {
    setIsGenerating(prev => ({ ...prev, back: true }));
    try {
      // Get context images from Last Page
      let inputImages: string[] = [];
      if (pages.length > 0) {
        inputImages = await convertPhotosToBase64(pages[pages.length - 1].photos);
      }

      const url = await generateCoverDesign(
         prompt, 
         'back', 
         inputImages,
         styleRefUrl || undefined, // Pass the Front Cover as a style reference
         settings.coverAiModel, // Use model from settings
         undefined, // no title for back cover
         albumAspectRatio
      );

      setResults(prev => ({ ...prev, back: url }));
      return url;
    } catch (error) {
       console.error("Failed to generate back cover:", error);
       setResults(prev => ({ ...prev, back: null }));
       return null;
    } finally {
      setIsGenerating(prev => ({ ...prev, back: false }));
    }
  };

  const generateBgInternal = async (styleRefUrl: string | null) => {
    setIsGenerating(prev => ({ ...prev, bg: true }));
    try {
      // Use the text prompt only to avoid inheriting the title from the front cover image
      const url = await generateBackgroundTexture(prompt, undefined);
      setResults(prev => ({ ...prev, bg: url }));
      return url;
    } catch (error) {
       console.error("Failed to generate background texture:", error);
       setResults(prev => ({ ...prev, bg: null }));
       return null;
    } finally {
      setIsGenerating(prev => ({ ...prev, bg: false }));
    }
  };

  // --- INDIVIDUAL HANDLERS (Manual Retry) ---
  
  const handleRetryFront = () => generateFrontInternal();
  
  const handleRetryBack = () => {
    // If we have a front cover, use it as reference, otherwise standalone
    generateBackInternal(results.front);
  };

  const handleRetryBg = () => {
     // Generate background from text prompt only
    generateBgInternal(null);
  };
  
  const handleApplyAndSave = () => {
    const name = window.prompt(
      "Enter a name to save this set to your library, or leave blank to just apply it.",
      prompt.substring(0, 30)
    );

    // Save if a name is provided and user didn't cancel
    if (name && name.trim()) {
      onSaveSet(name.trim(), results);
    }
    
    // Always apply
    onApplySet(results.front, results.back, results.bg);
    
    // Close the wizard
    onClose();
  };

  const hasAnyResult = results.front || results.back || results.bg;

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <Book className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-tight">Design Set Creator</h2>
            <p className="text-white/50 text-xs">Sequential Design: Front → Back → Texture</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Layout - Modified for better mobile scrolling */}
      <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden relative">
        
        {/* Left: Preview Grid */}
        <div className="flex-1 bg-black/20 p-6 md:overflow-y-auto">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto h-full content-center">
              
              {/* Front Cover Card */}
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between text-white/70 text-xs uppercase tracking-wider font-bold px-1">
                    <span>Front Cover</span>
                    {results.front && (
                       <button onClick={handleRetryFront} disabled={isGenerating.front} className="hover:text-white flex items-center gap-1">
                         <RefreshCw className={`w-3 h-3 ${isGenerating.front ? 'animate-spin' : ''}`} /> Retry
                       </button>
                    )}
                 </div>
                 <div className={`relative aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl group ${isGenerating.front ? 'ring-2 ring-violet-500/50' : ''}`} style={{aspectRatio: albumAspectRatio.replace(':', '/')}}>
                    {isGenerating.front ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80 backdrop-blur-sm z-10">
                          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                          <span className="text-violet-200 text-xs font-medium text-center px-4">Composing user photos...</span>
                       </div>
                    ) : results.front ? (
                       <>
                         <img src={results.front} alt="Front" className="w-full h-full object-cover animate-in fade-in duration-500" />
                       </>
                    ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-2">
                          <Book className="w-12 h-12" />
                          <span className="text-sm">1. Front Preview</span>
                       </div>
                    )}
                 </div>
              </div>

              {/* Back Cover Card */}
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between text-white/70 text-xs uppercase tracking-wider font-bold px-1">
                    <span>Back Cover</span>
                    {results.back && (
                       <button onClick={handleRetryBack} disabled={isGenerating.back} className="hover:text-white flex items-center gap-1">
                         <RefreshCw className={`w-3 h-3 ${isGenerating.back ? 'animate-spin' : ''}`} /> Retry
                       </button>
                    )}
                 </div>
                 <div className={`relative aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl group ${isGenerating.back ? 'ring-2 ring-violet-500/50' : ''}`} style={{aspectRatio: albumAspectRatio.replace(':', '/')}}>
                    {isGenerating.back ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80 backdrop-blur-sm z-10">
                          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                          <span className="text-violet-200 text-xs font-medium text-center px-4">Matching Front style...</span>
                       </div>
                    ) : results.back ? (
                       <img src={results.back} alt="Back" className="w-full h-full object-cover animate-in fade-in duration-500" />
                    ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-2">
                          <Book className="w-12 h-12" />
                          <span className="text-sm">2. Back Preview</span>
                       </div>
                    )}
                 </div>
              </div>

              {/* Texture Card */}
              <div className="flex flex-col gap-3">
                 <div className="flex items-center justify-between text-white/70 text-xs uppercase tracking-wider font-bold px-1">
                    <span>Background Texture</span>
                    {results.bg && (
                       <button onClick={handleRetryBg} disabled={isGenerating.bg} className="hover:text-white flex items-center gap-1">
                         <RefreshCw className={`w-3 h-3 ${isGenerating.bg ? 'animate-spin' : ''}`} /> Retry
                       </button>
                    )}
                 </div>
                 <div className={`relative aspect-[3/4] bg-gray-800 rounded-xl overflow-hidden border border-white/10 shadow-2xl group ${isGenerating.bg ? 'ring-2 ring-violet-500/50' : ''}`} style={{aspectRatio: albumAspectRatio.replace(':', '/')}}>
                    {isGenerating.bg ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/80 backdrop-blur-sm z-10">
                          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                          <span className="text-violet-200 text-xs font-medium text-center px-4">Creating Texture set...</span>
                       </div>
                    ) : results.bg ? (
                       <div className="w-full h-full animate-in fade-in duration-500" style={{ backgroundImage: `url(${results.bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    ) : (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-white/10 gap-2">
                          <ImageIcon className="w-12 h-12" />
                          <span className="text-sm">3. Texture Preview</span>
                       </div>
                    )}
                 </div>
              </div>

           </div>
        </div>

        {/* Right: Controls Panel */}
        <div className="w-full md:w-96 bg-gray-900 border-l border-white/10 p-6 flex flex-col gap-6 shadow-2xl z-20 shrink-0 md:h-full">
           
           <div>
              <label className="block text-white font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Visual Theme
              </label>
              <p className="text-white/50 text-xs mb-3">
                Describe the style for the entire album set. <br/>
                <strong>Process:</strong> The AI will use photos from your first page to create the Front Cover. 
                Then it uses the Front Cover design to style the Back Cover and Background.
              </p>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Cinematic travel memories from Japan, minimalist aesthetic, warm lighting..."
                className="w-full h-40 bg-black/30 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none text-sm leading-relaxed"
              />
           </div>

           <div className="mt-auto flex flex-col gap-3">
              <button
                 onClick={handleGenerateAll}
                 disabled={!prompt.trim() || Object.values(isGenerating).some(v => v)}
                 className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                 {Object.values(isGenerating).some(v => v) ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                 ) : (
                    <Wand2 className="w-5 h-5" />
                 )}
                 {hasAnyResult ? 'Regenerate All' : 'Generate Design Set'}
              </button>

              {hasAnyResult && (
                 <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-2">
                    <button
                       onClick={onClose}
                       className="py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
                    >
                       Cancel
                    </button>
                    <button
                       onClick={handleApplyAndSave}
                       className="py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                       <Check className="w-4 h-4" />
                       Apply Set & Close
                    </button>
                 </div>
              )}
           </div>

        </div>

      </div>
    </div>
  );
};
