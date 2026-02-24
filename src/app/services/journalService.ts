import {
  addDoc,
  collectionGroup,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  getDocFromServer,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/app/config/firebase';
import { generateTextEmbedding, translateJournalFields, translatePlainText } from './geminiService';

const MAX_INLINE_IMAGE_BYTES = 220_000;

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

const canvasToDataUrl = (canvas: HTMLCanvasElement, quality: number): string => {
  return canvas.toDataURL('image/jpeg', quality);
};

const extractCountry = (location: string): string => {
  const parts = location
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return '';
  return parts[parts.length - 1];
};

const makeInlineCompressedImage = async (file: File): Promise<string | null> => {
  try {
    const originalDataUrl = await fileToDataUrl(file);
    const image = await loadImage(originalDataUrl);

    const dimensions = [800, 640, 480, 360, 280];
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
        const compressed = canvasToDataUrl(canvas, quality);
        if (compressed.length <= MAX_INLINE_IMAGE_BYTES) {
          return compressed;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to generate inline compressed image:', error);
    return null;
  }
};

export interface JournalRecord {
  id: string;
  title: string;
  location: string;
  description: string;
  imageUrl?: string;
  likes: number;
  bookmarks: number;
  views: number;
  comments: number;
  country?: string;
  embedding?: number[];
  translations?: Record<string, { title: string; location: string; description: string; country?: string }>;
  likedBy?: string[];
  savedBy?: string[];
  author: string;
  authorId: string;
  authorAvatarUrl?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateJournalInput {
  title: string;
  location: string;
  description: string;
  imageUrl?: string;
  author: string;
  authorId: string;
  authorAvatarUrl?: string;
}

export interface UpdateJournalInput {
  title?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
}

export type JournalMetric = 'likes' | 'bookmarks' | 'views' | 'comments';
export type JournalReaction = 'like' | 'save';
export type InterestSignal = 'like' | 'save' | 'view';

export interface JournalCommentRecord {
  id: string;
  journalId: string;
  parentId?: string;
  authorId: string;
  author: string;
  authorAvatarUrl?: string;
  text: string;
  likes: number;
  likedBy?: string[];
  translations?: Record<string, { text: string }>;
  createdAt: Date;
}

export interface CreateJournalCommentInput {
  parentId?: string;
  authorId: string;
  author: string;
  authorAvatarUrl?: string;
  text: string;
}

export interface JournalLocalizedContent {
  title: string;
  location: string;
  description: string;
  country?: string;
}

const buildEmbeddingInput = (payload: { title: string; location: string; description: string; country?: string }) => {
  return [payload.title, payload.location, payload.country, payload.description]
    .filter(Boolean)
    .join('\n');
};

const generateEmbeddingSafely = async (
  payload: { title: string; location: string; description: string; country?: string },
): Promise<number[] | null> => {
  try {
    return await generateTextEmbedding(buildEmbeddingInput(payload));
  } catch (error) {
    console.warn('Embedding generation skipped (non-blocking):', error);
    return null;
  }
};

const normalizeVector = (vector: number[]) => {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!norm) return vector;
  return vector.map((value) => value / norm);
};

export const uploadJournalImage = async (userId: string, file: File): Promise<string | null> => {
  void userId;
  const inlineImage = await makeInlineCompressedImage(file);
  if (inlineImage) {
    return inlineImage;
  }
  console.error('Failed to process journal image into inline format');
  return null;
};

export const createJournal = async (input: CreateJournalInput): Promise<string | null> => {
  try {
    const projectId = db.app.options.projectId;
    console.log('Creating journal in Firebase project:', projectId);

    const embedding = await generateEmbeddingSafely({
      title: input.title,
      location: input.location,
      description: input.description,
      country: extractCountry(input.location),
    });

    const docRef = await addDoc(collection(db, 'journals'), {
      title: input.title,
      location: input.location,
      country: extractCountry(input.location),
      description: input.description,
      imageUrl: input.imageUrl || null,
      embedding: embedding || null,
      likes: 0,
      bookmarks: 0,
      views: 0,
      comments: 0,
      likedBy: [],
      savedBy: [],
      author: input.author,
      authorId: input.authorId,
      authorAvatarUrl: input.authorAvatarUrl || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await getDocFromServer(docRef);
    console.log('Journal created successfully with id:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating journal:', error);
    return null;
  }
};

export const updateJournal = async (journalId: string, updates: UpdateJournalInput): Promise<boolean> => {
  try {
    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined),
    ) as UpdateJournalInput;

    const updatePayload: Record<string, unknown> = {
      ...sanitizedUpdates,
      updatedAt: serverTimestamp(),
    };

    if (sanitizedUpdates.location !== undefined) {
      updatePayload.country = extractCountry(sanitizedUpdates.location);
    }

    if (
      sanitizedUpdates.title !== undefined ||
      sanitizedUpdates.location !== undefined ||
      sanitizedUpdates.description !== undefined
    ) {
      const journalRef = doc(db, 'journals', journalId);
      const currentSnap = await getDocFromServer(journalRef);
      const currentData = currentSnap.data() || {};

      const nextTitle = sanitizedUpdates.title ?? String(currentData.title || '');
      const nextLocation = sanitizedUpdates.location ?? String(currentData.location || '');
      const nextDescription = sanitizedUpdates.description ?? String(currentData.description || '');
      const nextCountry = extractCountry(nextLocation);

      const embedding = await generateEmbeddingSafely({
        title: nextTitle,
        location: nextLocation,
        description: nextDescription,
        country: nextCountry,
      });

      if (embedding && embedding.length > 0) {
        updatePayload.embedding = embedding;
      }
      updatePayload.country = nextCountry;
    }

    await updateDoc(doc(db, 'journals', journalId), {
      ...updatePayload,
    });
    return true;
  } catch (error) {
    console.error('Error updating journal:', error);
    return false;
  }
};

export const incrementJournalMetric = async (
  journalId: string,
  metric: JournalMetric,
  delta: number,
): Promise<boolean> => {
  try {
    if (delta === 0) return true;

    const journalRef = doc(db, 'journals', journalId);

    if (delta > 0) {
      await updateDoc(journalRef, {
        [metric]: increment(delta),
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(journalRef);
      if (!snap.exists()) {
        throw new Error('Journal not found');
      }

      const current = Number(snap.data()?.[metric] || 0);
      const next = Math.max(0, current + delta);
      transaction.update(journalRef, {
        [metric]: next,
        updatedAt: serverTimestamp(),
      });
    });

    return true;
  } catch (error) {
    console.error(`Error incrementing ${metric}:`, error);
    return false;
  }
};

export const incrementJournalViews = async (journalId: string): Promise<boolean> => {
  return incrementJournalMetric(journalId, 'views', 1);
};

export const subscribeToJournalComments = (
  journalId: string,
  onData: (comments: JournalCommentRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const commentsQuery = query(
    collection(db, 'journals', journalId, 'comments'),
    orderBy('createdAt', 'asc'),
  );

  return onSnapshot(
    commentsQuery,
    (snapshot) => {
      const comments: JournalCommentRecord[] = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          journalId,
          parentId: data.parentId || undefined,
          authorId: data.authorId || '',
          author: data.author || 'User',
          authorAvatarUrl: data.authorAvatarUrl || undefined,
          text: data.text || '',
          likes: data.likes || 0,
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          translations: data.translations || {},
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        };
      });
      onData(comments);
    },
    (error) => {
      console.error('Error subscribing to journal comments:', error);
      onError?.(error as Error);
    },
  );
};

export const createJournalComment = async (
  journalId: string,
  input: CreateJournalCommentInput,
): Promise<string | null> => {
  try {
    const text = input.text.trim();
    if (!text) return null;

    const commentRef = await addDoc(collection(db, 'journals', journalId, 'comments'), {
      parentId: input.parentId || null,
      authorId: input.authorId,
      author: input.author,
      authorAvatarUrl: input.authorAvatarUrl || null,
      text,
      likes: 0,
      likedBy: [],
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'journals', journalId), {
      comments: increment(1),
      updatedAt: serverTimestamp(),
    });

    return commentRef.id;
  } catch (error) {
    console.error('Error creating journal comment:', error);
    return null;
  }
};

export const deleteJournalComment = async (
  journalId: string,
  commentId: string,
  userId: string,
): Promise<boolean> => {
  try {
    const targetRef = doc(db, 'journals', journalId, 'comments', commentId);
    const targetSnap = await getDocFromServer(targetRef);

    if (!targetSnap.exists()) {
      return false;
    }

    const targetData = targetSnap.data();
    if (String(targetData.authorId || '') !== userId) {
      return false;
    }

    const allCommentsSnap = await getDocs(collection(db, 'journals', journalId, 'comments'));
    const allComments = allCommentsSnap.docs;

    const childrenMap = new Map<string, Array<typeof allComments[number]>>();
    allComments.forEach((entry) => {
      const parentId = String(entry.data().parentId || '');
      if (!parentId) return;
      const list = childrenMap.get(parentId) || [];
      list.push(entry);
      childrenMap.set(parentId, list);
    });

    const subtree: Array<typeof allComments[number]> = [];
    const queue: string[] = [commentId];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (seen.has(currentId)) continue;
      seen.add(currentId);

      const currentDoc = allComments.find((entry) => entry.id === currentId);
      if (currentDoc) subtree.push(currentDoc);

      const children = childrenMap.get(currentId) || [];
      children.forEach((child) => queue.push(child.id));
    }

    const hasForeignReplies = subtree.some(
      (entry) => entry.id !== commentId && String(entry.data().authorId || '') !== userId,
    );

    if (hasForeignReplies) {
      await updateDoc(targetRef, {
        text: 'Comment deleted',
        isDeleted: true,
        author: 'Deleted user',
        authorAvatarUrl: null,
        likes: 0,
        likedBy: [],
        updatedAt: serverTimestamp(),
      });
      return true;
    }

    const refsToDelete = subtree.map((entry) => entry.ref);
    if (refsToDelete.length === 0) return false;

    const BATCH_LIMIT = 450;
    for (let index = 0; index < refsToDelete.length; index += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = refsToDelete.slice(index, index + BATCH_LIMIT);
      chunk.forEach((ref) => batch.delete(ref));
      await batch.commit();
    }

    const removedCount = refsToDelete.length;
    const journalRef = doc(db, 'journals', journalId);
    await runTransaction(db, async (transaction) => {
      const journalSnap = await transaction.get(journalRef);
      if (!journalSnap.exists()) return;
      const currentCount = Number(journalSnap.data().comments || 0);
      transaction.update(journalRef, {
        comments: Math.max(0, currentCount - removedCount),
        updatedAt: serverTimestamp(),
      });
    });

    return true;
  } catch (error) {
    console.error('Error deleting journal comment:', error);
    return false;
  }
};

