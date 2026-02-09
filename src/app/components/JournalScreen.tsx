import { useState } from 'react';
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
      <div className="h-[47px] relative w-[390px]">
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
      <div className="h-[34px] relative w-[375px]">
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
}

type Tab = 'community' | 'myJournal' | 'favourites';

export default function JournalScreen({ userName, userEmail, currentScreen, onNavigate }: JournalScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('community');

  // Lifted state for like/save so JournalScreen controls the icons
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likes, setLikes] = useState(1200);
  const [bookmarks] = useState(234);

  const toggleLike = () => {
    setIsLiked((prev) => {
      const next = !prev;
      setLikes((l) => (next ? l + 1 : Math.max(0, l - 1)));
      return next;
    });
  };

  const toggleSave = () => setIsSaved((prev) => !prev);

  const userInitial = (userName && userName.charAt(0).toUpperCase()) || (userEmail && userEmail.charAt(0).toUpperCase()) || 'U';

  const communityPosts = [
    {
      timeAgo: '2 hours ago',
      title: 'Sunset in the Old City',
      location: 'Kyoto, Japan',
      description: 'Amazing experience exploring the historical sites...',
      likes: 1200,
      bookmarks: 234,
    },
    {
      timeAgo: '1 day ago',
      title: 'Coastal Hike',
      location: 'Bali, Indonesia',
      description: 'A long hike along the coast with beautiful views...',
      likes: 340,
      bookmarks: 45,
    },
  ];

  const favorites = [
    {
      timeAgo: '5 hours ago',
      title: 'Hidden Waterfalls',
      location: 'Southeast Forest',
      description: 'A serene waterfall tucked away from the trail...',
      likes: 420,
      bookmarks: 12,
    },
  ];

  return (
    <div className="bg-white relative w-[390px] h-[1564px]">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .thin-scroll { scrollbar-width: thin; }
          .thin-scroll::-webkit-scrollbar { width: 6px; }
          .thin-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 4px; }
          .thin-scroll::-webkit-scrollbar-track { background: transparent; }
        `}</style>

      <StatusBarIPhone className="absolute h-[47px] left-0 overflow-clip top-0 w-[390px]" />

      <div className="absolute bg-white h-[109px] left-0 top-[-2px] w-[390px]" />

      <div className="-translate-x-1/2 absolute flex items-center justify-between left-[calc(50%+0.6px)] top-[52px] w-[335.196px]">
        <div className="inline-grid grid-cols-[max-content] grid-rows-[max-content] place-items-start relative">
          <div className="bg-[#eaddff] col-1 ml-0 mt-0 overflow-clip relative rounded-[100px] row-1 size-[40px] flex items-center justify-center">
            <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#4f378a]">{userInitial}</span>
          </div>
          <p className="col-1 font-['Inter',sans-serif] font-medium h-[24.75px] leading-[22px] ml-[52px] mt-[8px] not-italic relative row-1 text-[20px] text-black text-center tracking-[-0.408px] w-[87.589px]">Journal</p>
        </div>
        <button className="overflow-clip relative shrink-0 size-[24px]">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
          </svg>
        </button>
      </div>

      <div className="absolute bg-transparent left-[2px] top-[107px] w-[388px] h-[48px]">
        <div className="relative w-[388px] h-[40px] flex flex-row">
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
      <div className="absolute left-[20px] top-[169px] right-[20px] bottom-[90px] overflow-y-auto pr-6 pb-6 thin-scroll">
        {activeTab === 'community' && (
          <div className="space-y-6">
            {communityPosts.map((p, i) => (
              <JournalCard
                key={i}
                author={userName}
                avatarLetter={userInitial}
                timeAgo={p.timeAgo}
                title={p.title}
                location={p.location}
                description={p.description}
                likes={p.likes}
                bookmarks={p.bookmarks}
                isLiked={false}
                isSaved={false}
                onToggleLike={() => {}}
                onToggleSave={() => {}}
              />
            ))}
          </div>
        )}

        {activeTab === 'myJournal' && (
          <div className="space-y-6">
            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black">Journal Statistics</h3>

            <div>
              <div className="flex gap-4 px-0 overflow-x-auto no-scrollbar">
                <div className="min-w-[100px] w-[100px] h-[100px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">{formatNumber(likes)}</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">Likes</div>
                </div>
                <div className="min-w-[100px] w-[100px] h-[100px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">688</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">Followers</div>
                </div>
                <div className="min-w-[100px] w-[100px] h-[100px] bg-white border border-[rgba(0,0,0,0.4)] rounded-[10px] flex flex-col items-center justify-center">
                  <div className="text-[24px] font-['Poppins',sans-serif] font-bold">10</div>
                  <div className="text-[14px] font-['Poppins',sans-serif] font-medium text-[rgba(0,0,0,0.4)]">Countries</div>
                </div>
              </div>
            </div>

            <h3 className="text-[20px] font-['Poppins',sans-serif] font-semibold text-black">Post</h3>

            <div className="space-y-6">
              <JournalCard
                author={userName}
                avatarLetter={userInitial}
                timeAgo="2 hours ago"
                title="Sunset in the Old City"
                location="Kyoto, Japan"
                description="Amazing experience exploring the historical sites..."
                likes={likes}
                bookmarks={bookmarks}
                isLiked={isLiked}
                isSaved={isSaved}
                onToggleLike={toggleLike}
                onToggleSave={toggleSave}
              />
            </div>
          </div>
        )}

        {activeTab === 'favourites' && (
          <div className="space-y-6">
            {favorites.map((p, i) => (
              <JournalCard
                key={i}
                author={userName}
                avatarLetter={userInitial}
                timeAgo={p.timeAgo}
                title={p.title}
                location={p.location}
                description={p.description}
                likes={p.likes}
                bookmarks={p.bookmarks}
                isLiked={false}
                isSaved={true}
                onToggleLike={() => {}}
                onToggleSave={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      <div className="absolute left-0 bottom-0 w-[390px] h-[90px]">
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

        <HomeIndicator className="absolute h-[34px] left-0 bottom-0 w-[390px]" />
      </div>
    </div>
  );
}
