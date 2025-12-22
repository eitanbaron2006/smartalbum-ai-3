
import React, { useState } from 'react';
import { AlbumSettings, FONTS } from '../types';
import { Upload, Settings, Image as ImageIcon, Layout, Printer, Palette, Eye, X, Beaker, Type, Download, Loader2, Sparkles, Bot, Plus, Trash2, Paperclip, Frame } from 'lucide-react';

interface SidebarProps {
  settings: AlbumSettings;
  onSettingsChange: (newSettings: AlbumSettings) => void;
  onPhotosUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadDemoPhotos: () => void;
  photoCount: number;
  onPrint: () => void;
  onPreview: () => void;
  onDownloadAll: () => Promise<void>;
  onClose?: () => void;
  onGenerateAiCover: () => Promise<void>;
  isGeneratingCover: boolean;
  onGenerateBackground: (prompt: string, referenceImage?: string) => Promise<string | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  settings,
  onSettingsChange,
  onPhotosUpload,
  onLoadDemoPhotos,
  photoCount,
  onPrint,
  onPreview,
  onDownloadAll,
  onClose,
  onGenerateAiCover,
  isGeneratingCover,
  onGenerateBackground
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('');
  const [bgRefImage, setBgRefImage] = useState<string | null>(null);
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'style' | 'bg'>('style');

