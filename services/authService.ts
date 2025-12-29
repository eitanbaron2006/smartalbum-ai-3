
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile
} from 'firebase/auth';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, storage } from './firebase';
import { User } from '../types';

// Map Firebase User to our App User type
const mapUser = (fbUser: FirebaseUser): User => ({
    id: fbUser.uid,
    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || '',
    photoURL: fbUser.photoURL || undefined,
});

// Upload profile photo to Firebase Storage and return download URL
const uploadProfilePhoto = async (userId: string, photoBase64: string): Promise<string> => {
    const storageRef = ref(storage, `profile-photos/${userId}`);
    // Upload the base64 string (data_url format)
    await uploadString(storageRef, photoBase64, 'data_url');
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

export const registerUser = async (email: string, password: string, username: string, photoBase64?: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    let photoURL: string | null = null;

    // If a photo was provided, upload it to storage first
    if (photoBase64 && auth.currentUser) {
        try {
            photoURL = await uploadProfilePhoto(userCredential.user.uid, photoBase64);
        } catch (error) {
            console.error('Failed to upload profile photo:', error);
            // Continue without photo if upload fails
        }
    }

    if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
            displayName: username,
            photoURL: photoURL
        });
    }

    // Re-fetch the user to get updated profile
    return {
        id: userCredential.user.uid,
        username: username,
        email: userCredential.user.email || '',
        photoURL: photoURL || undefined,
    };
};

export const loginUserFirebase = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapUser(userCredential.user);
};

export const signInWithGoogle = async (): Promise<User> => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return mapUser(userCredential.user);
};

export const logoutUserFirebase = async (): Promise<void> => {
    await signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, (fbUser) => {
        callback(fbUser ? mapUser(fbUser) : null);
    });
};
