import { useEffect, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import commentIcon from '@/assets/comment.svg';
import backIcon from '@/assets/Back.svg';
import shareIcon from '@/assets/Share.svg';
import {
  createJournalComment,
  getJournalCommentLocalizedText,
  getJournalLocalizedContent,
  subscribeToJournalComments,
  toggleJournalCommentLike,
  type JournalCommentRecord,
} from '@/app/services/journalService';

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ''}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface JournalDetailProps {
  onBack: () => void;
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  journalId: string;
  currentUserId: string;
  currentUserName?: string;
  currentUserAvatarUrl?: string;
  userInitial?: string;
  title?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  author?: string;
  timeAgo?: string;
  likes?: number;
  bookmarks?: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export default function JournalDetailScreen({
  onBack,
  currentScreen,
  onNavigate,
  journalId,
  currentUserId,
  currentUserName,
  currentUserAvatarUrl,
  userInitial,
  title = 'Kyoto, Japan',
  location = 'Kyoto, Japan',
  description = "The silence of the Zen gardens in Kyoto is something that can't be captured in a photo alone...",
  imageUrl,
  author = 'Teo Doe',
  timeAgo = '2 hours ago',
  likes = 1200,
  bookmarks = 234,
  isLiked = false,
  isSaved = false,
}: JournalDetailProps) {
  const { i18n, t } = useTranslation();
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarkCount, setBookmarkCount] = useState(bookmarks);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState<JournalCommentRecord[]>([]);
  const [translatedCommentText, setTranslatedCommentText] = useState<Record<string, string>>({});
  const [displayTitle, setDisplayTitle] = useState(title);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [displayDescription, setDisplayDescription] = useState(description);

  useEffect(() => {
    setLiked(isLiked);
    setSaved(isSaved);
    setLikeCount(likes);
    setBookmarkCount(bookmarks);
  }, [isLiked, isSaved, likes, bookmarks]);

  useEffect(() => {
    setDisplayTitle(title);
    setDisplayLocation(location);
    setDisplayDescription(description);
  }, [title, location, description]);

  useEffect(() => {
    const unsubscribe = subscribeToJournalComments(
      journalId,
      (items) => setComments(items),
      () => toast.error('Failed to load comments'),
    );

    return unsubscribe;
  }, [journalId]);

  useEffect(() => {
    const languageCode = i18n.language || 'en';
    if (languageCode === 'en') return;

    let isCancelled = false;

    void getJournalLocalizedContent(journalId, languageCode, {
      title,
      location,
      description,
    }).then((translated) => {
      if (isCancelled) return;
      setDisplayTitle(translated.title);
      setDisplayLocation(translated.location);
      setDisplayDescription(translated.description);
    });

    return () => {
      isCancelled = true;
    };
  }, [journalId, i18n.language, title, location, description]);

  useEffect(() => {
    const languageCode = i18n.language || 'en';
    if (languageCode === 'en') {
      setTranslatedCommentText({});
      return;
    }

    let isCancelled = false;

    void (async () => {
      const nextMap: Record<string, string> = {};
      for (const comment of comments) {
        const translatedText = await getJournalCommentLocalizedText(
          journalId,
          comment.id,
          languageCode,
          comment.text,
        );
        nextMap[comment.id] = translatedText;
      }

      if (!isCancelled) {
        setTranslatedCommentText(nextMap);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [comments, journalId, i18n.language]);

  const formatCommentTime = (date: Date) => {
    const rtf = new Intl.RelativeTimeFormat(i18n.language || 'en', { numeric: 'auto' });
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return rtf.format(0, 'second');
    if (minutes < 60) return rtf.format(-minutes, 'minute');
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return rtf.format(-hours, 'hour');
    const days = Math.floor(hours / 24);
    return rtf.format(-days, 'day');
  };

  const formatLikes = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  const toggleLike = () => {
    setLiked((prev) => {
      const next = !prev;
      setLikeCount((count) => (next ? count + 1 : Math.max(0, count - 1)));
      return next;
    });
  };

  const toggleSave = () => {
    setSaved((prev) => {
      const next = !prev;
      setBookmarkCount((count) => (next ? count + 1 : Math.max(0, count - 1)));
      return next;
    });
  };

  const toggleCommentLike = async (id: string) => {
    const result = await toggleJournalCommentLike(journalId, id, currentUserId);
    if (!result) {
      toast.error('Failed to update comment like');
    }
  };

  const submitComment = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const success = await createJournalComment(journalId, {
      parentId: replyTargetId || undefined,
      authorId: currentUserId,
      author: currentUserName || 'User',
      authorAvatarUrl: currentUserAvatarUrl,
      text: trimmed,
    });

    if (!success) {
      toast.error('Failed to post comment');
      return;
    }

    setReplyText('');
    setReplyTargetId(null);
  };

  const handleShare = async () => {
    const shareTitle = title || 'Travel Journal';
    const shareText = `${shareTitle}\n${location}\n\n${description}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Shared successfully');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`.trim());
        toast.success('Journal details copied to clipboard');
        return;
      }

      toast.error('Share is not supported on this device');
    } catch (error) {
      const isAbort = error && typeof error === 'object' && 'name' in error && (error as { name?: string }).name === 'AbortError';
      if (isAbort) {
        toast('Share cancelled');
        return;
      }

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`.trim());
          toast.success('Share not available, copied to clipboard instead');
          return;
        } catch {
        }
      }

      console.error('Error sharing journal:', error);
      toast.error('Failed to share journal');
    }
  };

  const renderComment = (comment: JournalCommentRecord, level = 0) => {
    const childComments = comments.filter((item) => item.parentId === comment.id);
    const likedByCurrentUser = (comment.likedBy || []).includes(currentUserId);
    return (
      <div key={comment.id} className="flex gap-3" style={{ marginLeft: level * 24 }}>
        <div className="w-[30px] h-[30px] bg-[#CDE5FF] rounded-full flex items-center justify-center">
          {comment.authorAvatarUrl ? (
            <img src={comment.authorAvatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-[18px] h-[18px] bg-[#2C638B] rounded-full" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-['Inter'] font-light text-[10px] leading-[20px] text-black">{comment.author}</p>
          <div className="bg-[#F5FAFB] p-3 rounded-[8px]">
            <p className="font-['Poppins'] font-light text-[9px] leading-[22px] text-justify text-black">{translatedCommentText[comment.id] || comment.text}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCommentLike(comment.id)}
                className={`flex items-center gap-1 ${likedByCurrentUser ? 'text-red-500' : 'text-[#8b8b8b]'}`}
              >
                <img
                  src="https://www.figma.com/api/mcp/asset/5948b008-a6f4-49fc-b5e9-69df2d30ebb7"
                  alt="like"
                  className="w-4 h-4"
                  style={{ filter: likedByCurrentUser ? 'invert(34%) sepia(87%) saturate(4123%) hue-rotate(340deg) brightness(95%) contrast(98%)' : 'none' }}
                />
                <span className={`text-[10px] leading-[22px] tracking-[-0.408px] ${likedByCurrentUser ? 'text-red-500' : 'text-[#8b8b8b]'}`}>
                  {comment.likes}
                </span>
              </button>
              <button
                onClick={() => setReplyTargetId((prev) => (prev === comment.id ? null : comment.id))}
                className="font-['Inter'] font-light text-[10px] leading-[22px] tracking-[-0.408px] text-black"
              >
                Reply
              </button>
            </div>
            <span className="font-['Inter'] font-extralight text-[10px] leading-[22px] tracking-[-0.408px] text-black">{formatCommentTime(comment.createdAt)}</span>
          </div>
          {childComments.length > 0 && (
            <div className="mt-3 space-y-3">
              {childComments.map((child) => renderComment(child, level + 1))}
            </div>
          )}
        </div>
      </div>
    );
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
          <button onClick={handleShare} className="w-[17px] h-[23px] flex items-center justify-center">
            <img src={shareIcon} alt="share" className="w-[17px] h-[23px]" />
          </button>
        </div>

        <div className="absolute left-0 right-0 top-[96px] bottom-[90px] overflow-y-auto overflow-x-hidden pb-6 no-scrollbar">
          <div className="relative w-full h-[360px] bg-[#CDE5FF] overflow-hidden">
            {imageUrl ? (
              <img src={imageUrl} alt="Travel" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[url('Frame 7.png')] bg-cover bg-center mix-blend-luminosity opacity-80" />
            )}
            <div className="absolute bottom-[24px] left-[32px] space-y-1">
              <h1 className="font-['Inter'] font-bold text-[24px] text-white tracking-[-0.408px]">
                {displayTitle}
              </h1>
              <p className="font-['Inter'] font-medium text-[12px] text-white/80">{displayLocation}</p>
            </div>
          </div>

          <div className="flex items-center px-[16px] py-[18px] gap-[12px]">
            <div className="w-10 h-10 bg-[#CDE5FF] rounded-full flex items-center justify-center text-[#2C638B] font-bold">
              {(userInitial || author.charAt(0)).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-['Inter'] font-extrabold text-[14px] text-[#49454F]">{author}</p>
              <p className="font-['Inter'] font-medium text-[10px] text-[#B3B3B3]">{t('journal.verifiedTraveler')}</p>
            </div>
            <p className="font-['Inter'] font-bold text-[11px] text-[#888888]">{timeAgo}</p>
          </div>

          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] mx-6" />

          <div className="px-[26px] py-[20px]">
            <p className="font-['Inter'] font-light text-[12px] leading-[20px] text-justify text-black">
              {displayDescription}
            </p>
          </div>

          <div className="px-6 py-4 flex items-center gap-6">
            <button onClick={toggleLike} className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-[#8b8b8b]'} text-[14px]`}>
              <img
                src="https://www.figma.com/api/mcp/asset/5948b008-a6f4-49fc-b5e9-69df2d30ebb7"
                alt="like"
                className="w-5 h-5"
                style={{ filter: liked ? 'invert(34%) sepia(87%) saturate(4123%) hue-rotate(340deg) brightness(95%) contrast(98%)' : 'none' }}
              />
              <span className={`text-[13px] ${liked ? 'text-red-500' : 'text-[#8b8b8b]'}`}>
                {formatLikes(likeCount)}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <img src={commentIcon} alt="comment" className="w-5 h-5" />
              <span className="text-[#8b8b8b] text-[15px] font-['Poppins'] font-light">{comments.length}</span>
            </div>

            <button onClick={toggleSave} className="flex items-center gap-2 text-[14px]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M6 2h12v18l-6-3-6 3V2z" fill={saved ? '#094B72' : '#8b8b8b'} />
              </svg>
              <span className={`text-[13px] ${saved ? 'text-[#094B72]' : 'text-[#8b8b8b]'}`}>
                {bookmarkCount}
              </span>
            </button>
          </div>

          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] mx-6" />

          <div className="px-[28px] py-6 space-y-4">
            <h3 className="font-['Poppins'] font-semibold text-[16px]">{t('journal.comments')}</h3>

            {comments.filter((comment) => !comment.parentId).map((comment) => renderComment(comment))}

            <div className="mt-4 flex items-center bg-[rgba(217,217,217,0.3)] rounded-full px-4 py-2">
              <input
                type="text"
                placeholder={t('journal.writeComment')}
                className="bg-transparent border-none outline-none text-[10px] flex-1 font-['Poppins'] font-light"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button onClick={submitComment} className="text-[#2C638B] text-[10px] font-semibold ml-2">{t('journal.post')}</button>
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
                  {t('navigation.home')}
                </p>
              </button>

              <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  {t('navigation.nearby')}
                </p>
              </button>

              <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  {t('navigation.aiLens')}
                </p>
              </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
                <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
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
