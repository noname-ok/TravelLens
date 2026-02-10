import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import JournalCard from './JournalCard';

// small helper to format numbers like 1200 -> 1.2k
function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(n);
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
  onLogout?: () => void;
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onOpenJournal?: (journal: JournalEntry) => void;
  onCreateJournal?: () => void;
  onEditJournal?: (journal: JournalEntry) => void;
  initialTab?: JournalTab;
  pendingJournal?: JournalEntry | null;
  onConsumePendingJournal?: () => void;
  deletedJournalId?: string | null;
  onConsumeDeletedJournal?: () => void;
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
  author?: string;
  isLiked?: boolean;
  isSaved?: boolean;
}

export type JournalTab = 'community' | 'myJournal' | 'favourites';
type Tab = JournalTab;

export default function JournalScreen({
  userName,
  userEmail,
  currentScreen,
  onNavigate,
  onOpenJournal,
  onCreateJournal,
  onEditJournal,
  initialTab,
  pendingJournal,
  onConsumePendingJournal,
  deletedJournalId,
  onConsumeDeletedJournal,
}: JournalScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('community');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const userInitial = (userName && userName.charAt(0).toUpperCase()) || (userEmail && userEmail.charAt(0).toUpperCase()) || 'U';

  const [communityPosts, setCommunityPosts] = useState<JournalEntry[]>([
    {
      id: 'community-1',
      timeAgo: '2 hours ago',
      title: 'Sunset in the Old City',
      location: 'Kyoto, Japan',
      description: 'Amazing experience exploring the historical sites...',
      views: 1240,
      likes: 1200,
      bookmarks: 234,
      isLiked: false,
      isSaved: false,
    },
    {
      id: 'community-2',
      timeAgo: '1 day ago',
      title: 'Coastal Hike',
      location: 'Bali, Indonesia',
      description: 'A long hike along the coast with beautiful views...',
      views: 845,
      likes: 340,
      bookmarks: 45,
      isLiked: false,
      isSaved: false,
    },
  ]);

  const [myJournalPosts, setMyJournalPosts] = useState<JournalEntry[]>([
    {
      id: 'my-1',
      timeAgo: '2 hours ago',
      title: 'Sunset in the Old City',
      location: 'Kyoto, Japan',
      description: 'Amazing experience exploring the historical sites...',
      views: 620,
      likes: 1200,
      bookmarks: 234,
      isLiked: false,
      isSaved: false,
    },
  ]);

  const favorites = [...communityPosts, ...myJournalPosts].filter((post) => post.isSaved);
  const primaryMyJournal = myJournalPosts[0];
  const likes = primaryMyJournal?.likes ?? 0;
  const bookmarks = primaryMyJournal?.bookmarks ?? 0;
  const totalViews = myJournalPosts.reduce((sum, entry) => sum + (entry.views ?? 0), 0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!pendingJournal) return;
    const upsert = (entries: JournalEntry[]) => {
      const existingIndex = entries.findIndex((entry) => entry.id === pendingJournal.id);
      if (existingIndex === -1) {
        return [pendingJournal, ...entries];
      }
      return entries.map((entry) => (entry.id === pendingJournal.id ? pendingJournal : entry));
    };
    setCommunityPosts((prev) => upsert(prev));
    setMyJournalPosts((prev) => upsert(prev));
    onConsumePendingJournal?.();
  }, [pendingJournal, onConsumePendingJournal]);

  useEffect(() => {
    if (!deletedJournalId) return;
    setCommunityPosts((prev) => prev.filter((entry) => entry.id !== deletedJournalId));
    setMyJournalPosts((prev) => prev.filter((entry) => entry.id !== deletedJournalId));
    onConsumeDeletedJournal?.();
  }, [deletedJournalId, onConsumeDeletedJournal]);

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

  const updateEntry = (
    setEntries: Dispatch<SetStateAction<JournalEntry[]>>,
    id: string,
    updater: (entry: JournalEntry) => JournalEntry
  ) => {
    setEntries((prev) => prev.map((entry) => (entry.id === id ? updater(entry) : entry)));
  };

  const toggleLike = (list: 'community' | 'myJournal', id: string) => {
    const setter = list === 'community' ? setCommunityPosts : setMyJournalPosts;
    updateEntry(setter, id, (entry) => {
      const nextLiked = !entry.isLiked;
      const nextLikes = nextLiked ? entry.likes + 1 : Math.max(0, entry.likes - 1);
      return { ...entry, isLiked: nextLiked, likes: nextLikes };
    });
  };

  const toggleSave = (list: 'community' | 'myJournal', id: string) => {
    const setter = list === 'community' ? setCommunityPosts : setMyJournalPosts;
    updateEntry(setter, id, (entry) => {
      const nextSaved = !entry.isSaved;
      const nextBookmarks = nextSaved ? entry.bookmarks + 1 : Math.max(0, entry.bookmarks - 1);
      return { ...entry, isSaved: nextSaved, bookmarks: nextBookmarks };
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
              <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#4f378a]">{userInitial}</span>
            </div>
            {isSearchActive ? (
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search journals"
                className="w-[210px] h-[32px] rounded-[10px] border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
            ) : (
              <p className="font-['Inter',sans-serif] font-medium leading-[22px] text-[20px] text-black tracking-[-0.408px]">Journal</p>
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
          <button onClick={() => setActiveTab('community')} className={`w-[129.33px] h-[40px] flex items-center justify-center bg-[#F7F9FF] ${activeTab === 'community' ? 'text-[#094B72]' : 'text-[rgba(0,0,0,0.4)]'}`}>
            <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">Community</span>
          </button>

          <button onClick={() => setActiveTab('myJournal')} className={`w-[129.33px] h-[40px] flex items-center justify-center bg-[#F7F9FF] ${activeTab === 'myJournal' ? 'text-[#094B72]' : 'text-[rgba(0,0,0,0.4)]'}`}>
            <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">My Journal</span>
          </button>

          <button onClick={() => setActiveTab('favourites')} className={`w-[129.33px] h-[40px] flex items-center justify-center bg-[#F7F9FF] ${activeTab === 'favourites' ? 'text-[#094B72]' : 'text-[rgba(0,0,0,0.4)]'}`}>
            <span className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">Favourites</span>
          </button>

          <div
            className="absolute left-2 right-2 bottom-0 h-[3px] bg-[#094B72] rounded-tl-[100px] rounded-tr-[100px]"
            style={{ transform: `translateX(${activeTab === 'community' ? '0%' : activeTab === 'myJournal' ? '100%' : '200%'})`, width: 'calc(129.33px)' }}
          />
        </div>
          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] mt-[0px]" />
        </div>

        {/* Single bounded scroll container so content cannot go under bottom nav */}
        <div className="absolute left-[20px] top-[169px] right-[20px] bottom-[90px] overflow-y-auto overflow-x-hidden pr-6 pb-6 no-scrollbar">
        {activeTab === 'community' && (
          <div className="space-y-6">
            {filteredCommunity.map((p) => (
              <JournalCard
                key={p.id}
                author={userName}
                avatarLetter={userInitial}
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
                onToggleLike={() => toggleLike('community', p.id)}
                onToggleSave={() => toggleSave('community', p.id)}
                onViewJournal={() => onOpenJournal?.({ ...p, author: userName })}
              />
            ))}
          </div>
        )}

        {activeTab === 'myJournal' && (
          <div className="space-y-6">
            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black">Journal Statistics</h3>

            <div>
              <div className="flex gap-4 px-0 overflow-x-hidden">
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">{formatNumber(likes)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">Likes</div>
                </div>
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">{formatNumber(totalViews)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">Views</div>
                </div>
                <div className="min-w-[96px] w-[96px] h-[96px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">10</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">Countries</div>
                </div>
              </div>
            </div>

            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black">Post</h3>

            <div className="space-y-6">
              {filteredMyJournal.map((p) => (
                <JournalCard
                  key={p.id}
                  author={userName}
                avatarLetter={userInitial}
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
                  actionLabel="Edit"
                  onToggleLike={() => toggleLike('myJournal', p.id)}
                  onToggleSave={() => toggleSave('myJournal', p.id)}
                  onViewJournal={() => onEditJournal?.({ ...p, author: userName })}
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
                author={userName}
                avatarLetter={userInitial}
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
                onToggleLike={() => toggleLike(p.id.startsWith('my-') ? 'myJournal' : 'community', p.id)}
                onToggleSave={() => toggleSave(p.id.startsWith('my-') ? 'myJournal' : 'community', p.id)}
                onViewJournal={() => onOpenJournal?.({ ...p, author: userName })}
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
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>Home</p>
            </button>

            <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
              <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>Nearby</p>
            </button>

            <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
              <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>AI Lens</p>
            </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
              <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>Profile</p>
            </button>
            </div>
          </div>

          <HomeIndicator className="absolute h-[34px] left-0 right-0 bottom-0" />
        </div>
      </div>
    </div>
  );
}
