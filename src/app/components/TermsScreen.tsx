import { useRef, useState } from 'react';
import type { UIEvent } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import backIcon from '@/assets/Back.svg';

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface TermsScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onBack: () => void;
}

export default function TermsScreen({ currentScreen, onNavigate, onBack }: TermsScreenProps) {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 20) {
      setHasReadToBottom(true);
    }
  };

  const handleAccept = () => {
    onNavigate('home');
  };

  return (
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

      <div className="relative mx-auto w-full max-w-[390px] h-full">
        {/* Header */}
        <div className="absolute left-[27px] top-[62px] w-[341px] h-[23px] flex items-center justify-between">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="back" className="w-[10.09px] h-[15.63px]" />
          </button>
          <p className="font-['Poppins',sans-serif] font-medium text-[15px] text-black">Terms and Conditions</p>
          <div className="w-[10.09px] h-[15.63px]" />
        </div>

        {/* Content Area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="absolute left-0 right-0 top-[96px] bottom-[90px] overflow-y-auto no-scrollbar px-[27px]"
        >
          <div className="mt-4 space-y-6 pb-20">
            {/* Intro */}
            <div className="space-y-2">
              <h2 className="font-['Poppins',sans-serif] font-bold text-[20px] text-[#2c638b]">Adventure Awaits!</h2>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.6)]">
                By joining TravelLens, you're becoming part of a global community of explorers. Before you start capturing memories, please take a moment to read our ground rules.
              </p>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">1. Exploring Responsibility</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)]">
                TravelLens is designed for positive discovery. You agree to use our AI Lens and Journaling features to share authentic travel experiences. Please respect local laws and private property while hunting for that perfect shot.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">2. Your Photos, Your Rights</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)]">
                You own the content you post! However, by sharing your journals in the "Community" tab, you grant TravelLens a license to display your beautiful captures to other explorers within the app.
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">3. The AI Lens & Accuracy</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)]">
                Our AI works hard to identify landmarks and hidden gems. While we strive for 100% accuracy, sometimes the AI might mistake a local bakery for a historic monument. Use the info as a guide, but always stay curious!
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">4. Community Conduct</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)]">
                Be kind. Any content involving harassment, hate speech, or illegal activities will result in an immediate one-way ticket out of the app (account termination).
              </p>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-gray-100">
              <p className="font-['Poppins',sans-serif] text-[10px] text-[rgba(0,0,0,0.4)] italic text-center">
                Last Updated: February 10, 2026. <br />
                Safe travels and happy journaling!
              </p>
            </div>

            <div className={`transition-all duration-500 flex flex-col items-center gap-4 py-8 ${hasReadToBottom ? 'opacity-100' : 'opacity-20'}`}>
              <div className="w-full h-px bg-gray-100" />
              {hasReadToBottom ? (
                <button
                  onClick={handleAccept}
                  className="w-full bg-[#2c638b] text-white font-['Poppins'] font-semibold py-4 rounded-[15px] shadow-lg active:scale-95 transition-transform"
                >
                  I Accept & Let's Explore
                </button>
              ) : (
                <p className="font-['Poppins'] text-[10px] text-gray-400 italic animate-pulse">
                  Please scroll to the bottom to accept
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate('home')} className="flex-1 flex flex-col items-center">
                <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  Home
                </p>
              </button>

              <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  Nearby
                </p>
              </button>

              <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  AI Lens
                </p>
              </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
                <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  Profile
                </p>
              </button>
            </div>
          </div>

          <HomeIndicator className="absolute h-[34px] left-0 right-0 bottom-0" />
        </div>
      </div>
    </div>
  );
}
