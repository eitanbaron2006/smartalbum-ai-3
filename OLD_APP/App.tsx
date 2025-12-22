
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { AlbumPage } from './components/AlbumPage';
import { BookViewer } from './components/BookViewer';
import { MagicEditor } from './components/MagicEditor';
import { AlbumSettings, DEFAULT_SETTINGS, Photo, AlbumPageData, GridStyle, PhotoTransform } from './types';
import { getLayoutsForCount, LAYOUT_TEMPLATES } from './services/layoutTemplates';
import { generateAiPageDesign, generateBackgroundTexture } from './services/geminiService';
import { X, Menu } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import saveAs from 'file-saver';

// Helper for ID
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [settings, setSettings] = useState<AlbumSettings>(DEFAULT_SETTINGS);
  const [pages, setPages] = useState<AlbumPageData[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Magic Editor State
  const [isMagicEditorOpen, setIsMagicEditorOpen] = useState(false);
  const [magicEditingPageId, setMagicEditingPageId] = useState<string | null>(null);
  const [magicPrompt, setMagicPrompt] = useState(''); // Persist prompt globally

  // Handle file uploads
  const handlePhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos: Photo[] = Array.from(e.target.files).map((file: File) => ({
        id: generateId(),
        url: URL.createObjectURL(file),
        name: file.name,
        transform: { x: 0, y: 0, scale: 1 } 
      }));
      setPhotos((prev) => [...prev, ...newPhotos]);
      e.target.value = ''; // Reset input to allow re-uploading same file if needed
    }
  };

  // Generate random demo photos
  const handleLoadDemoPhotos = () => {
    const demoPhotos: Photo[] = Array.from({ length: 100 }).map((_, i) => ({
      id: generateId(),
      url: `https://picsum.photos/seed/${Math.random().toString(36)}/800/800`,
      name: `Demo Photo ${i + 1}`,
      transform: { x: 0, y: 0, scale: 1 }
    }));
    setPhotos((prev) => [...prev, ...demoPhotos]);
  };

  useEffect(() => {
    const distributePhotos = () => {
      const newPages: AlbumPageData[] = [];
      let currentPhotos: Photo[] = [];
      let previousLayoutAreas: string | null = null;
      
      for (let i = 0; i < photos.length; i++) {
        currentPhotos.push(photos[i]);
        
        if (currentPhotos.length === settings.maxPhotosPerPage || i === photos.length - 1) {
          const count = currentPhotos.length;
          const availableTemplates = getLayoutsForCount(count);
          
          let candidates = availableTemplates;
          if (previousLayoutAreas && availableTemplates.length > 1) {
            const filtered = availableTemplates.filter(t => t.gridTemplateAreas !== previousLayoutAreas);
            if (filtered.length > 0) {
              candidates = filtered;
            }
          }
          
          const randomLayout = candidates.length > 0 
            ? candidates[Math.floor(Math.random() * candidates.length)] 
            : undefined;

          if (randomLayout) {
            previousLayoutAreas = randomLayout.gridTemplateAreas;
          }

          newPages.push({
            id: generateId(),
            photos: currentPhotos.map(p => ({
               ...p, 
               transform: { x: 0, y: 0, scale: 1 }
            })),
            layout: randomLayout
          });
          currentPhotos = [];
        }
      }
      setPages(newPages);
    };

    distributePhotos();
  }, [photos, settings.maxPhotosPerPage]);

  const handleUpdatePageLayout = (pageId: string, layout: GridStyle) => {
    setPages(prevPages => prevPages.map(p => 
      p.id === pageId ? { 
        ...p, 
        layout,
        photos: p.photos.map(photo => ({
          ...photo,
          transform: { x: 0, y: 0, scale: 1 }
        }))
      } : p
    ));
  };

  const handleUpdatePhotoTransform = (pageId: string, photoId: string, transform: PhotoTransform) => {
    setPages(prevPages => prevPages.map(page => {
      if (page.id !== pageId) return page;
      
      return {
        ...page,
        photos: page.photos.map(p => 
          p.id === photoId ? { ...p, transform } : p
        )
      };
    }));
  };

  const handleUpdatePageBackground = (pageId: string, bgUrl: string | undefined) => {
    setPages(prev => prev.map(p => 
      p.id === pageId ? { ...p, backgroundImage: bgUrl } : p
    ));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPage = async (pageId: string, pageNum: number) => {
    const element = document.getElementById(`album-page-${pageId}`);
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { pixelRatio: 3, skipFonts: true });
      saveAs(dataUrl, `album_page_${pageNum}.png`);
    } catch (err) {
      console.error('Failed to download page', err);
      alert('Failed to download page. Please try again.');
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder(`SmartAlbum_${new Date().getTime()}`);
    
    // Process pages sequentially to avoid browser hanging
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const element = document.getElementById(`album-page-${page.id}`);
      if (element) {
         try {
           const dataUrl = await toPng(element, { pixelRatio: 3, skipFonts: true });
           // Remove data:image/png;base64, header
           const base64Data = dataUrl.split(',')[1];
           folder?.file(`Page_${i + 1}.png`, base64Data, { base64: true });
         } catch (err) {
           console.error(`Failed to process page ${i+1}`, err);
         }
      }
    }
    
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${settings.albumTitle || 'SmartAlbum'}_Export.zip`);
    } catch (err) {
      console.error('Failed to generate zip', err);
      alert('Failed to create download. Please try again.');
    }
  };

  // -------------------------
  // MAGIC EDITOR HANDLERS
  // -------------------------

  const checkApiKey = async () => {
     try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
      }
      return true;
    } catch (error) {
       console.error("Key selection failed", error);
       return false;
    }
  };

  const handleOpenMagicEditor = async (pageId: string) => {
    if (!await checkApiKey()) return;
    setMagicEditingPageId(pageId);
    setIsMagicEditorOpen(true);
  };

  const handleCapturePageForEditor = async (pageId: string): Promise<string | null> => {
     const element = document.getElementById(`album-page-${pageId}`);
     if (!element) return null;
     try {
       // Capture at standard resolution for sending to AI
       return await toPng(element, { pixelRatio: 1, skipFonts: true });
     } catch (e) {
       console.error("Failed to capture page", e);
       return null;
     }
  };

  const handleApplyMagicEdit = (pageId: string, newImageUrl: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;

      // Backup current state if no backup exists
      const backup = p.backup || {
        photos: p.photos,
        layout: p.layout,
        isAiCover: p.isAiCover,
        backgroundImage: p.backgroundImage
      };

      const newPhoto: Photo = {
        id: generateId(),
        url: newImageUrl,
        name: `AI Generated (${settings.coverAiModel})`,
        transform: { x: 0, y: 0, scale: 1 }
      };

      const fullBleedLayout = LAYOUT_TEMPLATES[1][0];

      return {
        ...p,
        backup,
        photos: [newPhoto],
        layout: fullBleedLayout,
        isAiCover: true,
        backgroundImage: undefined // Clear background for full bleed AI cover
      };
    }));
  };

  // Handler for SideBar "Generate Cover" button
  const handleGenerateAiCover = async () => {
    if (pages.length === 0) return;
    // Open the magic editor on the first page
    await handleOpenMagicEditor(pages[0].id);
  };

  // Handler for Sidebar "Generate Background"
  const handleGenerateBackground = async (prompt: string, referenceImage?: string): Promise<string | null> => {
     if (!await checkApiKey()) return null;
     return await generateBackgroundTexture(prompt, referenceImage);
  };

  const handleRevertPage = (pageId: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId || !p.backup) return p;
      return {
        ...p,
        photos: p.backup.photos,
        layout: p.backup.layout,
        isAiCover: p.backup.isAiCover,
        backgroundImage: p.backup.backgroundImage,
        backup: undefined // Clear backup after reverting
      };
    }));
  };

  // RENDER BOOK VIEWER IN PREVIEW MODE
  if (isPreviewMode) {
    return (
      <BookViewer 
        pages={pages} 
        settings={settings} 
        onClose={() => setIsPreviewMode(false)} 
      />
    );
  }

  return (
    <div className="flex h-screen font-sans transition-colors duration-300 overflow-hidden bg-gray-100">
      
      {/* MAGIC EDITOR OVERLAY */}
      {isMagicEditorOpen && magicEditingPageId && (
        <MagicEditor 
          isOpen={isMagicEditorOpen}
          onClose={() => setIsMagicEditorOpen(false)}
          initialPageId={magicEditingPageId}
          pages={pages}
          settings={settings}
          onCapturePage={handleCapturePageForEditor}
          onApply={handleApplyMagicEdit}
          currentPrompt={magicPrompt}
          onPromptChange={setMagicPrompt}
        />
      )}

      {!isPreviewMode && (
        <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 z-40 flex items-center justify-between px-4 shadow-sm">
           <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform"
             >
                <Menu className="w-6 h-6" />
             </button>
             <span className="font-bold text-gray-800 text-lg">SmartAlbum</span>
           </div>
           <div className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
              {photos.length} Photos
           </div>
        </div>
      )}

      {!isPreviewMode && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
          fixed inset-y-0 left-0 z-50 w-[85vw] max-w-sm transform transition-transform duration-300 ease-spring
          md:relative md:translate-x-0 md:block md:w-auto md:h-full md:flex-shrink-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          print:hidden
      `}>
        <Sidebar
          settings={settings}
          onSettingsChange={setSettings}
          onPhotosUpload={handlePhotosUpload}
          onLoadDemoPhotos={handleLoadDemoPhotos}
          photoCount={photos.length}
          onPrint={handlePrint}
          onPreview={() => {
            setIsPreviewMode(true);
            setIsSidebarOpen(false);
          }}
          onDownloadAll={handleDownloadAll}
          onClose={() => setIsSidebarOpen(false)}
          onGenerateAiCover={handleGenerateAiCover}
          isGeneratingCover={false} // Loading handled in editor now
          onGenerateBackground={handleGenerateBackground}
        />
      </div>

      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center transition-all scroll-smooth pt-20 pb-10 md:pt-12">
        
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none fixed" 
             style={{ 
               backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />

        <div className="w-full max-w-6xl mx-auto z-0 flex flex-col items-center px-4 md:px-0 print:block print:w-full print:max-w-none print:p-0">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-20 md:mt-32 text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <span className="text-3xl md:text-4xl">📸</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-gray-800">
                Start Your Album
              </h2>
              <p className="text-sm md:text-base text-gray-500 mb-8">
                Tap the menu or use the sidebar to upload photos.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                >
                  Open Menu to Upload
                </button>
                <button 
                  onClick={handleLoadDemoPhotos}
                  className="w-full md:w-auto px-6 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-semibold shadow-sm hover:bg-indigo-50 active:scale-95 transition-transform"
                >
                  Load Demo Photos
                </button>
              </div>
            </div>
          ) : (
            <>
              {pages.map((page, index) => (
                <div key={page.id} className="print:break-after-page print:flex print:items-center print:justify-center print:h-screen print:w-screen w-full flex justify-center">
                  <AlbumPage
                    pageNumber={index + 1}
                    page={page}
                    settings={settings}
                    onUpdateLayout={handleUpdatePageLayout}
                    onUpdatePhotoTransform={handleUpdatePhotoTransform}
                    onDownloadPage={handleDownloadPage}
                    onGenerateAiImage={handleOpenMagicEditor} 
                    onRevertAi={handleRevertPage}
                    onUpdatePageBackground={handleUpdatePageBackground}
                    readOnly={false}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      </main>

      <style>{`
        .ease-spring {
          transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body {
            background: white;
            overflow: visible;
          }
          ::-webkit-scrollbar { display: none; }
          .print\\:hidden { display: none !important; }
          .page-shadow { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
