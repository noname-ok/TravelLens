import { memo, useState } from 'react';
import { Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type JournalCardProps = {
  author?: string;
  timeAgo?: string;
  avatarLetter?: string;
  avatarUrl?: string;
  title?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  imageUrls?: string[]; // Support multiple images
  likes?: number;
  bookmarks?: number;
  views?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  showViews?: boolean;
  actionLabel?: string;
  translationStatus?: 'translating' | 'translated' | 'fallback';
  translationStatusText?: string;
  onToggleLike?: () => void;
  onToggleSave?: () => void;
  onViewJournal?: () => void;
  onTranslate?: () => void;
  onAuthorClick?: () => void;
};

function JournalCard({
  author = 'Teo Doe',
  timeAgo = '2 hours ago',
  avatarLetter = 'T',
  avatarUrl,
  title = 'Kyoto Temple',
  location = 'Japan',
  description = 'Amazing experience exploring the historical sites...',
  imageUrl,
  imageUrls,
  likes = 1200,
  bookmarks = 234,
  views = 0,
  isLiked = false,
  isSaved = false,
  showViews = false,
  actionLabel,
  translationStatus,
  translationStatusText,
  onToggleLike,
  onToggleSave,
  onViewJournal,
  onTranslate,
  onAuthorClick,
}: JournalCardProps) {
  const { t } = useTranslation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const resolvedActionLabel = actionLabel || t('journal.viewJournal');

  // Use imageUrls if available, otherwise fall back to single imageUrl
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : imageUrl ? [imageUrl] : [];
  const hasMultipleImages = images.length > 1;

  const formatLikes = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-[12px] border border-[#CAC4D0] dark:border-gray-700 shadow-md overflow-hidden mb-6">
      {/* Header Area */}
        <div className="flex items-center p-4 gap-4">
        <button
          type="button"
          onClick={onAuthorClick}
          disabled={!onAuthorClick}
          className="w-10 h-10 bg-[#DAECFF] dark:bg-[#1f2a36] rounded-full flex items-center justify-center text-[#2C638B] dark:text-[#a6d3ff] font-medium disabled:cursor-default"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="author" loading="lazy" decoding="async" className="w-full h-full rounded-full object-cover" />
          ) : (
            avatarLetter
          )}
        </button>
        <button
          type="button"
          onClick={onAuthorClick}
          disabled={!onAuthorClick}
          className="text-left disabled:cursor-default"
        >
          <h3 className="font-['Poppins'] font-medium text-[16px] text-[#1D1B20] dark:text-white">{author}</h3>
          <p className="font-['Inter'] text-[14px] text-[#49454F] dark:text-gray-400">{timeAgo}</p>
        </button>
      </div>

      {/* Media / Image Area */}
      <div className="w-full h-[188px] bg-[#CDE5FF] dark:bg-[#1e2936] flex items-center justify-center overflow-hidden relative group">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImageIndex]} 
              alt="Travel" 
              loading="lazy" 
              decoding="async" 
              className="w-full h-full object-cover" 
            />
            
            {/* Navigation Arrows - only show if multiple images */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            {/* Dots Indicator - only show if multiple images */}
            {hasMultipleImages && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-white w-4'
                        : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-blue-400">Travel Photo</span>
        )}
      </div>

      {/* Text Content */}
      <div className="p-4 space-y-4">
        <div>
          <h2 className="font-['Poppins'] font-semibold text-[24px] text-[#181C20] dark:text-white">{title}</h2>
          <p className="font-['Poppins'] font-medium text-[14px] text-[#B3B3B3] dark:text-gray-400 uppercase">{location}</p>
          {translationStatusText && (
            <button
              type="button"
              onClick={onTranslate}
              disabled={!onTranslate}
              className={`font-['Inter'] text-[11px] mt-1 ${
                translationStatus === 'translated'
                  ? 'text-[#2C638B] dark:text-[#9bd1ff]'
                  : translationStatus === 'translating'
                    ? 'text-[#8b8b8b] dark:text-gray-400'
                    : 'text-amber-600 dark:text-amber-400'
              } ${onTranslate ? 'underline underline-offset-2 cursor-pointer' : ''}`}
            >
              {translationStatusText}
            </button>
          )}
        </div>
        
        <p className="font-['Roboto'] text-[14px] text-[#49454F] dark:text-gray-300">
          {description}
        </p>

        {/* Interaction Bar */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-4 items-center">
            <button
              onClick={onToggleLike}
              aria-label="like"
              className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-[#8b8b8b] dark:text-gray-400'} text-[14px] transition-colors duration-200 active:scale-95`}
            >
              <svg className="w-5 h-5 transition-colors duration-200" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
              <span className={`text-[13px] transition-colors duration-200 ${isLiked ? 'text-red-500' : 'text-[#8b8b8b] dark:text-gray-400'}`}>{formatLikes(likes)}</span>
            </button>

            <button
              onClick={onToggleSave}
              aria-label="save"
              className="flex items-center gap-2 text-[14px]"
            >
              {/* inline bookmark SVG so color can be toggled */}
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2h12v18l-6-3-6 3V2z" fill={isSaved ? '#094B72' : '#8b8b8b'} className={isSaved ? '' : 'dark:fill-gray-400'} />
              </svg>
              <span className={`text-[13px] ${isSaved ? 'text-[#094B72] dark:text-[#9bd1ff]' : 'text-[#8b8b8b] dark:text-gray-400'}`}>{bookmarks}</span>
            </button>
            {showViews && (
              <div className="flex items-center gap-2 text-[14px] text-[#8b8b8b] dark:text-gray-400">
                <Eye size={18} className="text-[#8b8b8b] dark:text-gray-400" />
                <span className="text-[13px]">{views}</span>
              </div>
            )}
          </div>
          <button
            onClick={onViewJournal}
            className="bg-[#094B72] dark:bg-[#2c638b] text-white px-6 py-2 rounded-full text-sm font-medium"
          >
            {resolvedActionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(JournalCard);