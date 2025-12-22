
import React, { useState, useEffect } from 'react';
import { User, SavedAlbum } from '../types';
import { getUserAlbums, createNewAlbum, deleteAlbum, logoutUser } from '../services/storageService';
import { Plus, FolderOpen, Trash2, LogOut, Clock, Image as ImageIcon, Sparkles, ChevronRight, LayoutTemplate } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  onSelectAlbum: (album: SavedAlbum) => void;
  onLogout: () => void;
  onConnect: () => void; // Trigger login/signup
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSelectAlbum, onLogout, onConnect }) => {
  const [albums, setAlbums] = useState<SavedAlbum[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAlbums();
    } else {
      setAlbums([]);
    }
  }, [user?.id]);

  const loadAlbums = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userAlbums = await getUserAlbums(user.id);
      setAlbums(userAlbums);
    } catch (error) {
      console.error("Failed to load albums", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onConnect();
      return;
    }
    if (!newAlbumName.trim()) return;

    setIsLoading(true);
    try {
      const album = await createNewAlbum(user.id, newAlbumName.trim());
      setIsCreateModalOpen(false);
      setNewAlbumName('');
      onSelectAlbum(album);
    } catch (error) {
      console.error("Failed to create album", error);
      alert("Could not create album. Storage might be full.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, albumId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this album?')) {
      try {
        await deleteAlbum(user.id, albumId);
        loadAlbums();
      } catch (error) {
        console.error("Failed to delete album", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">SmartAlbum AI</span>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-gray-800">{user.username}</span>
                <span className="text-xs text-gray-500">Free Plan</span>
              </div>
              <button
                onClick={() => { logoutUser(); onLogout(); }}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onConnect}
              className="px-5 py-2.5 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden -z-10 bg-white">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-200/40 rounded-full blur-[100px]" />
          <div className="absolute top-[20%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px]" />
          <div className="absolute bottom-[0%] right-[20%] w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-[80px]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
            <Sparkles className="w-3 h-3" /> New AI Capabilities
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight animate-in slide-in-from-bottom-8 fade-in duration-700 delay-100">
            Memories Reimagined <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              With Artificial Intelligence
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
            Turn your photo collection into professionally designed albums in seconds.
            Smart layouts, AI covers, and beautiful textures await.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700 delay-300">
            <button
              onClick={() => user ? setIsCreateModalOpen(true) : onConnect()}
              className="group relative px-8 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 text-lg"
            >
              <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Create New Album
            </button>

            <button
              onClick={() => {
                const section = document.getElementById('recent-projects');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
            >
              View My Projects
            </button>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div id="recent-projects" className="flex-1 bg-gray-50/50 border-t border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LayoutTemplate className="w-6 h-6 text-indigo-600" />
              Recent Projects
            </h2>
            <div className="text-sm text-gray-500 font-medium">
              {albums.length} Albums
            </div>
          </div>

          {isLoading && albums.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center h-80 flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <FolderOpen className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Start your first masterpiece today. It only takes a few seconds to get started.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-2 hover:gap-3 transition-all"
              >
                Create Album <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {/* Quick Add Card */}
              <div
                onClick={() => user ? setIsCreateModalOpen(true) : onConnect()}
                className="bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group min-h-[300px]"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-indigo-100 group-hover:scale-110 transition-all duration-300 mb-4">
                  <Plus className="w-8 h-8 text-gray-400 group-hover:text-indigo-600" />
                </div>
                <span className="font-bold text-gray-500 group-hover:text-indigo-700 transition-colors">Create New Album</span>
              </div>

              {/* Album Cards */}
              {albums.map(album => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum(album)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer group flex flex-col border border-gray-100"
                >
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {album.thumbnailUrl ? (
                      <img src={album.thumbnailUrl} alt={album.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 backdrop-blur-md text-gray-900 font-bold px-4 py-2 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-transform shadow-lg">
                        Open Editors
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{album.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                      <Clock className="w-3 h-3" />
                      {new Date(album.updatedAt).toLocaleDateString()}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-50">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {album.data.photos.length} Photos
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, album.id)}
                        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Delete Album"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">SmartAlbum AI</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Terms of Service</a>
            <a href="#" className="hover:text-gray-900">Support</a>
          </div>
        </div>
      </footer>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in"
            onClick={() => setIsCreateModalOpen(false)}
          />

          {/* Modal */}
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Create New Album</h2>
              <p className="text-gray-500 mt-2">Give your new collection a memorable name.</p>
            </div>

            <form onSubmit={handleCreate}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Album Title</label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="e.g. Italian Vacation 2024"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all text-lg"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!newAlbumName.trim() || isLoading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:shadow-none"
              >
                {isLoading ? 'Creating Magic...' : 'Start Creating'}
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full py-3 mt-3 text-gray-500 font-medium hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
