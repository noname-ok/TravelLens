import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from '@/app/config/firebase';

export interface UserProfileData {
  name: string;
  location: string;
  avatarUrl?: string;
}

export interface SaveProfileInput {
  uid: string;
  name: string;
  location: string;
  avatarFile?: File;
  avatarUrl?: string;
}

const uploadWithTimeout = (pathRef: ReturnType<typeof ref>, file: File, timeoutMs = 15000) => {
  return new Promise<void>((resolve, reject) => {
    const task = uploadBytesResumable(pathRef, file);
    const timer = setTimeout(() => {
      task.cancel();
      reject(new Error('Avatar upload timed out. Please try again.'));
    }, timeoutMs);

    task.on(
      'state_changed',
      undefined,
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
      () => {
        clearTimeout(timer);
        resolve();
      }
    );
  });
};

export const getUserProfile = async (uid: string) => {
  try {
    const profileRef = doc(db, 'profiles', uid);
    const snapshot = await getDoc(profileRef);
    if (!snapshot.exists()) {
      return { success: true, profile: null as UserProfileData | null };
    }
    const data = snapshot.data() as UserProfileData;
    return { success: true, profile: data };
  } catch (error: any) {
    return { success: false, error: error.message, profile: null as UserProfileData | null };
  }
};

export const saveUserProfile = async ({ uid, name, location, avatarFile, avatarUrl }: SaveProfileInput) => {
  try {
    let nextAvatarUrl = avatarUrl;
    if (avatarFile) {
      const avatarRef = ref(storage, `profiles/${uid}/avatar`);
      await uploadWithTimeout(avatarRef, avatarFile);
      nextAvatarUrl = await getDownloadURL(avatarRef);
    }

    const profileRef = doc(db, 'profiles', uid);
    const payload: UserProfileData & { updatedAt: unknown } = {
      name,
      location,
      updatedAt: serverTimestamp(),
    };

    if (nextAvatarUrl) {
      payload.avatarUrl = nextAvatarUrl;
    }

    await setDoc(profileRef, payload, { merge: true });

    if (auth.currentUser) {
      if (nextAvatarUrl) {
        await updateProfile(auth.currentUser, {
          displayName: name,
          photoURL: nextAvatarUrl,
        });
      } else {
        await updateProfile(auth.currentUser, {
          displayName: name,
        });
      }
    }

    return { success: true, profile: { name, location, avatarUrl: nextAvatarUrl } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const createUserProfile = async (uid: string, name: string, location = '') => {
  return saveUserProfile({ uid, name, location });
};