export const toggleJournalCommentLike = async (
  journalId: string,
  commentId: string,
  userId: string,
): Promise<{ active: boolean; count: number } | null> => {
  try {
    const commentRef = doc(db, 'journals', journalId, 'comments', commentId);

    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(commentRef);
      if (!snap.exists()) {
        throw new Error('Comment not found');
      }

      const data = snap.data();
      const likedBy = Array.isArray(data.likedBy) ? (data.likedBy as string[]) : [];
      const unique = Array.from(new Set(likedBy));
      const currentlyActive = unique.includes(userId);
      const nextLikedBy = currentlyActive
        ? unique.filter((id) => id !== userId)
        : [...unique, userId];

      const currentLikes = Number(data.likes || 0);
      const nextLikes = currentlyActive ? Math.max(0, currentLikes - 1) : currentLikes + 1;

      transaction.update(commentRef, {
        likedBy: nextLikedBy,
        likes: nextLikes,
      });

      return {
        active: !currentlyActive,
        count: nextLikes,
      };
    });
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return null;
  }
};

export const getJournalLocalizedContent = async (
  journalId: string,
  languageCode: string,
  original: JournalLocalizedContent,
): Promise<JournalLocalizedContent> => {
  const normalizedLanguageCode = (languageCode || 'en').toLowerCase().startsWith('zh')
    ? 'zh'
    : ((languageCode || 'en').toLowerCase().split(/[-_]/)[0] || 'en');

  if (normalizedLanguageCode === 'en') {
    return original;
  }

  try {
    const journalRef = doc(db, 'journals', journalId);
    const snap = await getDocFromServer(journalRef);
    const data = snap.data();
    const cached = data?.translations?.[normalizedLanguageCode];
    if (cached?.title && cached?.location && cached?.description) {
      return {
        title: cached.title,
        location: cached.location,
        description: cached.description,
        country: cached.country,
      };
    }

    const translatedFields = await translateJournalFields(
      {
        title: original.title,
        location: original.location,
        description: original.description,
      },
      normalizedLanguageCode,
    );

    const translated: JournalLocalizedContent = {
      title: translatedFields.title,
      location: translatedFields.location,
      description: translatedFields.description,
      country: original.country,
    };

    try {
      await updateDoc(journalRef, {
        [`translations.${normalizedLanguageCode}`]: translated,
        updatedAt: serverTimestamp(),
      });
    } catch (cacheError) {
      console.warn('Skipping journal translation cache update:', cacheError);
    }

    return translated;
  } catch (error) {
    console.error('Error getting journal localized content:', error);
    return original;
  }
};

