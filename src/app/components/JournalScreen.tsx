import { useState } from 'react';

const imgNotch = "https://www.figma.com/api/mcp/asset/447966c0-8cc6-4c7f-a13a-64114ed088bb";
const imgRightSide = "https://www.figma.com/api/mcp/asset/1b3fd3c4-c6a2-4bcf-ab21-ccaf3d359bcf";
const imgHomePage = "https://www.figma.com/api/mcp/asset/019963c7-7f9c-443a-944d-930d6bfaa970";
const imgMap = "https://www.figma.com/api/mcp/asset/a6fb27a2-9d0e-405a-b437-d8694ba2142b";
const imgCameraIntelligence = "https://www.figma.com/api/mcp/asset/1f1dbed4-7f29-48d5-8ccf-f532f9a0ff41";
const imgProfile = "https://www.figma.com/api/mcp/asset/deb0c6ee-f9c5-43fa-8048-e6fadafb78bb";
const imgMedia = "https://www.figma.com/api/mcp/asset/6e5b9028-e512-464f-8c4c-8da7097d76ff";
const imgLove = "https://www.figma.com/api/mcp/asset/5948b008-a6f4-49fc-b5e9-69df2d30ebb7";
const imgBookmark = "https://www.figma.com/api/mcp/asset/a7d40849-3e0d-479f-8f45-41121762ea9e";

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <div className="h-[47px] relative w-[390px]">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="-translate-x-1/2 absolute contents left-[calc(16.67%-11px)] top-[14px]">
          <div className="-translate-x-1/2 absolute h-[21px] left-[calc(16.67%-11px)] rounded-[24px] top-[14px] w-[54px]">
            <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] not-italic text-[17px] text-black text-center top-px tracking-[-0.408px] w-[54px] whitespace-pre-wrap">
              9:41
            </p>
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
    <div className={className || ""}>
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
}

type Tab = 'video' | 'photos' | 'audio';
type NavTab = 'home' | 'nearby' | 'ailens' | 'profile';

