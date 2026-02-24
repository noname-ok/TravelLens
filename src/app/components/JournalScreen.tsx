import { useEffect, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { normalizeLanguageCode } from '@/i18n';
import JournalCard from './JournalCard';
import {
  getJournalLocalizedContent,
  subscribeToJournals,
  toggleJournalReaction,
  type JournalRecord,
} from '@/app/services/journalService';
import { query, where, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/config/firebase';

// small helper to format numbers like 1200 -> 1.2k
function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
}

function formatTimeAgo(date: Date, language = 'en') {
  const rtf = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return rtf.format(0, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  const days = Math.floor(hours / 24);
  return rtf.format(-days, 'day');
}

interface JournalScreenProps {
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
  currentUserId?: string;
  onLogout?: () => void;
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onOpenJournal?: (journal: JournalEntry) => void;
  onCreateJournal?: () => void;
  onEditJournal?: (journal: JournalEntry) => void;
  onOpenUserProfile?: (user: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
  userInterestVector?: number[];
  onPositiveInteraction?: (journalId: string, signal: 'like' | 'save') => void;
  initialTab?: JournalTab;
}

export interface JournalEntry {
  id: string;
  timeAgo: string;
  title: string;
  location: string;
  description: string;
  imageUrl?: string;
  imageUrls?: string[]; // Support multiple images
  likes: number;
  bookmarks: number;
  views?: number;
  comments?: number;
  country?: string;
  embedding?: number[];
  likedBy?: string[];
  savedBy?: string[];
  author?: string;
  authorId?: string;
  authorAvatarUrl?: string;
  isLiked?: boolean;
  isSaved?: boolean;
  translationStatus?: 'translating' | 'translated' | 'fallback';
}

export type JournalTab = 'community' | 'myJournal' | 'favourites' | 'notifications';
type Tab = JournalTab;

interface Notification {
  id: string;
  type: 'like' | 'save' | 'comment' | 'reply';
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  postId: string;
  postTitle: string;
  commentText?: string;
  createdAt: Date;
}

export default function JournalScreen({
  userName,
  userEmail,
  userAvatarUrl,
  currentUserId,
  currentScreen,
  onNavigate,
  onOpenJournal,
  onCreateJournal,
  onEditJournal,
  onOpenUserProfile,
  userInterestVector,
  onPositiveInteraction,
  initialTab,
}: JournalScreenProps) {
  const { i18n, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const userInitial = (userName && userName.charAt(0).toUpperCase()) || (userEmail && userEmail.charAt(0).toUpperCase()) || 'U';

  const [journals, setJournals] = useState<JournalEntry[]>([]);

  const cosineSimilarity = (left: number[], right: number[]) => {
    const length = Math.min(left.length, right.length);
    if (length === 0) return 0;

    let dot = 0;
    let leftNorm = 0;
    let rightNorm = 0;

    for (let index = 0; index < length; index += 1) {
      const leftValue = Number(left[index]) || 0;
      const rightValue = Number(right[index]) || 0;
      dot += leftValue * rightValue;
      leftNorm += leftValue * leftValue;
      rightNorm += rightValue * rightValue;
    }

    if (!leftNorm || !rightNorm) return 0;
    return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
  };

  const engagementScore = (entry: JournalEntry) => {
    return (entry.likes || 0) * 1.3 + (entry.bookmarks || 0) * 1.5 + (entry.views || 0) * 0.15 + (entry.comments || 0) * 2;
  };

  const communityPosts = (() => {
    const base = journals;
    if (!userInterestVector || userInterestVector.length === 0) {
      return [...base].sort((left, right) => engagementScore(right) - engagementScore(left));
    }

    return [...base].sort((left, right) => {
      const leftSimilarity = left.embedding?.length ? cosineSimilarity(userInterestVector, left.embedding) : -1;
      const rightSimilarity = right.embedding?.length ? cosineSimilarity(userInterestVector, right.embedding) : -1;
      if (rightSimilarity !== leftSimilarity) return rightSimilarity - leftSimilarity;
      return engagementScore(right) - engagementScore(left);
    });
  })();
  const myJournalPosts = journals.filter((post) => post.authorId === currentUserId);
  const favorites = journals.filter((post) => post.isSaved);
  const likes = myJournalPosts.reduce((sum, entry) => sum + (entry.likes ?? 0), 0);
  const totalViews = myJournalPosts.reduce((sum, entry) => sum + (entry.views ?? 0), 0);
  const countries = new Set(
    myJournalPosts
      .map((entry) => {
        if (entry.country) return entry.country;
        const parts = entry.location.split(',').map((part) => part.trim()).filter(Boolean);
        return parts.length > 0 ? parts[parts.length - 1] : '';
      })
      .filter(Boolean),
  ).size;

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToJournals(
      (records: JournalRecord[]) => {
        const currentLanguage = normalizeLanguageCode(i18n.language || 'en');
        const mapped: JournalEntry[] = records.map((record) => {
          const translated = record.translations?.[currentLanguage];
          const hasLocalizedContent = Boolean(translated?.title && translated?.location && translated?.description);
          const isLocalizedFallback = hasLocalizedContent
            ? translated?.title === record.title
              && translated?.location === record.location
              && translated?.description === record.description
            : false;
          return {
            id: record.id,
            timeAgo: formatTimeAgo(record.createdAt, currentLanguage),
            title: translated?.title || record.title,
            location: translated?.location || record.location,
            description: translated?.description || record.description,
            imageUrl: record.imageUrl,
            imageUrls: (record as any).imageUrls, // Support multiple images
            likes: record.likes,
            bookmarks: record.bookmarks,
            views: record.views,
            comments: record.comments,
            country: record.country,
            embedding: record.embedding,
            likedBy: record.likedBy,
            savedBy: record.savedBy,
            author: record.author,
            authorId: record.authorId,
            authorAvatarUrl:
              currentUserId && record.authorId === currentUserId
                ? (userAvatarUrl || record.authorAvatarUrl)
                : record.authorAvatarUrl,
            isLiked: currentUserId ? (record.likedBy || []).includes(currentUserId) : false,
            isSaved: currentUserId ? (record.savedBy || []).includes(currentUserId) : false,
            translationStatus:
              currentLanguage === 'en'
                ? undefined
                : hasLocalizedContent
                  ? (isLocalizedFallback ? 'fallback' : 'translated')
                  : 'translating',
          };
        });
        if (!isActive) return;
        setJournals(mapped);

        if (currentLanguage === 'en') return;

        const missingTranslations = records.filter((record) => !record.translations?.[currentLanguage]);
        if (missingTranslations.length === 0) return;

        void (async () => {
          const batchSize = 2;
          for (let index = 0; index < missingTranslations.length; index += batchSize) {
            const chunk = missingTranslations.slice(index, index + batchSize);

            const chunkResults = await Promise.all(
              chunk.map(async (record) => {
                const localized = await getJournalLocalizedContent(record.id, currentLanguage, {
                  title: record.title,
                  location: record.location,
                  description: record.description,
                  country: record.country,
                });
                return { record, localized };
              }),
            );

            if (!isActive) return;

            setJournals((prev) =>
              prev.map((entry) => {
                const result = chunkResults.find((item) => item.record.id === entry.id);
                if (!result) return entry;
                const { record, localized } = result;
                return {
                  ...entry,
                  title: localized.title,
                  location: localized.location,
                  description: localized.description,
                  country: localized.country || entry.country,
                  timeAgo: formatTimeAgo(record.createdAt, currentLanguage),
                  translationStatus:
                    localized.title === record.title
                    && localized.location === record.location
                    && localized.description === record.description
                      ? 'fallback'
                      : 'translated',
                };
              }),
            );
          }
        })();
      },
      () => {
        toast.error('Failed to load journals');
      },
    );

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [i18n.language, currentUserId, userAvatarUrl]);

  // Fetch notifications: likes, saves, and comments on user's own posts
  useEffect(() => {
    if (!currentUserId) {
      setNotifications([]);
      return;
    }

    let isActive = true;

    const fetchNotifications = async () => {
      try {
        // Subscribe to journals where current user is the author
        const journalQuery = query(
          collection(db, 'journals'),
          where('authorId', '==', currentUserId),
        );

        const unsubscribe = onSnapshot(journalQuery, async (snapshot) => {
          const allNotifications: Notification[] = [];

          for (const docSnapshot of snapshot.docs) {
            const post = docSnapshot.data() as JournalRecord;

            // Process likes
            if (post.likedBy && post.likedBy.length > 0) {
              for (const userId of post.likedBy) {
                allNotifications.push({
                  id: `like-${post.id}-${userId}`,
                  type: 'like',
                  userId,
                  userName: 'User', // Will be updated from user data
                  postId: post.id,
                  postTitle: post.title,
                  createdAt: post.createdAt,
                });
              }
            }

            // Process saves
            if (post.savedBy && post.savedBy.length > 0) {
              for (const userId of post.savedBy) {
                allNotifications.push({
                  id: `save-${post.id}-${userId}`,
                  type: 'save',
                  userId,
                  userName: 'User',
                  postId: post.id,
                  postTitle: post.title,
                  createdAt: post.createdAt,
                });
              }
            }
          }

          // Sort by most recent
          const sorted = allNotifications.sort(
            (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
          );

          if (isActive) {
            setNotifications(sorted);
          }
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    void fetchNotifications();

    return () => {
      isActive = false;
    };
  }, [currentUserId]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const isSearchActive = searchOpen || normalizedSearch.length > 0;
  const filterEntries = (entries: JournalEntry[]) => {
    if (!normalizedSearch) return entries;
    return entries.filter((entry) => {
      const haystack = [entry.title, entry.location, entry.description, entry.author]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  };

  const filteredCommunity = filterEntries(communityPosts);
  const filteredMyJournal = filterEntries(myJournalPosts);
  const filteredFavorites = filterEntries(favorites);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'community', label: t('journal.forYou') },
    { key: 'myJournal', label: t('journal.myJournal') },
    { key: 'favourites', label: t('journal.favourites') },
    { key: 'notifications', label: t('journal.notification') },
  ];

  const activeTabIndex = tabs.findIndex(tab => tab.key === activeTab);

  const toggleLike = (id: string) => {
    if (!currentUserId) {
      toast.error('Please log in to like posts');
      return;
    }

    const target = journals.find((entry) => entry.id === id);
    if (!target) return;

    const optimisticActive = !target.isLiked;
    const optimisticCount = optimisticActive
      ? target.likes + 1
      : Math.max(0, target.likes - 1);

    setJournals((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      return {
        ...entry,
        isLiked: optimisticActive,
        likes: optimisticCount,
      };
    }));

    void toggleJournalReaction(id, currentUserId, 'like').then((result) => {
      if (!result) {
        setJournals((prev) => prev.map((entry) => {
          if (entry.id !== id) return entry;
          return {
            ...entry,
            isLiked: target.isLiked,
            likes: target.likes,
          };
        }));
        toast.error('Failed to update likes');
        return;
      }

      setJournals((prev) => prev.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          isLiked: result.active,
          likes: result.count,
        };
      }));

      if (result.active) {
        onPositiveInteraction?.(id, 'like');
      }
    });
  };

  const toggleSave = (id: string) => {
    if (!currentUserId) {
      toast.error('Please log in to save posts');
      return;
    }

    const target = journals.find((entry) => entry.id === id);
    if (!target) return;

    const optimisticActive = !target.isSaved;
    const optimisticCount = optimisticActive
      ? target.bookmarks + 1
      : Math.max(0, target.bookmarks - 1);

    setJournals((prev) => prev.map((entry) => {
      if (entry.id !== id) return entry;
      return {
        ...entry,
        isSaved: optimisticActive,
        bookmarks: optimisticCount,
      };
    }));

    void toggleJournalReaction(id, currentUserId, 'save').then((result) => {
      if (!result) {
        setJournals((prev) => prev.map((entry) => {
          if (entry.id !== id) return entry;
          return {
            ...entry,
            isSaved: target.isSaved,
            bookmarks: target.bookmarks,
          };
        }));
        toast.error('Failed to update saved count');
        return;
      }

      setJournals((prev) => prev.map((entry) => {
        if (entry.id !== id) return entry;
        return {
          ...entry,
          isSaved: result.active,
          bookmarks: result.count,
        };
      }));

      if (result.active) {
        onPositiveInteraction?.(id, 'save');
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .thin-scroll { scrollbar-width: thin; }
          .thin-scroll::-webkit-scrollbar { width: 6px; }
          .thin-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
          .thin-scroll::-webkit-scrollbar-track { background: transparent; }
        `}</style>

      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute bg-white dark:bg-gray-900 h-[109px] left-0 right-0 top-[-2px]" />

        <div className="absolute left-0 right-0 top-[52px] px-[20px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#eaddff] overflow-clip rounded-[100px] size-[40px] flex items-center justify-center">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
              ) : (
                <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#4f378a]">{userInitial}</span>
              )}
            </div>
            {isSearchActive ? (
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('journal.searchPlaceholder')}
                className="w-[210px] h-[32px] rounded-[10px] border border-[rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-800 dark:text-white px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
            ) : (
              <p className="font-['Inter',sans-serif] font-medium leading-[22px] text-[20px] text-black dark:text-white tracking-[-0.408px]">{t('journal.screenTitle')}</p>
            )}
          </div>
          <button
            onClick={() => {
              if (isSearchActive) {
                setSearchTerm('');
                setSearchOpen(false);
              } else {
                setSearchOpen(true);
              }
            }}
            className="overflow-clip relative shrink-0 size-[24px]"
            aria-label="Search"
          >
            <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <div className="absolute bg-transparent left-0 right-0 top-[107px] h-[48px]">
          <div className="relative w-full h-[40px] flex flex-row">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 h-[40px] flex items-center justify-center bg-[#F7F9FF] dark:bg-gray-800 ${activeTab === tab.key ? 'text-[#094B72] dark:text-blue-400' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}
            >
              <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">{tab.label}</span>
            </button>
          ))}

          <div
            className="absolute bottom-0 h-[3px] w-[56px] bg-[#094B72] dark:bg-blue-600 rounded-tl-[100px] rounded-tr-[100px] transition-all duration-200"
            style={{
              left: `calc(${(activeTabIndex + 0.5) * (100 / tabs.length)}% - 28px)`,
            }}
          />
        </div>
          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] dark:bg-gray-700 mt-[0px]" />
        </div>

        {/* Single bounded scroll container so content cannot go under bottom nav */}
        <div className="absolute left-[20px] top-[169px] right-[20px] bottom-[90px] overflow-y-auto overflow-x-hidden pb-6 no-scrollbar">
        {activeTab === 'community' && (
          <div className="space-y-6">
            {filteredCommunity.map((p) => (
              <JournalCard
                key={p.id}
                author={p.author}
                avatarLetter={userInitial}
                avatarUrl={p.authorAvatarUrl}
                timeAgo={p.timeAgo}
                title={p.title}
                location={p.location}
                description={p.description}
                imageUrl={p.imageUrl}
                imageUrls={p.imageUrls}
                likes={p.likes}
                bookmarks={p.bookmarks}
                views={p.views}
                isLiked={p.isLiked}
                isSaved={p.isSaved}
                actionLabel={t('journal.viewJournal')}
                translationStatus={p.translationStatus}
                translationStatusText={
                  p.translationStatus === 'translated'
                    ? t('journal.translationTranslated')
                    : p.translationStatus === 'translating'
                      ? t('journal.translationTranslating')
                      : p.translationStatus === 'fallback'
                        ? t('journal.translationFallback')
                        : undefined
                }
                onToggleLike={() => toggleLike(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onAuthorClick={() => {
                  if (!p.authorId) return;
                  onOpenUserProfile?.({
                    userId: p.authorId,
                    userName: p.author,
                    userAvatarUrl: p.authorAvatarUrl,
                  });
                }}
                onViewJournal={() => onOpenJournal?.(p)}
              />
            ))}
          </div>
        )}

        {activeTab === 'myJournal' && (
          <div className="space-y-6">
            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black dark:text-white">{t('journal.statistics')}</h3>

            <div>
              <div className="flex gap-4 px-0 overflow-x-hidden justify-center">
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.4)] dark:border-gray-700 rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold dark:text-white">{formatNumber(likes)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)] dark:text-gray-400">{t('journal.likes')}</div>
                </div>
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.4)] dark:border-gray-700 rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold dark:text-white">{formatNumber(totalViews)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)] dark:text-gray-400">{t('journal.views')}</div>
                </div>
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.4)] dark:border-gray-700 rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold dark:text-white">{formatNumber(countries)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)] dark:text-gray-400">{t('journal.countries')}</div>
                </div>
              </div>
            </div>

            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black dark:text-white">{t('journal.post')}</h3>

            <div className="space-y-6">
              {filteredMyJournal.map((p) => (
                <JournalCard
                  key={p.id}
                  author={p.author}
                avatarLetter={userInitial}
                  avatarUrl={p.authorAvatarUrl}
                  timeAgo={p.timeAgo}
                  title={p.title}
                  location={p.location}
                  description={p.description}
                  imageUrl={p.imageUrl}
                  imageUrls={p.imageUrls}
                  likes={p.likes}
                  bookmarks={p.bookmarks}
                  views={p.views}
                  isLiked={p.isLiked}
                  isSaved={p.isSaved}
                  translationStatus={p.translationStatus}
                  translationStatusText={
                    p.translationStatus === 'translated'
                      ? t('journal.translationTranslated')
                      : p.translationStatus === 'translating'
                        ? t('journal.translationTranslating')
                        : p.translationStatus === 'fallback'
                          ? t('journal.translationFallback')
                          : undefined
                  }
                  showViews
                  actionLabel={t('journal.edit')}
                  onToggleLike={() => toggleLike(p.id)}
                  onToggleSave={() => toggleSave(p.id)}
                  onAuthorClick={() => {
                    if (!p.authorId) return;
                    onOpenUserProfile?.({
                      userId: p.authorId,
                      userName: p.author,
                      userAvatarUrl: p.authorAvatarUrl,
                    });
                  }}
                  onViewJournal={() => onEditJournal?.(p)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'favourites' && (
          <div className="space-y-6">
            {filteredFavorites.map((p) => (
              <JournalCard
                key={p.id}
                author={p.author}
                avatarLetter={userInitial}
                avatarUrl={p.authorAvatarUrl}
                timeAgo={p.timeAgo}
                title={p.title}
                location={p.location}
                description={p.description}
                imageUrl={p.imageUrl}
                imageUrls={p.imageUrls}
                likes={p.likes}
                bookmarks={p.bookmarks}
                views={p.views}
                isLiked={p.isLiked}
                isSaved={p.isSaved}
                actionLabel={t('journal.viewJournal')}
                translationStatus={p.translationStatus}
                translationStatusText={
                  p.translationStatus === 'translated'
                    ? t('journal.translationTranslated')
                    : p.translationStatus === 'translating'
                      ? t('journal.translationTranslating')
                      : p.translationStatus === 'fallback'
                        ? t('journal.translationFallback')
                        : undefined
                }
                onToggleLike={() => toggleLike(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onAuthorClick={() => {
                  if (!p.authorId) return;
                  onOpenUserProfile?.({
                    userId: p.authorId,
                    userName: p.author,
                    userAvatarUrl: p.authorAvatarUrl,
                  });
                }}
                onViewJournal={() => onOpenJournal?.(p)}
              />
            ))}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black dark:text-white">{t('journal.noNotifications')}</p>
                <p className="mt-2 font-['Inter',sans-serif] text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{t('journal.notificationsHint')}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.postId) {
                      const post = journals.find((p) => p.id === notif.postId);
                      if (post) {
                        onOpenJournal?.(post);
                      }
                    }
                  }}
                  className="rounded-[12px] border border-[rgba(0,0,0,0.08)] dark:border-gray-700 p-4 bg-[#F7F9FF] dark:bg-gray-800 hover:bg-[#EFF4FF] dark:hover:bg-gray-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-[40px] h-[40px] rounded-full bg-[#CDE5FF] overflow-hidden flex items-center justify-center text-[#2C638B] font-semibold shrink-0">
                      {notif.userAvatarUrl ? (
                        <img src={notif.userAvatarUrl} alt={notif.userName} className="w-full h-full object-cover" />
                      ) : (
                        (notif.userName.charAt(0) || 'U').toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-['Poppins',sans-serif] font-semibold text-[13px] text-black dark:text-white">
                        {notif.type === 'like' && `${notif.userName} ${t('journal.notificationLiked')}`}
                        {notif.type === 'save' && `${notif.userName} ${t('journal.notificationSaved')}`}
                        {notif.type === 'comment' && `${notif.userName} ${t('journal.notificationCommented')}`}
                        {notif.type === 'reply' && `${notif.userName} ${t('journal.notificationReplied')}`}
                      </p>
                      <p className="mt-1 font-['Inter',sans-serif] text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400 truncate">{notif.postTitle}</p>
                      <p className="mt-1 font-['Inter',sans-serif] text-[11px] text-[rgba(0,0,0,0.4)] dark:text-gray-500">{notif.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        </div>

        {activeTab === 'myJournal' && (
          <button
            type="button"
            aria-label="Create journal"
            className="absolute right-[24px] bottom-[110px] size-[56px] rounded-full bg-[#2c638b] text-white shadow-lg flex items-center justify-center text-[28px] leading-none"
            onClick={onCreateJournal}
          >
            +
          </button>
        )}

        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)] dark:bg-gray-700" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate('home')} className="flex-1 flex flex-col items-center">
              <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>{t('navigation.home')}</p>
            </button>

            <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
              <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>{t('navigation.nearby')}</p>
            </button>

            <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
              <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>{t('navigation.aiLens')}</p>
            </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
              <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>{t('navigation.profile')}</p>
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
