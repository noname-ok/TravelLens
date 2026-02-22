import { useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import backIcon from '@/assets/Back.svg';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { changeLanguage, getCurrentLanguageName } from '@/i18n';

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface LanguageScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onBack: () => void;
}

const LANGUAGES = [
  'English',
  'Spanish',
  'French',
  'Chinese (Simplified)',
  'Japanese',
  'Korean',
  'Hindi',
  'Arabic',
  'Bahasa Melayu',
];

export default function LanguageScreen({ currentScreen, onNavigate, onBack }: LanguageScreenProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(getCurrentLanguageName());

  const handleLanguageSelect = (language: string) => {
    setSelected(language);
    changeLanguage(language);
    toast.success(`${t('language.changed')} ${language}`);
  };

  return (
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-[27px] top-[62px] w-[341px] h-[23px] flex items-center justify-between">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="back" className="w-[10.09px] h-[15.63px]" />
          </button>
          <p className="font-['Poppins',sans-serif] font-semibold text-[18px] leading-[18px] tracking-[-0.165px] text-black">{t('language.title')}</p>
          <div className="w-[10.09px] h-[15.63px]" />
        </div>

        <div className="absolute left-0 right-0 top-[96px] bottom-[90px] overflow-y-auto no-scrollbar px-[27px]">
          <div className="mt-4 mb-4 p-3 bg-[#FFF9E6] border border-[#FFD54F] rounded-[10px]">
            <p className="font-['Poppins',sans-serif] text-[12px] text-[#856404] leading-[16px]">
              ℹ️ Demo: Translation currently applies to Profile section only
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {LANGUAGES.map((language) => (
              <button
                key={language}
                onClick={() => handleLanguageSelect(language)}
                className={`flex items-center justify-between border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[16px] text-left ${
                  selected === language ? 'bg-[#F5FAFB]' : 'bg-white'
                }`}
              >
                <span className="font-['Poppins',sans-serif] text-[14px] text-black">{language}</span>
                <div
                  className={`w-[14px] h-[14px] rounded-full border ${
                    selected === language ? 'border-[#2C638B] bg-[#2C638B]' : 'border-[rgba(0,0,0,0.2)] bg-white'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate('home')} className="flex-1 flex flex-col items-center">
                <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
                  {t('navigation.home')}
                </p>
              </button>

              <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
                  {t('navigation.nearby')}
                </p>
              </button>

              <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
                  {t('navigation.aiLens')}
                </p>
              </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
                <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
                  {t('navigation.profile')}
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
