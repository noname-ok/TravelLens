import { useEffect, useRef, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { normalizeLanguageCode } from '@/i18n';
import commentIcon from '@/assets/comment.svg';
import backIcon from '@/assets/Back.svg';
import shareIcon from '@/assets/Share.svg';
import {
  createJournalComment,
  deleteJournalComment,
  getJournalCommentLocalizedText,
  getJournalLocalizedContent,
  subscribeToJournalComments,
  toggleJournalCommentLike,
  type JournalCommentRecord,
} from '@/app/services/journalService';
import { generateCommentSummary } from '@/app/services/geminiService';

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
  authorId?: string;
  authorAvatarUrl?: string;
  timeAgo?: string;
  likes?: number;
  bookmarks?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onOpenUserProfile?: (user: { userId: string; userName?: string; userAvatarUrl?: string }) => void;
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
  authorId,
  authorAvatarUrl,
  timeAgo = '2 hours ago',
  likes = 1200,
  bookmarks = 234,
  isLiked = false,
  isSaved = false,
  onOpenUserProfile,
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
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [commentSummary, setCommentSummary] = useState<{
    summary: string;
    sentiment: 'positive' | 'mixed' | 'cautious';
    keyTopics: string[];
    travelerTips: string[];
    basedOnCommentCount: number;
  } | null>(null);
  const replyInputRef = useRef<HTMLInputElement | null>(null);
  const lastSummaryKeyRef = useRef<string>('');

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
    const languageCode = normalizeLanguageCode(i18n.language || 'en');
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
    const languageCode = normalizeLanguageCode(i18n.language || 'en');
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

  const handleDeleteComment = async (id: string) => {
    const confirmed = window.confirm('Delete this comment?');
    if (!confirmed) return;

    const success = await deleteJournalComment(journalId, id, currentUserId);
    if (!success) {
      toast.error('Failed to delete comment');
      return;
    }

    if (replyTargetId === id) {
      setReplyTargetId(null);
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

  const replyTarget = replyTargetId
    ? comments.find((comment) => comment.id === replyTargetId)
    : undefined;

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

  useEffect(() => {
    const summaryKey = JSON.stringify({
      journalId,
      title: displayTitle,
      location: displayLocation,
      description: displayDescription,
      comments: comments.map((entry) => ({ id: entry.id, author: entry.author, text: entry.text })),
    });

    if (summaryKey === lastSummaryKeyRef.current) {
      return;
    }

    lastSummaryKeyRef.current = summaryKey;
    let isCancelled = false;

    setIsSummaryLoading(true);
    setSummaryError(null);

    void generateCommentSummary(
      displayTitle,
      displayLocation,
      displayDescription,
      comments.map((entry) => ({ author: entry.author, text: entry.text })),
    )
      .then((result) => {
        if (isCancelled) return;
        setCommentSummary(result);
      })
      .catch((error) => {
        if (isCancelled) return;
        console.error('Failed to generate AI comment summary:', error);
        setSummaryError(t('journal.aiSummary.error'));
      })
      .finally(() => {
        if (isCancelled) return;
        setIsSummaryLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [journalId, displayTitle, displayLocation, displayDescription, comments, t]);

  const renderComment = (comment: JournalCommentRecord, level = 0) => {
    const childComments = comments.filter((item) => item.parentId === comment.id);
    const likedByCurrentUser = (comment.likedBy || []).includes(currentUserId);
    const isOwnComment = comment.authorId === currentUserId;
    const isDeletedComment = comment.text === 'Comment deleted';
    return (
      <div key={comment.id} className="flex gap-3" style={{ marginLeft: level * 24 }}>
        <div className="w-[30px] h-[30px] bg-[#CDE5FF] rounded-full flex items-center justify-center">
          <button
            type="button"
            className="w-full h-full rounded-full"
            onClick={() => {
              if (!comment.authorId) return;
              onOpenUserProfile?.({
                userId: comment.authorId,
                userName: comment.author,
                userAvatarUrl: comment.authorAvatarUrl,
              });
            }}
          >
            {comment.authorAvatarUrl ? (
              <img src={comment.authorAvatarUrl} alt="avatar" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-[18px] h-[18px] bg-[#2C638B] rounded-full mx-auto" />
            )}
          </button>
        </div>
        <div className="flex-1">
          <button
            type="button"
            onClick={() => {
              if (!comment.authorId) return;
              onOpenUserProfile?.({
                userId: comment.authorId,
                userName: comment.author,
                userAvatarUrl: comment.authorAvatarUrl,
              });
            }}
            className="font-['Inter'] font-light text-[10px] leading-[20px] text-black dark:text-white"
          >
            {comment.author}
          </button>
          <div className="bg-[#F5FAFB] dark:bg-gray-800 p-3 rounded-[8px]">
            <p className="font-['Poppins'] font-light text-[9px] leading-[22px] text-justify text-black dark:text-gray-300">{translatedCommentText[comment.id] || comment.text}</p>          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCommentLike(comment.id)}
                className={`flex items-center gap-1 ${likedByCurrentUser ? 'text-red-500' : 'text-[#8b8b8b] dark:text-gray-400'}`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className={`text-[10px] leading-[22px] tracking-[-0.408px] ${likedByCurrentUser ? 'text-red-500' : 'text-[#8b8b8b] dark:text-gray-400'}`}>
                  {comment.likes}
                </span>
              </button>
              <button
                onClick={() => {
                  if (isDeletedComment) return;
                  setReplyTargetId((prev) => (prev === comment.id ? null : comment.id));
                  setTimeout(() => {
                    replyInputRef.current?.focus();
                    replyInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 0);
                }}
                className="font-['Inter'] font-light text-[10px] leading-[22px] tracking-[-0.408px] text-black dark:text-white"
              >
                {t('journal.replyAction')}
              </button>
              {isOwnComment && !isDeletedComment && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="font-['Inter'] font-light text-[10px] leading-[22px] tracking-[-0.408px] text-red-500"
                >
                  {t('journal.deleteAction')}
                </button>
              )}
            </div>
            <span className="font-['Inter'] font-extralight text-[10px] leading-[22px] tracking-[-0.408px] text-black dark:text-gray-400">{formatCommentTime(comment.createdAt)}</span>
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
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <style>{`
          .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
          .no-scrollbar::-webkit-scrollbar { display: none; }
        `}</style>

      <div className="relative mx-auto w-full max-w-[390px] h-full">
        <div className="absolute left-[27px] top-[62px] w-[341px] h-[23px] flex items-center justify-between">
          <button onClick={onBack} className="w-[10.09px] h-[15.63px] flex items-center justify-center">
            <img src={backIcon} alt="back" className="w-[10.09px] h-[15.63px] dark:invert" />
          </button>
          <button onClick={handleShare} className="w-[17px] h-[23px] flex items-center justify-center">
            <img src={shareIcon} alt="share" className="w-[17px] h-[23px] dark:invert" />
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
            <button
              type="button"
              onClick={() => {
                if (!authorId) return;
                onOpenUserProfile?.({
                  userId: authorId,
                  userName: author,
                  userAvatarUrl: authorAvatarUrl,
                });
              }}
              className="w-10 h-10 bg-[#CDE5FF] rounded-full flex items-center justify-center text-[#2C638B] font-bold overflow-hidden"
            >
              {authorAvatarUrl ? (
                <img src={authorAvatarUrl} alt="author" className="w-full h-full object-cover" />
              ) : (
                (userInitial || author.charAt(0)).toUpperCase()
              )}
            </button>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => {
                  if (!authorId) return;
                  onOpenUserProfile?.({
                    userId: authorId,
                    userName: author,
                    userAvatarUrl: authorAvatarUrl,
                  });
                }}
                className="font-['Inter'] font-extrabold text-[14px] text-[#49454F] dark:text-white"
              >
                {author}
              </button>
              <p className="font-['Inter'] font-medium text-[10px] text-[#B3B3B3] dark:text-gray-400">{t('journal.verifiedTraveler')}</p>
            </div>
            <p className="font-['Inter'] font-bold text-[11px] text-[#888888] dark:text-gray-400">{timeAgo}</p>
          </div>

          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] dark:bg-gray-700 mx-6" />

          <div className="px-[26px] py-[20px]">
            <p className="font-['Inter'] font-light text-[12px] leading-[20px] text-justify text-black dark:text-gray-300">
              {displayDescription}
            </p>
          </div>

          <div className="px-6 py-4 flex items-center gap-6">
            <button onClick={toggleLike} className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-[#8b8b8b]'} text-[14px]`}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
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

          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] dark:bg-gray-700 mx-6" />

          <div className="px-[28px] py-6 space-y-4">
            <h3 className="font-['Poppins'] font-semibold text-[16px] dark:text-white">{t('journal.comments')}</h3>

            <div className="bg-[#F4F9FF] dark:bg-blue-900/20 border border-[#D3E8FF] dark:border-blue-800 rounded-[12px] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-['Poppins'] font-semibold text-[12px] text-[#2C638B] dark:text-blue-300">{t('journal.aiSummary.title')}</p>
                {isSummaryLoading && (
                  <span className="text-[10px] font-semibold text-[#2C638B] dark:text-blue-300">
                    {t('journal.aiSummary.generating')}
                  </span>
                )}
              </div>

              {!commentSummary && !summaryError && (
                <p className="text-[10px] text-[rgba(0,0,0,0.65)] dark:text-gray-300">
                  {t('journal.aiSummary.emptyHint')}
                </p>
              )}

              {summaryError && (
                <p className="text-[10px] text-red-500">{summaryError}</p>
              )}

              {commentSummary && (
                <div className="space-y-2">
                  <p className="text-[11px] text-black dark:text-white leading-[18px]">{commentSummary.summary}</p>
                  <p className="text-[10px] text-[#2C638B] dark:text-blue-300">
                    {t('journal.aiSummary.sentimentLabel')}: <span className="font-semibold capitalize">{t(`journal.aiSummary.sentiment.${commentSummary.sentiment}`)}</span> · {t('journal.aiSummary.basedOnComments', { count: commentSummary.basedOnCommentCount })}
                  </p>
                  {commentSummary.keyTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {commentSummary.keyTopics.map((topic, index) => (
                        <span key={`${topic}-${index}`} className="text-[9px] px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 text-[#2C638B] dark:text-blue-300 border border-[#D3E8FF] dark:border-blue-800">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                  {commentSummary.travelerTips.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-[#2C638B] dark:text-blue-300">{t('journal.aiSummary.travelerShouldKnow')}</p>
                      {commentSummary.travelerTips.slice(0, 3).map((tip, index) => (
                        <p key={`${tip}-${index}`} className="text-[10px] text-black dark:text-white leading-[16px]">
                          • {tip}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {comments.filter((comment) => !comment.parentId).map((comment) => renderComment(comment))}

            {replyTarget && (
              <div className="flex items-center justify-between bg-[#EAF4FF] dark:bg-blue-900/20 rounded-[10px] px-3 py-2">
                <p className="text-[10px] font-['Poppins'] text-[#2C638B] dark:text-blue-300">
                  {t('journal.replyingTo', { name: replyTarget.author })}
                </p>
                <button
                  onClick={() => setReplyTargetId(null)}
                  className="text-[10px] font-semibold text-[#2C638B] dark:text-blue-300"
                >
                  {t('journal.cancelAction')}
                </button>
              </div>
            )}

            <div className="mt-4 flex items-center bg-[rgba(217,217,217,0.3)] dark:bg-gray-800 rounded-full px-4 py-2">
              <input
                ref={replyInputRef}
                type="text"
                placeholder={replyTarget ? t('journal.replyToPlaceholder', { name: replyTarget.author }) : t('journal.writeComment')}
                className="bg-transparent border-none outline-none text-[10px] flex-1 font-['Poppins'] font-light dark:text-white"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button onClick={submitComment} className="text-[#2C638B] dark:text-blue-400 text-[10px] font-semibold ml-2">{t('journal.post')}</button>
            </div>
          </div>
        </div>

        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)] dark:bg-gray-700" />
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
              <button onClick={() => onNavigate('home')} className="flex-1 flex flex-col items-center">
                <Home size={28} className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.home')}
                </p>
              </button>

              <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.nearby')}
                </p>
              </button>

              <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.aiLens')}
                </p>
              </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
                <User size={28} className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}`}>
                  {t('navigation.profile')}
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
