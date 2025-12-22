
import { SavedAlbum, User, AlbumData, DEFAULT_SETTINGS } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Key Constants for localStorage (Small data)
const USERS_KEY = 'smartalbum_users';
const ACTIVE_USER_KEY = 'smartalbum_active_user';

// Constants for IndexedDB (Large data)
const DB_NAME = 'SmartAlbumDB';
const DB_VERSION = 1;
const ALBUM_STORE = 'albums';

// --- User Management (LocalStorage is fine for this) ---

export const loginUser = (username: string): User => {
  const usersStr = localStorage.getItem(USERS_KEY);
  let users: User[] = usersStr ? JSON.parse(usersStr) : [];
  
  let user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!user) {
    user = {
      id: uuidv4(),
      username,
      email: ''
    };
    users.push(user);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  
  localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(ACTIVE_USER_KEY);
};

export const getActiveUser = (): User | null => {
  const u = localStorage.getItem(ACTIVE_USER_KEY);
  return u ? JSON.parse(u) : null;
};

// --- Album Management (IndexedDB) ---

// Helper to open DB
const getDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject("Error opening database");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ALBUM_STORE)) {
        db.createObjectStore(ALBUM_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const getUserAlbums = async (userId: string): Promise<SavedAlbum[]> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(ALBUM_STORE, 'readonly');
      const store = tx.objectStore(ALBUM_STORE);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allAlbums: SavedAlbum[] = request.result || [];
        // Filter by user ID and sort by date
        const userAlbums = allAlbums
          .filter(a => a.userId === userId)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(userAlbums);
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load albums", error);
    return [];
  }
};

export const createNewAlbum = async (userId: string, name: string): Promise<SavedAlbum> => {
  const newAlbum: SavedAlbum = {
    id: uuidv4(),
    userId,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    data: {
      photos: [],
      pages: [],
      settings: { ...DEFAULT_SETTINGS, albumTitle: name }
    }
  };
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUM_STORE, 'readwrite');
    const store = tx.objectStore(ALBUM_STORE);
    const request = store.add(newAlbum);
    
    request.onsuccess = () => resolve(newAlbum);
    request.onerror = () => reject(request.error);
  });
};

export const saveAlbum = async (userId: string, albumId: string, data: AlbumData, thumbnailUrl?: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUM_STORE, 'readwrite');
    const store = tx.objectStore(ALBUM_STORE);
    
    // Get existing to merge metadata if needed
    const getReq = store.get(albumId);
    
    getReq.onsuccess = () => {
      const existing: SavedAlbum = getReq.result;
      if (existing && existing.userId === userId) {
        const updatedAlbum: SavedAlbum = {
          ...existing,
          name: data.settings.albumTitle || existing.name,
          updatedAt: Date.now(),
          thumbnailUrl: thumbnailUrl || existing.thumbnailUrl,
          data
        };
        
        const putReq = store.put(updatedAlbum);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        reject("Album not found or access denied");
      }
    };
    
    getReq.onerror = () => reject(getReq.error);
  });
};

export const deleteAlbum = async (userId: string, albumId: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ALBUM_STORE, 'readwrite');
    const store = tx.objectStore(ALBUM_STORE);
    
    // We strictly delete by ID. In a real backend, we'd verify userId ownership first.
    const request = store.delete(albumId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};
