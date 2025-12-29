import React, { useState, useEffect } from 'react';
import { User, SavedAlbum } from '../types';
import { getUserAlbums, createNewAlbum, deleteAlbum, logoutUser } from '../services/storageService';
import { Plus, FolderOpen, Trash2, LogOut, Clock, Image as ImageIcon, Sparkles, ChevronRight, LayoutTemplate, Wand2, Share2 } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  onSelectAlbum: (album: SavedAlbum) => void;
  onLogout: () => void;
  onConnect: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSelectAlbum, onLogout, onConnect }) => {
  const [albums, setAlbums] = useState<SavedAlbum[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans overflow-x-hidden">

      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            SmartAlbum
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-gray-100"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.username}
                    className="w-9 h-9 rounded-full border-2 border-indigo-100"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-gray-700">{user.username}</span>
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600">
                      <div className="flex items-center gap-3">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.username}
                            className="w-14 h-14 rounded-full border-2 border-white shadow-lg"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="text-white">
                          <p className="font-bold text-lg">{user.username}</p>
                          <p className="text-white/80 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">Account</div>
                      <button
                        onClick={() => { logoutUser(); onLogout(); setIsProfileOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={onConnect}
              className="hidden md:block px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-28 pb-16 lg:pt-40 lg:pb-24 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 text-center">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3 h-3" />
            AI Photo Book Creator
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Create Beautiful <br />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Photo Albums
            </span>
          </h1>

          <p className="max-w-xl mx-auto text-lg text-gray-500 mb-10">
            Transform your digital photos into professionally designed masterpieces with
            <span className="font-medium text-gray-700"> Smart Layouts</span> and
            <span className="font-medium text-gray-700"> AI-Generated Covers</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => user ? setIsCreateModalOpen(true) : onConnect()}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl flex items-center gap-3 text-lg font-semibold w-full sm:w-auto justify-center"
            >
              <Plus className="w-5 h-5" />
              Create New Album
            </button>

            <button
              onClick={() => {
                const section = document.getElementById('recent-projects');
                section?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm hover:bg-gray-50 w-full sm:w-auto"
            >
              View My Projects
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: LayoutTemplate,
                title: 'Smart Layouts',
                desc: 'Automatically arrange photos into beautiful, balanced grids suitable for printing.'
              },
              {
                icon: Wand2,
                title: 'AI Enhancements',
                desc: 'Generate stunning cover art and background textures with Nano Banana AI.'
              },
              {
                icon: Share2,
                title: 'Easy Export',
                desc: 'Download pages as high-resolution images or PDF-ready zip files.'
              }
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div id="recent-projects" className="flex-1 bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <LayoutTemplate className="w-6 h-6 text-indigo-600" />
                Recent Projects
              </h2>
              <p className="text-gray-500 text-sm mt-1">Pick up where you left off</p>
            </div>
            {albums.length > 0 && (
              <div className="text-sm font-medium text-gray-500">
                {albums.length} Albums
              </div>
            )}
          </div>

          {isLoading && albums.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-gray-100" />
              ))}
            </div>
          ) : albums.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No albums yet</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                Start your first masterpiece today. It only takes a few seconds.
              </p>
              <button
                onClick={() => user ? setIsCreateModalOpen(true) : onConnect()}
                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 flex items-center gap-2 mx-auto"
              >
                Create Album <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Quick Add Card */}
              <div
                onClick={() => user ? setIsCreateModalOpen(true) : onConnect()}
                className="bg-white border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 min-h-[280px]"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <span className="font-semibold text-gray-500">Create New Album</span>
              </div>

              {/* Album Cards */}
              {albums.map(album => (
                <div
                  key={album.id}
                  onClick={() => onSelectAlbum(album)}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg cursor-pointer flex flex-col border border-gray-100"
                >
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    {album.thumbnailUrl ? (
                      <img src={album.thumbnailUrl} alt={album.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-300">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 text-lg mb-1 truncate">{album.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Clock className="w-3 h-3" />
                      {new Date(album.updatedAt).toLocaleDateString()}
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {album.data.photos.length} Photos
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, album.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
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
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600" />
            <span className="font-semibold text-gray-700">SmartAlbum AI</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-900">Privacy</a>
            <a href="#" className="hover:text-gray-900">Terms</a>
            <a href="#" className="hover:text-gray-900">Support</a>
          </div>
        </div>
      </footer>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsCreateModalOpen(false)}
          />
          <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative z-10">
            <div className="text-center mb-6">
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
                  placeholder="e.g. Summer Vacation 2024"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-lg"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={!newAlbumName.trim() || isLoading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Start Creating'}
              </button>

              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="w-full py-3 mt-3 text-gray-500 font-medium hover:text-gray-800"
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
