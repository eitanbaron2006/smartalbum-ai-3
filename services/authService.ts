
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { User } from '../types';

// Map Firebase User to our App User type
const mapUser = (fbUser: FirebaseUser): User => ({
    id: fbUser.uid,
    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
    email: fbUser.email || '',
});

export const registerUser = async (email: string, password: string, username: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: username });
    }
    return mapUser(userCredential.user);
};

export const loginUserFirebase = async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
