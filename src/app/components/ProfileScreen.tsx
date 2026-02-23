import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Home, MapPin, Camera, User } from 'lucide-react';
import privateAccountIcon from '@/assets/PrivateAccount.svg';
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
        <div className="-translate-x-1/2 absolute bg-black dark:bg-white bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
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
  userBio?: string;
  userAvatarUrl?: string;
  privateAccountEnabled?: boolean;
  darkModeEnabled?: boolean;
  onPrivateAccountToggle?: (enabled: boolean) => void;
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
  userBio = '',
  userAvatarUrl,
  privateAccountEnabled = false,
  darkModeEnabled = false,
  onPrivateAccountToggle,
  onDarkModeToggle,
}: ProfileScreenProps) {
  const { t } = useTranslation();
  // State for confirmation dialog
  const [showPrivateDialog, setShowPrivateDialog] = useState(false);

  // Handle Private Account toggle
  const handlePrivateAccountToggle = () => {
    if (privateAccountEnabled) {
      // Turning OFF - show confirmation dialog
      setShowPrivateDialog(true);
    } else {
      // Turning ON - enable immediately with toast
      onPrivateAccountToggle?.(true);
      toast.success('Your account become private now!');
    }
  };

  // Confirm making account public
  const confirmMakePublic = () => {
    onPrivateAccountToggle?.(false);
    toast.success('Your account is now public');
    setShowPrivateDialog(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-[27px] top-[77px] w-[202px] h-[68px] flex items-center gap-[24px]">
          <div className="w-[68px] h-[68px] rounded-full bg-[#CDE5FF] dark:bg-gray-700 overflow-hidden">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="profile" className="w-full h-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col justify-center gap-[4px]">
            <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
              {userName}
            </p>
            {userBio && (
              <p className="font-['Poppins',sans-serif] font-normal text-[11px] leading-[14px] tracking-[-0.165px] text-[rgba(0,0,0,0.45)] dark:text-gray-400">
                {userBio}
              </p>
            )}
          </div>
        </div>

        <div className="absolute left-[27px] top-[167px] w-[341px] h-px bg-[rgba(0,0,0,0.1)]" />

        <div className="absolute left-[27px] top-[197px] w-[342px] bottom-[110px] overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-[40px]">
            <div className="flex flex-col gap-[20px]">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                {t('profile.journalPrivacy')}
              </p>
              <div className="flex flex-col gap-[15px]">
                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[15px] py-[20px] dark:bg-gray-800">
                  <div className="flex items-center gap-[10px]">
                    <img src={privateAccountIcon} alt="private account" className="w-[18px] h-[18px] dark:invert" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[15px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                      {t('profile.privateAccount')}
                    </p>
                  </div>
                  <button
                    onClick={handlePrivateAccountToggle}
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
              </div>
            </div>

            <div className="flex flex-col gap-[20px]">
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                {t('profile.accountSettings')}
              </p>
              <div className="flex flex-col gap-[15px]">
                <button onClick={onEditProfile} className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[15px] py-[20px] w-full hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-[10px]">
                    <User size={18} className="text-black dark:text-white" strokeWidth={2} />
                    <p className="font-['Poppins',sans-serif] font-normal text-[15px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                      {t('profile.editProfile')}
                    </p>
                  </div>
                  <img src={rightArrowIcon} alt="arrow" className="w-[15px] h-[15px] dark:invert" />
                </button>

                <button onClick={onChangeLanguage} className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[15px] py-[20px] w-full hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-[10px]">
                    <img src={languageIcon} alt="language" className="w-[18px] h-[18px] dark:invert" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                      {t('profile.changeLanguage')}
                    </p>
                  </div>
                  <img src={rightArrowIcon} alt="arrow" className="w-[15px] h-[15px] dark:invert" />
                </button>

                <div className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[15px] py-[20px] dark:bg-gray-800">
                  <div className="flex items-center gap-[10px]">
                    <img src={darkModeIcon} alt="dark mode" className="w-[18px] h-[18px] dark:invert" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                      {t('profile.darkMode')}
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
              <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                {t('profile.legal')}
              </p>
              <div className="flex flex-col gap-[15px]">
                <button onClick={onOpenTerms} className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[15px] py-[20px] w-full hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-[10px]">
                    <img src={tncIcon} alt="terms" className="w-[18px] h-[18px] dark:invert" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[15px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                      {t('profile.termsAndConditions')}
                    </p>
                  </div>
                  <img src={openNewTabIcon} alt="open" className="w-[15px] h-[15px] dark:invert" />
                </button>
                <button onClick={onOpenPrivacy} className="flex items-center justify-between border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[15px] py-[20px] w-full hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-[10px]">
                    <img src={privacyIcon} alt="privacy" className="w-[18px] h-[18px] dark:invert" />
                    <p className="font-['Poppins',sans-serif] font-normal text-[14px] leading-[18px] tracking-[-0.165px] text-black dark:text-white">
                      {t('profile.privacyPolicy')}
                    </p>
                  </div>
                  <img src={openNewTabIcon} alt="open" className="w-[15px] h-[15px] dark:invert" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-[10px] items-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full flex flex-col items-center justify-center border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[15px] px-[10px] py-[20px] bg-[#FFDAD6] dark:bg-red-900/30 text-center">
                    <span className="font-['Poppins',sans-serif] font-medium text-[15px] leading-[18px] tracking-[-0.165px] text-black dark:text-red-300 underline">
                      {t('profile.logout')}
                    </span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('profile.logoutConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('profile.logoutConfirmDescription')}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onLogout}>{t('profile.confirmLogout')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <p className="font-['Poppins',sans-serif] font-normal text-[12px] leading-[18px] tracking-[-0.165px] text-[rgba(0,0,0,0.6)] dark:text-gray-400">
                Version 3.0.0
              </p>
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)] dark:bg-gray-700" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate?.('home')} className="flex-1 flex flex-col items-center">
                <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.home')}
                </p>
              </button>

              <button onClick={() => onNavigate?.('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.nearby')}
                </p>
              </button>

              <button onClick={() => onNavigate?.('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.aiLens')}
                </p>
              </button>

              <button onClick={() => onNavigate?.('profile')} className="flex-1 flex flex-col items-center">
                <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.profile')}
                </p>
              </button>
            </div>
          </div>

          <HomeIndicator className="absolute h-[34px] left-0 right-0 bottom-0" />
        </div>
      </div>

      {/* Private Account Confirmation Dialog */}
      <AlertDialog open={showPrivateDialog} onOpenChange={setShowPrivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.makePublicTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('profile.makePublicDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('profile.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMakePublic}>{t('profile.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
