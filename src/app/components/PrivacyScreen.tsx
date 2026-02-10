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

interface PrivacyScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onBack: () => void;
}

export default function PrivacyScreen({ currentScreen, onNavigate, onBack }: PrivacyScreenProps) {
  return (
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

      <div className="relative mx-auto w-full max-w-[390px] h-full">
        {/* Header */}
        <div className="absolute left-[27px] top-[62px] w-[341px] h-[23px] flex items-center justify-between z-10">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="back" className="w-[10.09px] h-[15.63px]" />
          </button>
          <p className="font-['Poppins',sans-serif] font-medium text-[15px] text-black">Privacy Policy</p>
          <div className="w-[10.09px] h-[15.63px]" />
        </div>

        {/* Content Area */}
        <div className="absolute left-0 right-0 top-[96px] bottom-[90px] overflow-y-auto no-scrollbar px-[27px]">
          <div className="mt-4 space-y-6 pb-10">
            {/* Intro */}
            <div className="space-y-2">
              <h2 className="font-['Poppins',sans-serif] font-bold text-[20px] text-[#2c638b]">Secure Journeys</h2>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.6)] text-justify">
                At TravelLens, we believe your travel data belongs to you. This policy outlines our commitment to transparency and the measures we take to keep your digital passport secure.
              </p>
            </div>

            {/* Section 1 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">1. Information We Collect</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)] text-justify">
                We collect your profile details (name, email) and images you upload to the AI Lens. To provide accurate "Nearby" suggestions, we request access to your GPS location. This data is only accessed when the app is in use.
              </p>
            </div>

            {/* Section 2 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">2. AI Processing & Privacy</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)] text-justify">
                When you use the AI Lens to identify landmarks, the image is processed securely. We do not store these images on our permanent servers unless you choose to "Save to Journal."
              </p>
            </div>

            {/* Section 3 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">3. Data Sharing & Community</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)] text-justify">
                We never sell your data to third-party advertisers. Your journals are private by default. If you choose to post to the "Community" feed, only your selected photos and username will be visible to other travelers.
              </p>
            </div>

            {/* Section 4 */}
            <div className="space-y-2">
              <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">4. Your Digital Rights</h3>
              <p className="font-['Poppins',sans-serif] text-[12px] leading-[20px] text-[rgba(0,0,0,0.7)] text-justify">
                You have the right to export your data or delete your account at any time. Upon deletion, all your personal records, journals, and location history will be permanently wiped from our systems.
              </p>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-gray-100">
              <p className="font-['Poppins',sans-serif] text-[10px] text-[rgba(0,0,0,0.4)] italic text-center leading-[16px]">
                TravelLens Compliance Team <br />
                Last Revision: Feb 10, 2026. <br />
                Your trust is our most valued destination.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Nav ... same as your current code ... */}
      </div>
    </div>
  );
}
