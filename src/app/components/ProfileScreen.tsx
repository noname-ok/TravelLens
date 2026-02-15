import { useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import privateAccountIcon from '@/assets/PrivateAccount.svg';
import gpsIcon from '@/assets/GPS.svg';
import languageIcon from '@/assets/Language.svg';
import darkModeIcon from '@/assets/DarkMode.svg';
import tncIcon from '@/assets/TnC.svg';
import privacyIcon from '@/assets/Privacy.svg';
import openNewTabIcon from '@/assets/OpenNewTab.svg';
import rightArrowIcon from '@/assets/RightArrow.svg';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/app/components/ui/alert-dialog';

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface ProfileScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate?: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onEditProfile?: () => void;
  onChangeLanguage?: () => void;
  onOpenTerms?: () => void;
  onOpenPrivacy?: () => void;
  onLogout?: () => void;
  userName?: string;
  userLocation?: string;
  userAvatarUrl?: string;
  privateAccountEnabled?: boolean;
  gpsEnabled?: boolean;
  darkModeEnabled?: boolean;
  onPrivateAccountToggle?: (enabled: boolean) => void;
  onGpsToggle?: (enabled: boolean) => void;
  onDarkModeToggle?: (enabled: boolean) => void;
}

export default function ProfileScreen({
  currentScreen,
  onNavigate,
  onEditProfile,
  onChangeLanguage,
  onOpenTerms,
  onOpenPrivacy,
  onLogout,
  userName = 'John Doe',
  userLocation = 'Mars, Solar System',
  userAvatarUrl,
  privateAccountEnabled = false,
  gpsEnabled = false,
  darkModeEnabled = false,
  onPrivateAccountToggle,
  onGpsToggle,
  onDarkModeToggle,
}: ProfileScreenProps) {

  return (
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-[27px] top-[77px] w-[202px] h-[68px] flex items-center gap-[24px]">
          <div className="w-[68px] h-[68px] rounded-full bg-[#CDE5FF] overflow-hidden">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-[10px]">
            <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black">
              {userName}
            </p>
            <p className="font-['Poppins',sans-serif] font-normal text-[12px] leading-[18px] tracking-[-0.165px] text-[rgba(0,0,0,0.6)]">
              {userLocation}
            </p>
          </div>
        </div>

        <div className="absolute left-[27px] top-[167px] w-[341px] h-px bg-[rgba(0,0,0,0.1)]" />

        <div className="absolute left-[27px] top-[197px] w-[342px] bottom-[110px] overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-[40px]">
            <div className="flex flex-col gap-[20px]">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black">
                Journal Privacy
              </p>
              <div className="flex flex-col gap-[15px]">
                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <img src={privateAccountIcon} alt="private account" className="w-[18px] h-[18px]" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[15px] leading-[18px] tracking-[-0.165px] text-black">
                      Private Account
                    </p>
                  </div>
                  <button
                    onClick={() => onPrivateAccountToggle?.(!privateAccountEnabled)}
                    className={`w-[65px] h-[25px] rounded-full relative transition-colors ${
                      privateAccountEnabled ? 'bg-[#34C759]' : 'bg-[rgba(60,60,67,0.3)]'
                    }`}
                    aria-pressed={privateAccountEnabled}
                  >
                    <div
                      className={`absolute top-[2px] w-[39px] h-[21px] rounded-full bg-white transition-transform ${
                        privateAccountEnabled ? 'translate-x-[24px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <img src={gpsIcon} alt="gps" className="w-[18px] h-[18px]" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black">
                      Share GPS Data
                    </p>
                  </div>
                  <button
                    onClick={() => onGpsToggle?.(!gpsEnabled)}
                    className={`w-[65px] h-[25px] rounded-full relative transition-colors ${
                      gpsEnabled ? 'bg-[#34C759]' : 'bg-[rgba(60,60,67,0.3)]'
                    }`}
                    aria-pressed={gpsEnabled}
                  >
                    <div
                      className={`absolute top-[2px] w-[39px] h-[21px] rounded-full bg-white transition-transform ${
                        gpsEnabled ? 'translate-x-[24px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[20px]">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black">
                Account Settings
              </p>
              <div className="flex flex-col gap-[15px]">
                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <User size={18} className="text-black" strokeWidth={2} />
                    <p className="font-['Poppins',sans-serif] font-normal text-[15px] leading-[18px] tracking-[-0.165px] text-black">
                      Edit Profile
                    </p>
                  </div>
                  <button onClick={onEditProfile} className="flex items-center justify-center">
                    <img src={rightArrowIcon} alt="arrow" className="w-[15px] h-[15px]" />
                  </button>
                </div>

                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <img src={languageIcon} alt="language" className="w-[18px] h-[18px]" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black">
                      Change Language
                    </p>
                  </div>
                  <button onClick={onChangeLanguage} className="flex items-center justify-center">
                    <img src={rightArrowIcon} alt="arrow" className="w-[15px] h-[15px]" />
                  </button>
                </div>

                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <img src={darkModeIcon} alt="dark mode" className="w-[18px] h-[18px]" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black">
                      Dark Mode
                    </p>
                  </div>
                  <button
                    onClick={() => onDarkModeToggle?.(!darkModeEnabled)}
                    className={`w-[65px] h-[25px] rounded-full relative transition-colors ${
                      darkModeEnabled ? 'bg-[#34C759]' : 'bg-[rgba(60,60,67,0.3)]'
                    }`}
                    aria-pressed={darkModeEnabled}
                  >
                    <div
                      className={`absolute top-[2px] w-[39px] h-[21px] rounded-full bg-white transition-transform ${
                        darkModeEnabled ? 'translate-x-[24px]' : 'translate-x-[2px]'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[20px]">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black">
                Legal
              </p>
              <div className="flex flex-col gap-[15px]">
                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <img src={tncIcon} alt="terms" className="w-[18px] h-[18px]" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[15px] leading-[18px] tracking-[-0.165px] text-black">
                      Terms and Condition
                    </p>
                  </div>
                  <button onClick={onOpenTerms} className="flex items-center justify-center">
                    <img src={openNewTabIcon} alt="open" className="w-[15px] h-[15px]" />
                  </button>
                </div>
                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[20px]">
                  <div className="flex items-center gap-[10px]">
                    <img src={privacyIcon} alt="privacy" className="w-[18px] h-[18px]" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black">
                      Privacy Policy
                    </p>
                  </div>
                  <button onClick={onOpenPrivacy} className="flex items-center justify-center">
                    <img src={openNewTabIcon} alt="open" className="w-[15px] h-[15px]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-[10px] items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex flex-col items-center justify-center border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[10px] py-[20px] bg-[#FFDAD6] text-center">
                    <span className="font-['Poppins',sans-serif] font-medium text-[15px] leading-[18px] tracking-[-0.165px] text-black underline">
                      Logout
                    </span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to log out of your account?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onLogout}>Yes, log out</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="font-['Poppins',sans-serif] font-normal text-[12px] leading-[18px] tracking-[-0.165px] text-[rgba(0,0,0,0.6)]">
                Version 3.0.0
              </p>
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate?.('home')} className="flex-1 flex flex-col items-center">
                <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  Home
                </p>
              </button>

              <button onClick={() => onNavigate?.('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  Nearby
                </p>
              </button>

              <button onClick={() => onNavigate?.('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  AI Lens
                </p>
              </button>

              <button onClick={() => onNavigate?.('profile')} className="flex-1 flex flex-col items-center">
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
