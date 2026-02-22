import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage, auth } from '@/app/config/firebase';

// Check if Firebase services are initialized
const isFirebaseInitialized = () => {
  try {
    return !!(db && storage && auth);
  } catch {
    return false;
  }
};

export interface UserProfile {
  uid: string;
  name: string;
  bio: string;
  avatarUrl?: string;
  preferences: {
    privateAccount: boolean;
    shareGpsData: boolean;
    darkMode: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileUpdate {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  preferences?: {
    privateAccount?: boolean;
    shareGpsData?: boolean;
    darkMode?: boolean;
  };
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    console.log('Getting user profile for UID:', uid);

    if (!isFirebaseInitialized()) {
      console.error('Firebase not initialized');
      throw new Error('Firebase not initialized');
    }

    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Profile data found:', data);
      return {
        uid,
        name: data.name || 'User',
        bio: data.bio || '',
        avatarUrl: data.avatarUrl,
        preferences: {
          privateAccount: data.preferences?.privateAccount || false,
          shareGpsData: data.preferences?.shareGpsData || false,
          darkMode: data.preferences?.darkMode || false,
        },
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      };
    }
    console.log('No profile found for user, returning null');
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error; // Re-throw to be caught by caller
  }
};

/**
 * Create or update user profile in Firestore
 */
export const updateUserProfile = async (uid: string, updates: UserProfileUpdate): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.avatarUrl !== undefined) updateData.avatarUrl = updates.avatarUrl;

    if (updates.preferences) {
      // Merge with existing preferences instead of replacing
      const existingPreferences = docSnap.exists() ? docSnap.data()?.preferences || {} : {};
      updateData.preferences = {
        privateAccount: updates.preferences.privateAccount ?? existingPreferences.privateAccount ?? false,
        shareGpsData: updates.preferences.shareGpsData ?? existingPreferences.shareGpsData ?? false,
        darkMode: updates.preferences.darkMode ?? existingPreferences.darkMode ?? false,
      };
    }

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, updateData);
    } else {
      // Create new document - avoid undefined values
      const newProfile: any = {
        name: updates.name || 'User',
        bio: updates.bio || '',
        preferences: {
          privateAccount: updates.preferences?.privateAccount || false,
          shareGpsData: updates.preferences?.shareGpsData || false,
          darkMode: updates.preferences?.darkMode || false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Only add avatarUrl if it's defined
      if (updates.avatarUrl !== undefined) {
        newProfile.avatarUrl = updates.avatarUrl;
      }
      
      await setDoc(docRef, newProfile);
    }

    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
};

/**
 * Upload avatar image to Firebase Storage
 */
export const uploadAvatar = async (uid: string, file: File): Promise<string | null> => {
  try {
    console.log('Starting avatar upload for user:', uid);
    
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `avatars/${uid}/${timestamp}_${file.name}`;
    console.log('Upload path:', filename);
    
    const storageRef = ref(storage, filename);

    // Upload the file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: uid
      }
    };

    console.log('Uploading file...');
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('Upload successful:', snapshot);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('Download URL:', downloadURL);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error details:', error);
    }
    return null;
  }
};

/**
 * Delete old avatar from Firebase Storage
 */
export const deleteOldAvatar = async (oldAvatarUrl: string): Promise<boolean> => {
  try {
    // Extract the path from the URL
    const url = new URL(oldAvatarUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1].split('?')[0]);

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);

    return true;
  } catch (error) {
    console.error('Error deleting old avatar:', error);
    return false;
  }
};

/**
 * Initialize user profile when user signs up
 */
export const initializeUserProfile = async (uid: string, initialData?: Partial<UserProfileUpdate>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      const newProfile: Omit<UserProfile, 'uid'> = {
        name: initialData?.name || 'User',
        location: initialData?.location || '',
        avatarUrl: initialData?.avatarUrl,
        preferences: {
          privateAccount: initialData?.preferences?.privateAccount || false,
          shareGpsData: initialData?.preferences?.shareGpsData || false,
          darkMode: initialData?.preferences?.darkMode || false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await setDoc(docRef, newProfile);
    }

    return true;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    return false;
  }
};

/**
 * Get current user's profile (convenience function)
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  return getUserProfile(user.uid);
};

/**
 * Update current user's profile (convenience function)
 */
export const updateCurrentUserProfile = async (updates: UserProfileUpdate): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;

  return updateUserProfile(user.uid, updates);
};