import { useRef, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import backIcon from '@/assets/Back.svg';
import { auth } from '@/app/config/firebase';
import { toast } from 'sonner';

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface EditProfileScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onBack: () => void;
  onSave: (data: { name: string; bio: string; avatarUrl?: string }) => void;
  initialName?: string;
  initialBio?: string;
  initialAvatarUrl?: string;
}

export default function EditProfileScreen({
  currentScreen,
  onNavigate,
  onBack,
  onSave,
  initialName = 'John Doe',
  initialBio = '',
  initialAvatarUrl,
}: EditProfileScreenProps) {
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setUploading(true);
    const uploadingToast = toast.loading('Processing photo...');

    try {
      // Convert image to base64
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        
        // Save to localStorage
        const storageKey = `avatar_${auth.currentUser?.uid}`;
        localStorage.setItem(storageKey, base64String);
        
        setAvatarUrl(base64String);
        toast.dismiss(uploadingToast);
        toast.success('Photo updated!');
        setUploading(false);
      };

      reader.onerror = () => {
        toast.dismiss(uploadingToast);
        toast.error('Failed to process photo');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing avatar:', error);
      toast.dismiss(uploadingToast);
      toast.error('Failed to process photo');
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return; // Prevent double-clicks
    
    setSaving(true);
    const loadingToast = toast.loading('Saving profile...');
    
    try {
      // Avatar is already uploaded to Firebase Storage
      await onSave({ name, bio, avatarUrl });
      
      toast.dismiss(loadingToast);
      toast.success('Profile saved successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-[27px] top-[62px] w-[341px] h-[23px] flex items-center">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="back" className="w-[10.09px] h-[15.63px]" />
          </button>
        </div>

        <div className="absolute left-0 right-0 top-[96px] bottom-[90px] overflow-y-auto no-scrollbar px-[27px]">
          <div className="flex flex-col items-center gap-4 mt-6">
            <button
              onClick={handlePickAvatar}
              disabled={uploading}
              className="relative w-[96px] h-[96px] rounded-full bg-[#CDE5FF] flex items-center justify-center overflow-visible disabled:opacity-50"
            >
              <div className="absolute inset-0 rounded-full overflow-hidden z-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                ) : null}
              </div>

              <div className="absolute -bottom-1 -right-1 w-[28px] h-[28px] bg-white rounded-full shadow-lg flex items-center justify-center z-20 border border-gray-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="mt-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-['Poppins',sans-serif] text-[12px] text-[rgba(0,0,0,0.6)]">Username</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[14px] font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-['Poppins',sans-serif] text-[12px] text-[rgba(0,0,0,0.6)]">Bio</label>
              <input
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="border border-[rgba(0,0,0,0.1)] rounded-[15px] px-[15px] py-[14px] font-['Poppins',sans-serif] text-[14px]"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#0fa3e2] text-white rounded-[15px] py-[14px] font-['Poppins',sans-serif] text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
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
                  Home
                </p>
              </button>

              <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
                  Nearby
                </p>
              </button>

              <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
                  AI Lens
                </p>
              </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
                <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                  currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
                }`}>
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
