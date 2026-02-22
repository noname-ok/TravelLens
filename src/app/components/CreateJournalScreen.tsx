import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import backIcon from '@/assets/Back.svg';
import { useTranslation } from 'react-i18next';

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

interface CreateJournalScreenProps {
  onBack: () => void;
  onSubmit: (entry: { title: string; location: string; description: string; imageUrl?: string; imageFile?: File }) => void;
  onDelete?: () => void;
  mode?: 'create' | 'edit';
  initialEntry?: { title: string; location: string; description: string; imageUrl?: string };
}

export default function CreateJournalScreen({ onBack, onSubmit, onDelete, mode = 'create', initialEntry }: CreateJournalScreenProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!initialEntry) return;
    setTitle(initialEntry.title || '');
    setLocation(initialEntry.location || '');
    setDescription(initialEntry.description || '');
    setImageUrl(initialEntry.imageUrl);
    setImageFile(undefined);
  }, [initialEntry]);

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device.');
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
          );

          if (!response.ok) {
            throw new Error('Failed to reverse geocode location');
          }

          const data = await response.json();
          const address = data?.address || {};
          const city = address.city || address.town || address.village || address.state || '';
          const country = address.country || '';
          const formatted = [city, country].filter(Boolean).join(', ');

          setLocation(formatted || data?.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          setLocationSuggestions([]);
          toast.success('Location detected');
        } catch (error) {
          console.error('Error detecting location name:', error);
          toast.error('Failed to detect location name');
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setDetectingLocation(false);
        toast.error('Location permission denied or unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  useEffect(() => {
    const query = location.trim();
    if (query.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    const timeout = window.setTimeout(async () => {
      try {
        setSearchingLocation(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`,
        );

        if (!response.ok) {
          throw new Error('Failed to fetch location suggestions');
        }

        const data: Array<{ display_name?: string }> = await response.json();
        const uniqueSuggestions = Array.from(
          new Set(data.map((item) => item.display_name).filter((item): item is string => Boolean(item))),
        );
        setLocationSuggestions(uniqueSuggestions);
      } catch (error) {
        console.error('Error searching location:', error);
        setLocationSuggestions([]);
      } finally {
        setSearchingLocation(false);
      }
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [location]);

  const handleSubmit = () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast.error(t('journal.fillRequired'));
      return;
    }
    onSubmit({
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      imageUrl,
      imageFile,
    });
  };

  return (
    <div className="bg-white relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <StatusBarIPhone className="absolute h-[47px] left-0 right-0 overflow-clip top-0" />

        <div className="absolute left-0 right-0 top-[52px] px-[20px] flex items-center justify-between">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="Back" className="w-[10.09px] h-[15.63px]" />
          </button>
          <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black">
            {mode === 'edit' ? t('journal.editTitle') : t('journal.newTitle')}
          </p>
          <div className="w-[10.09px] h-[15.63px]" />
        </div>

        <div className="absolute left-[20px] right-[20px] top-[110px] bottom-[20px] overflow-y-auto no-scrollbar">
          <div className="space-y-5 pb-8">
            <div className="bg-[#f5f5f5] rounded-[14px] h-[200px] flex items-center justify-center overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-[12px] text-[rgba(0,0,0,0.5)]">
                  {t('journal.uploadPhotoPlaceholder')}
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white border border-[rgba(0,0,0,0.1)] rounded-[12px] py-[12px] text-[12px] font-['Poppins',sans-serif] text-[#2c638b]"
            >
              {t('journal.choosePhoto')}
            </button>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)]">{t('journal.title')}</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('journal.titlePlaceholder')}
                className="mt-2 w-full h-[44px] rounded-[12px] border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
            </div>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)]">{t('journal.location')}</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={t('journal.locationPlaceholder')}
                list="location-suggestions"
                className="mt-2 w-full h-[44px] rounded-[12px] border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
              <datalist id="location-suggestions">
                {locationSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>
              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={detectingLocation}
                  className="text-[11px] font-['Poppins',sans-serif] text-[#2c638b] underline disabled:opacity-50"
                >
                  {detectingLocation ? t('journal.detectingLocation') : t('journal.useCurrentLocation')}
                </button>
                {searchingLocation && (
                  <span className="text-[11px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.5)]">{t('journal.searching')}</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)]">{t('journal.description')}</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('journal.descriptionPlaceholder')}
                className="mt-2 w-full h-[140px] rounded-[12px] border border-[rgba(0,0,0,0.1)] px-3 py-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b] resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#2c638b] text-white rounded-[14px] py-[14px] text-[14px] font-['Poppins',sans-serif] font-semibold"
            >
              {mode === 'edit' ? t('journal.saveChanges') : t('journal.postJournal')}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full text-[12px] font-['Poppins',sans-serif] text-red-500 underline"
              >
                {t('journal.delete')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
