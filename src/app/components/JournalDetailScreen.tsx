import React, { useEffect, useState } from 'react';
import { Home, MapPin, Camera, User } from 'lucide-react';
import commentIcon from '@/assets/comment.svg';
import backIcon from '@/assets/Back.svg';
import shareIcon from '@/assets/Share.svg';

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
  const [liked, setLiked] = useState(isLiked);
  const [saved, setSaved] = useState(isSaved);
  const [likeCount, setLikeCount] = useState(likes);
  const [bookmarkCount, setBookmarkCount] = useState(bookmarks);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [comments, setComments] = useState([
    {
      id: 'comment-1',
      author: 'User',
      text: "Beautifully written! Kyoto's energy is truly unmatched. Did you visit the Fushimi Inari shrine as well?",
      likeCount: 12,
      liked: false,
      timeAgo: '2h',
      parentId: null as string | null,
    },
  ]);

  useEffect(() => {
    setLiked(isLiked);
    setSaved(isSaved);
    setLikeCount(likes);
    setBookmarkCount(bookmarks);
  }, [isLiked, isSaved, likes, bookmarks]);

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

  const toggleCommentLike = (id: string) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id !== id) return comment;
        const nextLiked = !comment.liked;
        const nextCount = nextLiked ? comment.likeCount + 1 : Math.max(0, comment.likeCount - 1);
        return { ...comment, liked: nextLiked, likeCount: nextCount };
      })
    );
  };

  const submitComment = () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    const newComment = {
      id: `comment-${Date.now()}`,
      author: 'User',
      text: trimmed,
      likeCount: 0,
      liked: false,
      timeAgo: 'now',
      parentId: replyTargetId,
    };
    setComments((prev) => [...prev, newComment]);
    setReplyText('');
    setReplyTargetId(null);
  };

  const renderComment = (comment: { id: string; author: string; text: string; likeCount: number; liked: boolean; timeAgo: string; parentId: string | null }, level = 0) => {
    const childComments = comments.filter((item) => item.parentId === comment.id);
    return (
      <div key={comment.id} className="flex gap-3" style={{ marginLeft: level * 24 }}>
        <div className="w-[30px] h-[30px] bg-[#CDE5FF] rounded-full flex items-center justify-center">
          <div className="w-[18px] h-[18px] bg-[#2C638B] rounded-full" />
        </div>
        <div className="flex-1">
          <p className="font-['Inter'] font-light text-[10px] leading-[20px] text-black">{comment.author}</p>
          <div className="bg-[#F5FAFB] p-3 rounded-[8px]">
            <p className="font-['Poppins'] font-light text-[9px] leading-[22px] text-justify text-black">{comment.text}</p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleCommentLike(comment.id)}
                className={`flex items-center gap-1 ${comment.liked ? 'text-red-500' : 'text-[#8b8b8b]'}`}
              >
                <img
                  src="https://www.figma.com/api/mcp/asset/5948b008-a6f4-49fc-b5e9-69df2d30ebb7"
                  alt="like"
                  className="w-4 h-4"
                  style={{ filter: comment.liked ? 'invert(34%) sepia(87%) saturate(4123%) hue-rotate(340deg) brightness(95%) contrast(98%)' : 'none' }}
                />
                <span className={`text-[10px] leading-[22px] tracking-[-0.408px] ${comment.liked ? 'text-red-500' : 'text-[#8b8b8b]'}`}>
                  {comment.likeCount}
                </span>
              </button>
              <button
                onClick={() => setReplyTargetId((prev) => (prev === comment.id ? null : comment.id))}
                className="font-['Inter'] font-light text-[10px] leading-[22px] tracking-[-0.408px] text-black"
              >
                Reply
              </button>
            </div>
            <span className="font-['Inter'] font-extralight text-[10px] leading-[22px] tracking-[-0.408px] text-black">{comment.timeAgo}</span>
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
          <button className="w-[17px] h-[23px] flex items-center justify-center">
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
            <h1 className="absolute bottom-[28px] left-[32px] font-['Inter'] font-bold text-[24px] text-white tracking-[-0.408px]">
              {title}
            </h1>
          </div>

          <div className="flex items-center px-[16px] py-[18px] gap-[12px]">
            <div className="w-10 h-10 bg-[#CDE5FF] rounded-full flex items-center justify-center text-[#2C638B] font-bold">
              {author.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-['Inter'] font-extrabold text-[14px] text-[#49454F]">{author}</p>
              <p className="font-['Inter'] font-medium text-[10px] text-[#B3B3B3]">Verified Traveler</p>
            </div>
            <p className="font-['Inter'] font-bold text-[11px] text-[#888888]">{timeAgo}</p>
          </div>

          <div className="h-px w-full bg-[rgba(0,0,0,0.05)] mx-6" />

          <div className="px-[26px] py-[20px]">
            <p className="font-['Inter'] font-light text-[12px] leading-[20px] text-justify text-black">
              {description}
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
              <span className="text-[#8b8b8b] text-[15px] font-['Poppins'] font-light">234</span>
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
            <h3 className="font-['Poppins'] font-semibold text-[16px]">Comments</h3>

            {comments.filter((comment) => comment.parentId === null).map((comment) => renderComment(comment))}

            <div className="mt-4 flex items-center bg-[rgba(217,217,217,0.3)] rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Write your comment here..."
                className="bg-transparent border-none outline-none text-[10px] flex-1 font-['Poppins'] font-light"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <button onClick={submitComment} className="text-[#2C638B] text-[10px] font-semibold ml-2">Post</button>
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
                  Home
                </p>
              </button>

              <button onClick={() => onNavigate('mapview')} className="flex-1 flex flex-col items-center">
                <MapPin size={28} className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  Nearby
                </p>
              </button>

              <button onClick={() => onNavigate('ailens')} className="flex-1 flex flex-col items-center">
                <Camera size={28} className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'} strokeWidth={2} />
                <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}`}>
                  AI Lens
                </p>
              </button>

              <button onClick={() => onNavigate('profile')} className="flex-1 flex flex-col items-center">
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
