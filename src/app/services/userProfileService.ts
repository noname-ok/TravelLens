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
  deleteObject
} from 'firebase/storage';
import { db, storage, auth } from '@/app/config/firebase';

const MAX_INLINE_IMAGE_BYTES = 160_000;

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
};

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
};

const makeInlineCompressedImage = async (file: File): Promise<string | null> => {
  try {
    const originalDataUrl = await fileToDataUrl(file);
    const image = await loadImage(originalDataUrl);

    const dimensions = [640, 480, 360, 280, 220];
    const qualities = [0.72, 0.62, 0.52, 0.42, 0.32, 0.24];

    for (const maxDimension of dimensions) {
      const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
      const width = Math.max(1, Math.floor(image.width * scale));
      const height = Math.max(1, Math.floor(image.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(image, 0, 0, width, height);

      for (const quality of qualities) {
        const compressed = canvas.toDataURL('image/jpeg', quality);
        if (compressed.length <= MAX_INLINE_IMAGE_BYTES) {
          return compressed;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to generate inline compressed avatar:', error);
    return null;
  }
};

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
  userInterestVector?: number[];
  preferences: {
    privateAccount: boolean;
    shareGpsData: boolean;
    darkMode: boolean;
    language: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileUpdate {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  userInterestVector?: number[];
  preferences?: {
    privateAccount?: boolean;
    shareGpsData?: boolean;
    darkMode?: boolean;
    language?: string;
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
        userInterestVector: Array.isArray(data.userInterestVector)
          ? data.userInterestVector.filter((value: unknown) => Number.isFinite(Number(value))).map((value: unknown) => Number(value))
          : undefined,
        preferences: {
          privateAccount: data.preferences?.privateAccount || false,
          shareGpsData: data.preferences?.shareGpsData || false,
          darkMode: data.preferences?.darkMode || false,
          language: data.preferences?.language || 'en',
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
    if (updates.userInterestVector !== undefined) updateData.userInterestVector = updates.userInterestVector;

    if (updates.preferences) {
      // Merge with existing preferences instead of replacing
      const existingPreferences = docSnap.exists() ? docSnap.data()?.preferences || {} : {};
      updateData.preferences = {
        privateAccount: updates.preferences.privateAccount ?? existingPreferences.privateAccount ?? false,
        shareGpsData: updates.preferences.shareGpsData ?? existingPreferences.shareGpsData ?? false,
        darkMode: updates.preferences.darkMode ?? existingPreferences.darkMode ?? false,
        language: updates.preferences.language ?? existingPreferences.language ?? 'en',
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
          language: updates.preferences?.language || 'en',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (updates.userInterestVector !== undefined) {
        newProfile.userInterestVector = updates.userInterestVector;
      }
      
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
  void uid;
  const inlineAvatar = await makeInlineCompressedImage(file);
  if (inlineAvatar) {
    return inlineAvatar;
  }
  console.error('Failed to process avatar image into inline format');
  return null;
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
          language: initialData?.preferences?.language || 'en',
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