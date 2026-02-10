import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import backIcon from '@/assets/Back.svg';

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
  onSubmit: (entry: { title: string; location: string; description: string; imageUrl?: string }) => void;
  onDelete?: () => void;
  mode?: 'create' | 'edit';
  initialEntry?: { title: string; location: string; description: string; imageUrl?: string };
}

export default function CreateJournalScreen({ onBack, onSubmit, onDelete, mode = 'create', initialEntry }: CreateJournalScreenProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!initialEntry) return;
    setTitle(initialEntry.title || '');
    setLocation(initialEntry.location || '');
    setDescription(initialEntry.description || '');
    setImageUrl(initialEntry.imageUrl);
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
    setImageUrl(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast.error('Please fill in title, location, and description.');
      return;
    }
    onSubmit({
      title: title.trim(),
      location: location.trim(),
      description: description.trim(),
      imageUrl,
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
            {mode === 'edit' ? 'Edit Journal' : 'New Journal'}
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
                  Upload a travel photo
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
              Choose Photo
            </button>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)]">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Sunset in the Old City"
                className="mt-2 w-full h-[44px] rounded-[12px] border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
            </div>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)]">Location</label>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Kyoto, Japan"
                className="mt-2 w-full h-[44px] rounded-[12px] border border-[rgba(0,0,0,0.1)] px-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b]"
              />
            </div>

            <div>
              <label className="text-[12px] font-['Poppins',sans-serif] text-[rgba(0,0,0,0.6)]">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Share what made this trip special..."
                className="mt-2 w-full h-[140px] rounded-[12px] border border-[rgba(0,0,0,0.1)] px-3 py-3 text-[12px] font-['Poppins',sans-serif] outline-none focus:border-[#2c638b] resize-none"
              />
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#2c638b] text-white rounded-[14px] py-[14px] text-[14px] font-['Poppins',sans-serif] font-semibold"
            >
              {mode === 'edit' ? 'Save Changes' : 'Post Journal'}
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="w-full text-[12px] font-['Poppins',sans-serif] text-red-500 underline"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