export const getJournalCommentLocalizedText = async (
  journalId: string,
  commentId: string,
  languageCode: string,
  originalText: string,
): Promise<string> => {
  const normalizedLanguageCode = (languageCode || 'en').toLowerCase().startsWith('zh')
    ? 'zh'
    : ((languageCode || 'en').toLowerCase().split(/[-_]/)[0] || 'en');

  if (normalizedLanguageCode === 'en') {
    return originalText;
  }

  try {
    const commentRef = doc(db, 'journals', journalId, 'comments', commentId);
    const snap = await getDocFromServer(commentRef);
    const data = snap.data();
    const cached = data?.translations?.[normalizedLanguageCode]?.text;
    if (cached) return cached;

    const translatedText = await translatePlainText(originalText, normalizedLanguageCode);
    try {
      await updateDoc(commentRef, {
        [`translations.${normalizedLanguageCode}.text`]: translatedText,
      });
    } catch (cacheError) {
      console.warn('Skipping comment translation cache update:', cacheError);
    }
    return translatedText;
  } catch (error) {
    console.error('Error getting localized comment text:', error);
    return originalText;
  }
};

export const toggleJournalReaction = async (
  journalId: string,
  userId: string,
  reaction: JournalReaction,
): Promise<{ active: boolean; count: number } | null> => {
  try {
    const journalRef = doc(db, 'journals', journalId);

    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(journalRef);
      if (!snap.exists()) {
        throw new Error('Journal not found');
      }

      const data = snap.data();
      const listField = reaction === 'like' ? 'likedBy' : 'savedBy';
      const countField = reaction === 'like' ? 'likes' : 'bookmarks';

      const currentList = Array.isArray(data[listField])
        ? (data[listField] as string[])
        : [];
      const uniqueList = Array.from(new Set(currentList));
      const currentlyActive = uniqueList.includes(userId);

      const nextList = currentlyActive
        ? uniqueList.filter((id) => id !== userId)
        : [...uniqueList, userId];

      const currentCount = Number(data[countField] || 0);
      const nextCount = currentlyActive
        ? Math.max(0, currentCount - 1)
        : currentCount + 1;

      transaction.update(journalRef, {
        [listField]: nextList,
        [countField]: nextCount,
        updatedAt: serverTimestamp(),
      });

      return {
        active: !currentlyActive,
        count: nextCount,
      };
    });
  } catch (error) {
    console.error(`Error toggling ${reaction}:`, error);
    return null;
  }
};

