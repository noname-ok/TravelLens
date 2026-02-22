import { useEffect, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import JournalCard from './JournalCard';
import {
  getJournalLocalizedContent,
  subscribeToJournals,
  toggleJournalReaction,
  type JournalRecord,
} from '@/app/services/journalService';

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

const imgNotch = 'https://www.figma.com/api/mcp/asset/447966c0-8cc6-4c7f-a13a-64114ed088bb';
const imgRightSide = 'https://www.figma.com/api/mcp/asset/1b3fd3c4-c6a2-4bcf-ab21-ccaf3d359bcf';

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[47px] relative w-full">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="-translate-x-1/2 absolute contents left-[calc(16.67%-11px)] top-[14px]">
          <div className="-translate-x-1/2 absolute h-[21px] left-[calc(16.67%-11px)] rounded-[24px] top-[14px] w-[54px]">
            <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] not-italic text-[17px] text-black text-center top-px tracking-[-0.408px] w-[54px] whitespace-pre-wrap">9:41</p>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[13px] left-[calc(83.33%-0.3px)] top-[19px] w-[77.401px]">
          <img alt="" className="block max-w-none size-full" src={imgRightSide} />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
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
}

export type JournalTab = 'community' | 'myJournal' | 'favourites' | 'forYou';
type Tab = JournalTab;

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
  userInterestVector,
  onPositiveInteraction,
  initialTab,
}: JournalScreenProps) {
  const { i18n, t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const communityPosts = journals;
  const myJournalPosts = journals.filter((post) => post.authorId === currentUserId);
  const favorites = journals.filter((post) => post.isSaved);
  const forYouPosts = (() => {
    const base = journals.filter((post) => post.authorId !== currentUserId);
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
        const currentLanguage = i18n.language || 'en';
        const mapped: JournalEntry[] = records.map((record) => {
          const translated = record.translations?.[currentLanguage];
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
            isLiked: currentUserId ? (record.likedBy || []).includes(currentUserId) : false,
            isSaved: currentUserId ? (record.savedBy || []).includes(currentUserId) : false,
          };
        });
        if (!isActive) return;
        setJournals(mapped);

        if (currentLanguage === 'en') return;

        const missingTranslations = records.filter((record) => !record.translations?.[currentLanguage]);
        if (missingTranslations.length === 0) return;

        void (async () => {
          for (const record of missingTranslations) {
            const localized = await getJournalLocalizedContent(record.id, currentLanguage, {
              title: record.title,
              location: record.location,
              description: record.description,
              country: record.country,
            });

            if (!isActive) return;

            setJournals((prev) =>
              prev.map((entry) => {
                if (entry.id !== record.id) return entry;
                return {
                  ...entry,
                  title: localized.title,
                  location: localized.location,
                  description: localized.description,
                  country: localized.country || entry.country,
                  timeAgo: formatTimeAgo(record.createdAt, currentLanguage),
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
  }, [i18n.language, currentUserId]);

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
  const filteredForYou = filterEntries(forYouPosts);

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'community', label: t('journal.community') },
    { key: 'myJournal', label: t('journal.myJournal') },
    { key: 'favourites', label: t('journal.favourites') },
    { key: 'forYou', label: t('journal.forYou') },
  ];
  const activeTabIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeTab));

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
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .thin-scroll { scrollbar-width: thin; }
          .thin-scroll::-webkit-scrollbar { width: 6px; }
          .thin-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
          .thin-scroll::-webkit-scrollbar-track { background: transparent; }
        `}</style>

      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <StatusBarIPhone className="absolute h-[47px] left-0 right-0 overflow-clip top-0" />

        <div className="absolute bg-white h-[109px] left-0 right-0 top-[-2px]" />

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
                className="w-[210px] h-[32px] rounded-[10px] border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
            ) : (
              <p className="font-['Inter',sans-serif] font-medium leading-[22px] text-[20px] text-black tracking-[-0.408px]">{t('journal.screenTitle')}</p>
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
              className={`flex-1 h-[40px] flex items-center justify-center bg-[#F7F9FF] ${activeTab === tab.key ? 'text-[#094B72]' : 'text-[rgba(0,0,0,0.4)]'}`}
            >
              <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">{tab.label}</span>
            </button>
          ))}

          <div
            className="absolute bottom-0 h-[3px] w-[56px] bg-[#094B72] rounded-tl-[100px] rounded-tr-[100px]"
            style={{
              left: `calc((100% / ${tabs.length} - 56px) / 2)`,
              transform: `translateX(calc(${activeTabIndex} * (100% / ${tabs.length})))`,
            }}
          />
        </div>
          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] mt-[0px]" />
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
                likes={p.likes}
                bookmarks={p.bookmarks}
                views={p.views}
                isLiked={p.isLiked}
                isSaved={p.isSaved}
                onToggleLike={() => toggleLike(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onViewJournal={() => onOpenJournal?.(p)}
              />
            ))}
          </div>
        )}

        {activeTab === 'myJournal' && (
          <div className="space-y-6">
            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black">{t('journal.statistics')}</h3>

            <div>
              <div className="flex gap-4 px-0 overflow-x-hidden justify-center">
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">{formatNumber(likes)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">{t('journal.likes')}</div>
                </div>
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">{formatNumber(totalViews)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">{t('journal.views')}</div>
                </div>
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">{formatNumber(countries)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">{t('journal.countries')}</div>
                </div>
              </div>
            </div>

            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black">{t('journal.post')}</h3>

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
                  likes={p.likes}
                  bookmarks={p.bookmarks}
                  views={p.views}
                  isLiked={p.isLiked}
                  isSaved={p.isSaved}
                  showViews
                  actionLabel={t('journal.edit')}
                  onToggleLike={() => toggleLike(p.id)}
                  onToggleSave={() => toggleSave(p.id)}
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
                likes={p.likes}
                bookmarks={p.bookmarks}
                views={p.views}
                isLiked={p.isLiked}
                isSaved={p.isSaved}
                onToggleLike={() => toggleLike(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onViewJournal={() => onOpenJournal?.(p)}
              />
            ))}
          </div>
        )}

        {activeTab === 'forYou' && (
          <div className="space-y-6">
            {filteredForYou.map((p) => (
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
                likes={p.likes}
                bookmarks={p.bookmarks}
                views={p.views}
                isLiked={p.isLiked}
                isSaved={p.isSaved}
                onToggleLike={() => toggleLike(p.id)}
                onToggleSave={() => toggleSave(p.id)}
                onViewJournal={() => onOpenJournal?.(p)}
              />
            ))}
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
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate('home')} className="flex-1 flex flex-col items-center">
              <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>{t('navigation.home')}</p>
            </button>

            <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
              <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>{t('navigation.nearby')}</p>
            </button>

            <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
              <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>{t('navigation.aiLens')}</p>
            </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
              <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>{t('navigation.profile')}</p>
            </button>
            </div>
          </div>

          <HomeIndicator className="absolute h-[34px] left-0 right-0 bottom-0" />
        </div>
      </div>
    </div>
  );
}
