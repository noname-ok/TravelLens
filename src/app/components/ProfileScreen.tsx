import { Home, MapPin, Camera, User } from 'lucide-react';

const imgNotch = "https://www.figma.com/api/mcp/asset/447966c0-8cc6-4c7f-a13a-64114ed088bb";
const imgRightSide = "https://www.figma.com/api/mcp/asset/1b3fd3c4-c6a2-4bcf-ab21-ccaf3d359bcf";

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

interface ProfileScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate?: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
}

export default function ProfileScreen({ currentScreen, onNavigate }: ProfileScreenProps) {
  return (
    <div className="bg-white relative size-full">
      {/* Status Bar */}
      <StatusBarIPhone className="absolute h-[47px] left-0 overflow-clip top-0 w-[390px] z-10" />

      {/* Header */}
      <div className="absolute left-[24px] top-[52px]">
        <h1 className="font-['Poppins',sans-serif] font-semibold text-[24px] text-black leading-[32px]">
          Profile
        </h1>
      </div>

      {/* Content Area - Placeholder */}
      <div className="absolute left-0 right-0 top-[100px] bottom-[93px] flex items-center justify-center">
        <p className="font-['Poppins',sans-serif] text-[16px] text-gray-400">
          Profile content coming soon...
        </p>
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
              onClick={() => onNavigate?.('home')}
              className="flex-1 flex flex-col items-center"
            >
              <Home 
                size={28}
                className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                Home
              </p>
            </button>

            {/* Nearby */}
            <button
              onClick={() => onNavigate?.('mapview')}
              className="flex-1 flex flex-col items-center"
            >
              <MapPin 
                size={28}
                className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                Nearby
              </p>
            </button>

            {/* AI Lens */}
            <button
              onClick={() => onNavigate?.('ailens')}
              className="flex-1 flex flex-col items-center"
            >
              <Camera 
                size={28}
                className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                AI Lens
              </p>
            </button>

            {/* Profile */}
            <button
              onClick={() => onNavigate?.('profile')}
              className="flex-1 flex flex-col items-center"
            >
              <User 
                size={28}
                className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
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
