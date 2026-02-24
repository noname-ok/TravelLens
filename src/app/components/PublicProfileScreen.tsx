import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normalizeLanguageCode } from '@/i18n';
import JournalCard from './JournalCard';
import { getUserProfile, type UserProfile } from '@/app/services/userProfileService';
import {
  getJournalLocalizedContent,
  subscribeToJournals,
  type JournalRecord,
} from '@/app/services/journalService';
import type { JournalEntry } from './JournalScreen';

interface PublicProfileScreenProps {
  viewedUserId: string;
  currentUserId?: string;
  fallbackName?: string;
  fallbackAvatarUrl?: string;
  onBack: () => void;
  onOpenJournal?: (journal: JournalEntry) => void;
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

export default function PublicProfileScreen({
  viewedUserId,
  currentUserId,
  fallbackName,
  fallbackAvatarUrl,
  onBack,
  onOpenJournal,
}: PublicProfileScreenProps) {
  const { t, i18n } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [posts, setPosts] = useState<JournalEntry[]>([]);

  const isOwnProfile = currentUserId === viewedUserId;
  const isPrivateForViewer = Boolean(profile?.preferences.privateAccount) && !isOwnProfile;

  useEffect(() => {
    let isCancelled = false;
    setProfileLoading(true);

    void getUserProfile(viewedUserId)
      .then((result) => {
        if (isCancelled) return;
        setProfile(result);
      })
      .finally(() => {
        if (isCancelled) return;
        setProfileLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [viewedUserId]);

  useEffect(() => {
    let isActive = true;

    const unsubscribe = subscribeToJournals((records: JournalRecord[]) => {
      const currentLanguage = normalizeLanguageCode(i18n.language || 'en');
      const ownRecords = records.filter((record) => record.authorId === viewedUserId);
      const mapped = ownRecords.map((record) => {
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
          authorAvatarUrl: record.authorAvatarUrl,
          translationStatus:
            currentLanguage === 'en'
              ? undefined
              : hasLocalizedContent
                ? (isLocalizedFallback ? 'fallback' : 'translated')
                : 'translating',
        } as JournalEntry;
      });

      if (!isActive) return;
      setPosts(mapped);

      if (currentLanguage === 'en') return;

      const missingTranslations = ownRecords.filter((record) => !record.translations?.[currentLanguage]);
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

          setPosts((prev) =>
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
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [viewedUserId, i18n.language]);

  const displayName = profile?.name || fallbackName || 'User';
  const displayBio = profile?.bio || '';
  const displayAvatar = profile?.avatarUrl || fallbackAvatarUrl;

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-0 right-0 top-0 h-[74px] px-4 flex items-end pb-3 border-b border-[rgba(0,0,0,0.08)] dark:border-gray-700 bg-white dark:bg-gray-900">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center" aria-label="Back">
            <ArrowLeft size={18} className="text-black dark:text-white" />
          </button>
          <p className="ml-2 font-['Poppins'] font-semibold text-[16px] text-black dark:text-white">{t('profile.publicProfileTitle')}</p>
        </div>

        <div className="absolute left-0 right-0 top-[74px] bottom-0 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          <div className="flex items-center gap-3">
            <div className="w-[56px] h-[56px] rounded-full bg-[#CDE5FF] overflow-hidden flex items-center justify-center text-[#2C638B] font-semibold">
              {displayAvatar ? (
                <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                (displayName.charAt(0) || 'U').toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="font-['Poppins'] font-semibold text-[16px] text-black dark:text-white truncate">{displayName}</p>
              {displayBio ? (
                <p className="font-['Inter'] text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400 break-words">{displayBio}</p>
              ) : (
                <p className="font-['Inter'] text-[12px] text-[rgba(0,0,0,0.45)] dark:text-gray-500">{t('profile.publicProfileNoBio')}</p>
              )}
            </div>
          </div>

          {profileLoading && (
            <p className="text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{t('profile.publicProfileLoading')}</p>
          )}

          {!profileLoading && isPrivateForViewer && (
            <div className="rounded-[12px] border border-[rgba(0,0,0,0.1)] dark:border-gray-700 px-4 py-5 bg-[#F7F9FF] dark:bg-gray-800">
              <p className="font-['Poppins'] font-semibold text-[14px] text-black dark:text-white">{t('profile.privateAccountPostsHiddenTitle')}</p>
              <p className="mt-1 font-['Inter'] text-[12px] text-[rgba(0,0,0,0.65)] dark:text-gray-300">
                {t('profile.privateAccountPostsHiddenDescription')}
              </p>
            </div>
          )}

          {!profileLoading && !isPrivateForViewer && (
            <div className="space-y-4">
              <p className="font-['Poppins'] font-semibold text-[15px] text-black dark:text-white">{t('profile.publicProfilePosts')}</p>
              {posts.length === 0 ? (
                <p className="text-[12px] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{t('profile.publicProfileNoPosts')}</p>
              ) : (
                posts.map((post) => (
                  <JournalCard
                    key={post.id}
                    author={post.author}
                    avatarLetter={(displayName.charAt(0) || 'U').toUpperCase()}
                    avatarUrl={post.authorAvatarUrl || displayAvatar}
                    timeAgo={post.timeAgo}
                    title={post.title}
                    location={post.location}
                    description={post.description}
                    imageUrl={post.imageUrl}
                    likes={post.likes}
                    bookmarks={post.bookmarks}
                    views={post.views}
                    actionLabel={t('journal.viewJournal')}
                    translationStatus={post.translationStatus}
                    translationStatusText={
                      post.translationStatus === 'translated'
                        ? t('journal.translationTranslated')
                        : post.translationStatus === 'translating'
                          ? t('journal.translationTranslating')
                          : post.translationStatus === 'fallback'
                            ? t('journal.translationFallback')
                            : undefined
                    }
                    onViewJournal={() => onOpenJournal?.(post)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