export default function JournalScreen({ userName, userEmail, onLogout }: JournalScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>('video');
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('home');

  // Get user initials
  const userInitial = userName?.charAt(0) || userEmail?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="bg-white relative size-full">
      {/* Status Bar */}
      <StatusBarIPhone className="absolute h-[47px] left-0 overflow-clip top-0 w-[390px]" />

      {/* Top Bar Background */}
      <div className="absolute bg-white h-[109px] left-0 top-[-2px] w-[390px]" />

      {/* Header */}
      <div className="-translate-x-1/2 absolute flex items-center justify-between left-[calc(50%+0.6px)] top-[52px] w-[335.196px]">
        <div className="inline-grid grid-cols-[max-content] grid-rows-[max-content] place-items-start relative">
          <div className="bg-[#eaddff] col-1 ml-0 mt-0 overflow-clip relative rounded-[100px] row-1 size-[40px] flex items-center justify-center">
            <span className="font-['Poppins',sans-serif] font-semibold text-[16px] text-[#4f378a]">
              {userInitial}
            </span>
          </div>
          <p className="col-1 font-['Inter',sans-serif] font-medium h-[24.75px] leading-[22px] ml-[52px] mt-[8px] not-italic relative row-1 text-[20px] text-black text-center tracking-[-0.408px] w-[87.589px]">
            Journal
          </p>
        </div>
        <button className="overflow-clip relative shrink-0 size-[24px]">
          <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="absolute bg-[#fef7ff] flex flex-col h-[48px] items-start left-[2px] top-[107px] w-[360px]">
        <div className="flex flex-1 items-start w-full">
          {/* Video Tab */}
          <button
            onClick={() => setActiveTab('video')}
            className={`flex-1 flex flex-col items-center justify-end h-full relative ${
              activeTab === 'video' ? 'text-[#6750a4]' : 'text-[#49454f]'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-[14px] px-[16px]">
              <p className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">
                Community
              </p>
            </div>
            {activeTab === 'video' && (
              <div className="absolute bottom-0 h-[3px] left-[2px] right-[2px] bg-[#6750a4] rounded-tl-[100px] rounded-tr-[100px]" />
            )}
          </button>

          {/* Photos Tab */}
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 flex flex-col items-center justify-end h-full relative ${
              activeTab === 'photos' ? 'text-[#6750a4]' : 'text-[#49454f]'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-[14px] px-[16px]">
              <p className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">
                My Journal
              </p>
            </div>
            {activeTab === 'photos' && (
              <div className="absolute bottom-0 h-[3px] left-[2px] right-[2px] bg-[#6750a4] rounded-tl-[100px] rounded-tr-[100px]" />
            )}
          </button>

          {/* Audio Tab */}
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 flex flex-col items-center justify-end h-full relative ${
              activeTab === 'audio' ? 'text-[#6750a4]' : 'text-[#49454f]'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-[14px] px-[16px]">
              <p className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] tracking-[0.1px]">
                Favourites
              </p>
            </div>
            {activeTab === 'audio' && (
              <div className="absolute bottom-0 h-[3px] left-[2px] right-[2px] bg-[#6750a4] rounded-tl-[100px] rounded-tr-[100px]" />
            )}
          </button>
        </div>
        <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
      </div>

      {/* Journal Card */}
      <div className="absolute left-[20px] top-[169px]">
        <div className="flex h-[466px] w-[350px] rounded-[12px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] overflow-hidden">
          <div className="flex flex-col flex-1 bg-white border border-[#cac4d0] rounded-[12px] overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between h-[72px] pl-[16px] pr-[4px] py-[12px]">
              <div className="flex gap-[16px] items-center">
                <div className="overflow-clip relative size-[40px] rounded-full bg-[#eaddff] flex items-center justify-center">
                  <span className="font-['Roboto',sans-serif] font-medium text-[16px] text-[#4f378a]">A</span>
                </div>
                <div className="flex flex-col text-[#1d1b20] w-[236px]">
                  <p className="font-['Poppins',sans-serif] font-medium text-[16px] leading-[24px] tracking-[0.15px]">
                    Name
                  </p>
                  <p className="font-['Inter',sans-serif] font-normal text-[14px] leading-[20px] tracking-[0.25px]">
                    16 Jan, 2025
                  </p>
                </div>
              </div>
              <button className="flex items-center justify-center size-[48px]">
                <div className="flex flex-col items-center justify-center rounded-full w-[40px] h-[40px]">
                  <svg className="w-[24px] h-[24px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                  </svg>
                </div>
              </button>
            </div>

            {/* Card Image */}
            <div className="h-[188px] relative w-full bg-[#cde5ff]">
              <img alt="Journal cover" className="max-w-none mix-blend-luminosity object-contain size-full" src={imgMedia} />
            </div>

            {/* Card Content */}
            <div className="flex flex-col gap-[32px] p-[16px]">
              <div className="flex flex-col gap-[5px]">
                <p className="font-['Poppins',sans-serif] font-semibold text-[24px] leading-[24px] text-[#181c20] tracking-[0.5px]">
                  Sunset in the Old City
                </p>
                <p className="font-['Poppins',sans-serif] font-medium text-[14px] leading-[20px] text-[#b3b3b3] tracking-[0.25px] uppercase">
                  Kyoto, Japan
                </p>
              </div>
              <p className="font-['Roboto',sans-serif] font-normal text-[14px] leading-[20px] text-[#49454f] tracking-[0.25px]">
                Description about the journal
              </p>

              {/* Stats and Button */}
              <div className="flex items-center justify-between w-full">
                <div className="flex gap-[5px] items-center">
                  <img src={imgLove} alt="Likes" className="size-[30px]" />
                  <p className="font-['Poppins',sans-serif] font-light text-[15px] leading-[22px] text-black tracking-[-0.408px]">
                    1.2k
                  </p>
                  <img src={imgBookmark} alt="Bookmarks" className="size-[30px]" />
                  <p className="font-['Poppins',sans-serif] font-light text-[15px] leading-[22px] text-black tracking-[-0.408px]">
                    234
                  </p>
                </div>
                <button className="bg-[#6750a4] hover:bg-[#5a4791] active:bg-[#4e3d7e] transition-colors rounded-full px-[16px] py-[10px]">
                  <p className="font-['Roboto',sans-serif] font-medium text-[14px] leading-[20px] text-white tracking-[0.1px]">
                    View Journal
                  </p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="absolute left-[-2px] top-[755px] w-[390px]">
        {/* Divider */}
        <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
        
        {/* Nav Bar */}
        <div className="flex flex-col h-[78px] p-[10px]">
          <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
            {/* Home */}
            <button
              onClick={() => setActiveNavTab('home')}
              className="flex-1 flex flex-col items-center"
            >
              <img src={imgHomePage} alt="Home" className="size-[32px]" />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                activeNavTab === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                Home
              </p>
            </button>

            {/* Nearby */}
            <button
              onClick={() => setActiveNavTab('nearby')}
              className="flex-1 flex flex-col items-center"
            >
              <img src={imgMap} alt="Nearby" className="size-[32px] opacity-70" />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                activeNavTab === 'nearby' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                Nearby
              </p>
            </button>

            {/* AI Lens */}
            <button
              onClick={() => setActiveNavTab('ailens')}
              className="flex-1 flex flex-col items-center"
            >
              <img src={imgCameraIntelligence} alt="AI Lens" className="size-[32px] opacity-70" />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                activeNavTab === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                AI Lens
              </p>
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                setActiveNavTab('profile');
                onLogout?.();
              }}
              className="flex-1 flex flex-col items-center"
            >
              <img src={imgProfile} alt="Profile" className="size-[32px] opacity-70" />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                activeNavTab === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                Profile
              </p>
            </button>
          </div>
        </div>

        {/* Home Indicator */}
        <HomeIndicator className="absolute h-[34px] left-px top-[59.53px] w-[375px]" />
      </div>
    </div>
  );
}