  const handleChange = (key: keyof AlbumSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    await onDownloadAll();
    setIsDownloading(false);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      // Add to saved backgrounds and set as default
      const newSaved = [url, ...settings.savedBackgrounds];
      onSettingsChange({
        ...settings,
        savedBackgrounds: newSaved,
        defaultBackgroundImage: url
      });
      // Reset input to allow re-uploading same file if needed
      e.target.value = '';
    }
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const reader = new FileReader();
       reader.onloadend = () => {
         setBgRefImage(reader.result as string);
       };
       reader.readAsDataURL(e.target.files[0]);
       // Reset input to allow re-uploading same file if needed
       e.target.value = '';
    }
  };

  const handleGenerateBg = async () => {
    if (!bgPrompt.trim()) return;
    setIsGeneratingBg(true);
    // Convert ref image if needed or pass as is (it's base64 from FileReader)
    const url = await onGenerateBackground(bgPrompt, bgRefImage || undefined);
    if (url) {
      const newSaved = [url, ...settings.savedBackgrounds];
      onSettingsChange({
        ...settings,
        savedBackgrounds: newSaved,
        defaultBackgroundImage: url
      });
      setBgPrompt('');
      setBgRefImage(null);
    }
    setIsGeneratingBg(false);
  };

  const selectBackground = (url: string | undefined) => {
    handleChange('defaultBackgroundImage', url);
  };

  return (
    <div className="w-full md:w-80 h-full bg-white border-r border-gray-200 flex flex-col overflow-y-auto z-10 shadow-lg">
      <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-600" />
            SmartAlbum
          </h1>
          <p className="text-xs text-gray-500 mt-1">AI Photo Book Creator</p>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex border-b border-gray-100">
        <button 
          onClick={() => setActiveTab('style')}
          className={`flex-1 py-3 text-xs font-semibold ${activeTab === 'style' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Style
        </button>
        <button 
          onClick={() => setActiveTab('bg')}
          className={`flex-1 py-3 text-xs font-semibold ${activeTab === 'bg' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Backgrounds
        </button>
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-xs font-semibold ${activeTab === 'info' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          Project
        </button>
      </div>

      <div className="p-5 space-y-8 flex-1">
        
        {activeTab === 'info' && (
           <>
            {/* Album Info */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Type className="w-3 h-3" />
                 Album Info
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Book Title</label>
                  <input
                    type="text"
                    value={settings.albumTitle || ''}
                    onChange={(e) => handleChange('albumTitle', e.target.value)}
                    placeholder="e.g. Summer Vacation 2024"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cover AI Model</label>
                  <div className="relative">
                    <select
                      value={settings.coverAiModel}
                      onChange={(e) => handleChange('coverAiModel', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xs appearance-none"
                    >
                      <option value="gemini-2.5-flash-image">Nano Banana (Fast)</option>
                      <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                    </select>
                    <Bot className="w-3 h-3 text-gray-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
                
                {/* Magic Cover Button */}
                <button
                   onClick={onGenerateAiCover}
                   disabled={isGeneratingCover || photoCount === 0}
                   className={`w-full py-2 px-3 text-white rounded-lg flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50
                     ${settings.coverAiModel.includes('pro') 
                       ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700'
                       : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600'
                     }`}
                   title={`Design Cover with ${settings.coverAiModel}`}
                >
                   {isGeneratingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                   Generate Cover
                </button>
                
                {/* Title Styles */}
                 <div className="grid grid-cols-2 gap-3 pt-2">
                   <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title Font</label>
                      <select 
                        value={settings.albumTitleFont}
                        onChange={(e) => handleChange('albumTitleFont', e.target.value)}
                        className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {FONTS.map(f => (
                          <option key={f.name} value={f.value}>{f.name}</option>
                        ))}
                      </select>
                   </div>
                   <div>
                       <label className="block text-xs font-medium text-gray-600 mb-1">Title Color</label>
                       <div className="flex items-center gap-2">
                         <input 
                            type="color" 
                            value={settings.albumTitleColor}
                            onChange={(e) => handleChange('albumTitleColor', e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                         />
                         <span className="text-xs text-gray-400 font-mono">{settings.albumTitleColor}</span>
                       </div>
                    </div>
                 </div>
              </div>
            </section>

             {/* Export */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Download className="w-3 h-3" />
                Export
              </h3>
              <button 
                 onClick={handleDownloadClick}
                 disabled={photoCount === 0 || isDownloading}
                 className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-all disabled:opacity-50"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download All (ZIP)
              </button>
            </section>
           </>
        )}

        {activeTab === 'style' && (
          <>
            {/* Upload Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                   <Upload className="w-3 h-3" />
                   Photos
                </h3>
                <button 
                  onClick={onLoadDemoPhotos}
                  className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                  title="Load 10 random images for testing"
                >
                  <Beaker className="w-3 h-3" />
                  Test Mode
                </button>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-indigo-100 border-dashed rounded-xl cursor-pointer bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 mb-1" />
                  <p className="text-xs text-gray-500 font-medium">Click to upload</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={onPhotosUpload}
                />
              </label>
              <p className="text-xs text-center mt-2 text-gray-400">
                {photoCount} photos loaded
              </p>
            </section>

             {/* Page Dimensions */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Layout className="w-3 h-3" />
                Dimensions (cm)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
                  <input
                    type="number"
                    value={settings.pageWidthCm}
                    onChange={(e) => handleChange('pageWidthCm', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
                  <input
                    type="number"
                    value={settings.pageHeightCm}
                    onChange={(e) => handleChange('pageHeightCm', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm transition-all"
                  />
                </div>
              </div>
            </section>

             {/* Layout Rules */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Settings className="w-3 h-3" />
                Layout Rules
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Max Photos / Page</label>
                  <div className="flex items-center gap-2">
                     <input
                      type="range"
                      min="1"
                      max="12"
                      value={settings.maxPhotosPerPage}
                      onChange={(e) => handleChange('maxPhotosPerPage', Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <span className="text-sm font-semibold w-6 text-center">{settings.maxPhotosPerPage}</span>
                  </div>
                </div>
                 
                 {/* Photo Spacing Group */}
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Page Spacing</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.photoGapCm}
                      onChange={(e) => handleChange('photoGapCm', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cover Spacing</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.coverPhotoGapCm ?? settings.photoGapCm}
                      onChange={(e) => handleChange('coverPhotoGapCm', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                 {/* Margins Group */}
                 <div className="grid grid-cols-2 gap-3">
                   <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Page Margins</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.pageMarginCm}
                      onChange={(e) => handleChange('pageMarginCm', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                   </div>
                   <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cover Margins</label>
                    <input
                      type="number"
                      step="0.1"
                      value={settings.coverPageMarginCm ?? settings.pageMarginCm}
                      onChange={(e) => handleChange('coverPageMarginCm', Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                   </div>
                </div>
              </div>
            </section>
             
              {/* Styles */}
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Palette className="w-3 h-3" />
                Borders & Colors
              </h3>
              <div className="space-y-6">
                 
                 {/* Page Content Frame */}
                 <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                       <Frame className="w-3 h-3" /> Page Content Frame
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-600 mb-1">Width (mm)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={settings.contentBorderWidthMm ?? 0}
                          onChange={(e) => handleChange('contentBorderWidthMm', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs"
                        />
                      </div>
                       <div>
                         <label className="block text-[10px] font-medium text-gray-600 mb-1">Color</label>
                         <input 
                            type="color" 
                            value={settings.contentBorderColor ?? '#000000'}
                            onChange={(e) => handleChange('contentBorderColor', e.target.value)}
                            className="w-full h-7 rounded cursor-pointer border-0 p-0"
                         />
                      </div>
                    </div>
                 </div>

                 {/* Photo Borders (General) */}
                 <div>
                    <div className="flex items-center justify-between mb-1">
                       <label className="text-xs font-medium text-gray-600">Photo Borders (Page)</label>
                       <input 
                          type="color" 
                          value={settings.photoBorderColor}
                          onChange={(e) => handleChange('photoBorderColor', e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                       />
                    </div>
                     <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={settings.photoBorderWidthMm}
                        onChange={(e) => handleChange('photoBorderWidthMm', Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5"
                      />
                       <span className="text-xs font-semibold w-8 text-center">{settings.photoBorderWidthMm}</span>
                     </div>
                 </div>

                 {/* Photo Borders (Cover) */}
                 <div>
                    <div className="flex items-center justify-between mb-1">
                       <label className="text-xs font-medium text-gray-600">Photo Borders (Cover)</label>
                       <input 
                          type="color" 
                          value={settings.coverPhotoBorderColor ?? '#ffffff'}
                          onChange={(e) => handleChange('coverPhotoBorderColor', e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                       />
                    </div>
                     <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={settings.coverPhotoBorderWidthMm ?? 0}
                        onChange={(e) => handleChange('coverPhotoBorderWidthMm', Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5"
                      />
                       <span className="text-xs font-semibold w-8 text-center">{settings.coverPhotoBorderWidthMm ?? 0}</span>
                     </div>
                 </div>

              </div>
            </section>
          </>
        )}

        {activeTab === 'bg' && (
          <>
             {/* Global Background Settings */}
             <section>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" />
                  Album Background
                </h3>
                
                {/* Fallback Color */}
                <div className="mb-4">
                   <label className="block text-xs font-medium text-gray-600 mb-1">Base Color</label>
                   <div className="flex items-center gap-2">
                      <input 
                          type="color" 
                          value={settings.pageBackgroundColor}
                          onChange={(e) => handleChange('pageBackgroundColor', e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer border-0 p-0 shadow-sm"
                       />
                       <span className="text-xs text-gray-500">Solid color fallback</span>
                   </div>
                </div>

                {/* Upload Button */}
                <div className="mb-4">
                   <label className="block text-xs font-medium text-gray-600 mb-1">Upload Texture</label>
                   <label className="flex items-center justify-center w-full py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-all text-xs font-medium text-gray-600 gap-2">
                      <Upload className="w-3 h-3" />
                      Upload Image
                      <input type="file" className="hidden" accept="image/*" onChange={handleBgUpload} />
                   </label>
                </div>

                {/* AI Generation */}
                <div className="mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-100">
                   <label className="block text-xs font-bold text-indigo-700 mb-2 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      Generate Texture (Nano Banana)
                   </label>
                   <div className="flex flex-col gap-2">
                      <input 
                         type="text" 
                         value={bgPrompt}
                         onChange={(e) => setBgPrompt(e.target.value)}
                         placeholder="e.g. vintage floral paper, grunge concrete"
                         className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                      
                      {/* Reference Image Upload */}
                      <div className="flex items-center gap-2">
                         <label className="flex-shrink-0 p-2 bg-white border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-50 text-indigo-400 transition-colors" title="Attach Reference Image">
                            <Paperclip className="w-4 h-4" />
                            <input type="file" className="hidden" accept="image/*" onChange={handleRefImageUpload} />
                         </label>
                         
                         {bgRefImage ? (
                            <div className="relative h-8 w-8 rounded-md overflow-hidden border border-indigo-200 group">
                               <img src={bgRefImage} alt="Ref" className="w-full h-full object-cover" />
                               <button 
                                 onClick={() => setBgRefImage(null)}
                                 className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                  <X className="w-3 h-3" />
                               </button>
                            </div>
                         ) : (
                            <span className="text-[10px] text-gray-400 italic">Optional: Attach reference image</span>
                         )}
                      </div>

                      <button 
                         onClick={handleGenerateBg}
                         disabled={isGeneratingBg || !bgPrompt.trim()}
                         className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all mt-1"
                      >
                         {isGeneratingBg ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                         Generate
                      </button>
                   </div>
                </div>

                {/* Saved Backgrounds Gallery */}
                <div className="mt-6">
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-600">Background Library</label>
                      <button 
                         onClick={() => selectBackground(undefined)}
                         className="text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1"
                         title="Remove global background image"
                      >
                         <Trash2 className="w-3 h-3" /> Clear Active
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                      {settings.savedBackgrounds.map((bg, idx) => (
                         <button 
                            key={idx}
                            onClick={() => selectBackground(bg)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${settings.defaultBackgroundImage === bg ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'}`}
                         >
                            <img src={bg} alt="bg" className="w-full h-full object-cover" />
                            {settings.defaultBackgroundImage === bg && (
                               <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                                  <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                               </div>
                            )}
                         </button>
                      ))}
                      
                      {/* Placeholder for 'No Image' */}
                      <button 
                         onClick={() => selectBackground(undefined)}
                         className={`relative aspect-square rounded-lg border-2 flex items-center justify-center bg-gray-50 text-gray-400 transition-all ${!settings.defaultBackgroundImage ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-400'}`}
                         title="No Background Image"
                      >
                         <X className="w-4 h-4" />
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2">
                      Selecting a background applies it to all pages unless a page has a specific override.
                   </p>
                </div>
             </section>
          </>
        )}

      </div>
      
      <div className="p-5 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-2 pb-8 md:pb-5">
        <button 
          onClick={onPreview}
          className="w-full py-3 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-medium shadow-sm active:scale-95"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button 
          onClick={onPrint}
          className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 font-medium shadow-lg shadow-gray-200 active:scale-95"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>
    </div>
  );
};
