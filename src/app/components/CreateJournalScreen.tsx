import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import backIcon from '@/assets/Back.svg';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface CreateJournalScreenProps {
  onBack: () => void;
  onSubmit: (entry: { title: string; location: string; description: string; imageUrl?: string; imageUrls?: string[]; imageFile?: File; imageFiles?: File[] }) => void;
  onDelete?: () => void;
  mode?: 'create' | 'edit';
  initialEntry?: { title: string; location: string; description: string; imageUrl?: string; imageUrls?: string[] };
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
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!initialEntry) return;
    setTitle(initialEntry.title || '');
    setLocation(initialEntry.location || '');
    setDescription(initialEntry.description || '');
    setImageUrl(initialEntry.imageUrl);
    setImageUrls(initialEntry.imageUrls || []);
    setImageFile(undefined);
    setImageFiles([]);
  }, [initialEntry]);

  useEffect(() => {
    return () => {
      // Cleanup blob URLs
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrl, imageUrls]);

  const handleImagePick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newUrls = newFiles.map(file => URL.createObjectURL(file));

    setImageFiles(prev => [...prev, ...newFiles]);
    setImageUrls(prev => [...prev, ...newUrls]);

    // Reset input value to allow re-selecting the same file
    event.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    const urlToRevoke = imageUrls[index];
    if (urlToRevoke && urlToRevoke.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }

    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
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
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : imageUrl,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      imageFile: imageFiles.length > 0 ? imageFiles[0] : imageFile,
      imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-0 right-0 top-[30px] px-[20px] flex items-center justify-between">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="Back" className="w-[10.09px] h-[15.63px] dark:invert" />
          </button>
          <p className="font-['Poppins',sans-serif] font-semibold text-[18px] text-black dark:text-white">
            {mode === 'edit' ? t('journal.editTitle') : t('journal.newTitle')}
          </p>
          <div className="w-[10.09px] h-[15.63px]" />
        </div>

        <div className="absolute left-[20px] right-[20px] top-[74px] bottom-[20px] overflow-y-auto no-scrollbar">
          <div className="space-y-5 pb-8">
            {/* Image Preview Grid */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {imageUrls.map((url, index) => (
                  <div key={index} className="relative bg-[#f5f5f5] dark:bg-gray-800 rounded-[14px] h-[120px] overflow-hidden">
                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Placeholder when no images */}
            {imageUrls.length === 0 && (
              <div className="bg-[#f5f5f5] dark:bg-gray-800 rounded-[14px] h-[200px] flex items-center justify-center">
                <div className="text-center text-[12px] text-[rgba(0,0,0,0.5)] dark:text-gray-500">
                  {t('journal.uploadPhotoPlaceholder')}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagePick}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-white dark:bg-gray-800 border border-[rgba(0,0,0,0.1)] dark:border-gray-700 rounded-[12px] py-[12px] text-[12px] font-['Poppins',sans-serif] text-[#2c638b] dark:text-blue-400"
            >
              {imageUrls.length > 0 ? t('journal.addMorePhotos') || 'Add More Photos' : t('journal.choosePhoto')}
            </button>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{t('journal.title')}</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t('journal.titlePlaceholder')}
                className="mt-2 w-full h-[44px] rounded-[12px] border border-[rgba(0,0,0,0.1)] dark:border-gray-700 px-3 text-[12px] font-['Poppins',sans-serif] dark:bg-gray-800 dark:text-white outline-none focus:border-[#2c638b]"
              />
            </div>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{t('journal.location')}</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={t('journal.locationPlaceholder')}
                list="location-suggestions"
                className="mt-2 w-full h-[44px] rounded-[12px] border border-[rgba(0,0,0,0.1)] dark:border-gray-700 px-3 text-[12px] font-['Poppins',sans-serif] dark:bg-gray-800 dark:text-white outline-none focus:border-[#2c638b]"
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
                  className="text-[11px] font-['Poppins',sans-serif] text-[#2c638b] dark:text-blue-400 underline disabled:opacity-50"
                >
                  {detectingLocation ? t('journal.detectingLocation') : t('journal.useCurrentLocation')}
                </button>
                {searchingLocation && (
                  <span className="text-[11px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.5)] dark:text-gray-500">{t('journal.searching')}</span>
                )}
              </div>
            </div>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)] dark:text-gray-400">{t('journal.description')}</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t('journal.descriptionPlaceholder')}
                className="mt-2 w-full h-[140px] rounded-[12px] border border-[rgba(0,0,0,0.1)] dark:border-gray-700 px-3 py-3 text-[12px] font-['Poppins',sans-serif] dark:bg-gray-800 dark:text-white outline-none focus:border-[#2c638b] resize-none"
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