export const deleteJournal = async (journalId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'journals', journalId));
    return true;
  } catch (error) {
    console.error('Error deleting journal:', error);
    return false;
  }
};

export const syncAuthorAvatarAcrossContent = async (
  userId: string,
  avatarUrl?: string,
): Promise<boolean> => {
  try {
    const normalizedAvatar = avatarUrl || null;
    const refsToUpdate = [] as Array<ReturnType<typeof doc>>;

    const journalsQuery = query(collection(db, 'journals'), where('authorId', '==', userId));
    const journalSnapshot = await getDocs(journalsQuery);
    journalSnapshot.docs.forEach((entry) => {
      refsToUpdate.push(entry.ref);
    });

    const commentsQuery = query(collectionGroup(db, 'comments'), where('authorId', '==', userId));
    const commentSnapshot = await getDocs(commentsQuery);
    commentSnapshot.docs.forEach((entry) => {
      refsToUpdate.push(entry.ref);
    });

    if (refsToUpdate.length === 0) return true;

    const BATCH_LIMIT = 450;
    for (let index = 0; index < refsToUpdate.length; index += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = refsToUpdate.slice(index, index + BATCH_LIMIT);
      chunk.forEach((ref) => {
        batch.update(ref, {
          authorAvatarUrl: normalizedAvatar,
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }

    return true;
  } catch (error) {
    console.error('Error syncing author avatar across content:', error);
    return false;
  }
};

const INTEREST_SIGNAL_WEIGHT: Record<InterestSignal, number> = {
  view: 0.08,
  like: 0.2,
  save: 0.3,
};

export const recordUserJournalInterest = async (
  userId: string,
  journalId: string,
  signal: InterestSignal,
): Promise<number[] | null> => {
  try {
    const journalRef = doc(db, 'journals', journalId);
    const journalSnap = await getDocFromServer(journalRef);
    if (!journalSnap.exists()) return null;

    const journalData = journalSnap.data();
    let journalEmbedding = Array.isArray(journalData.embedding)
      ? (journalData.embedding as number[]).filter((value) => Number.isFinite(Number(value))).map((value) => Number(value))
      : null;

    if (!journalEmbedding || journalEmbedding.length === 0) {
      const fallbackEmbedding = await generateTextEmbedding(
        buildEmbeddingInput({
          title: String(journalData.title || ''),
          location: String(journalData.location || ''),
          description: String(journalData.description || ''),
          country: String(journalData.country || ''),
        }),
      );
      if (!fallbackEmbedding || fallbackEmbedding.length === 0) return null;
      journalEmbedding = fallbackEmbedding;
      await updateDoc(journalRef, {
        embedding: journalEmbedding,
        updatedAt: serverTimestamp(),
      });
    }

    const usersRef = doc(db, 'users', userId);
    const userSnap = await getDocFromServer(usersRef);
    const currentVector = userSnap.exists() && Array.isArray(userSnap.data().userInterestVector)
      ? (userSnap.data().userInterestVector as number[])
          .filter((value) => Number.isFinite(Number(value)))
          .map((value) => Number(value))
      : [];

    const length = journalEmbedding.length;
    const alignedCurrent = currentVector.length === length
      ? currentVector
      : new Array(length).fill(0);

    const weight = INTEREST_SIGNAL_WEIGHT[signal] ?? 0.12;
    const nextVectorRaw = alignedCurrent.map((value, index) => {
      const next = (1 - weight) * value + weight * (journalEmbedding?.[index] ?? 0);
      return Number.isFinite(next) ? next : 0;
    });

    const nextVector = normalizeVector(nextVectorRaw);

    await setDoc(usersRef, {
      userInterestVector: nextVector,
      lastInterestSignal: signal,
      lastInterestUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return nextVector;
  } catch (error) {
    console.error('Error recording user journal interest:', error);
    return null;
  }
};

export const subscribeToJournals = (
  onData: (journals: JournalRecord[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe => {
  const q = query(collection(db, 'journals'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const journals: JournalRecord[] = snapshot.docs.map((entry) => {
        const data = entry.data();
        return {
          id: entry.id,
          title: data.title || '',
          location: data.location || '',
          description: data.description || '',
          imageUrl: data.imageUrl || undefined,
          likes: data.likes || 0,
          bookmarks: data.bookmarks || 0,
          views: data.views || 0,
          comments: data.comments || 0,
          country: data.country || extractCountry(data.location || ''),
          embedding: Array.isArray(data.embedding)
            ? data.embedding.filter((value: unknown) => Number.isFinite(Number(value))).map((value: unknown) => Number(value))
            : undefined,
          translations: data.translations || {},
          likedBy: Array.isArray(data.likedBy) ? data.likedBy : [],
          savedBy: Array.isArray(data.savedBy) ? data.savedBy : [],
          author: data.author || 'User',
          authorId: data.authorId || '',
          authorAvatarUrl: data.authorAvatarUrl || undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : undefined,
        };
      });

      onData(journals);
    },
    (error) => {
      console.error('Error subscribing to journals:', error);
      onError?.(error as Error);
    },
  );
};
