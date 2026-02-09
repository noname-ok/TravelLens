type JournalCardProps = {
  author?: string;
  timeAgo?: string;
  avatarLetter?: string;
  title?: string;
  location?: string;
  description?: string;
  likes?: number;
  bookmarks?: number;
  isLiked?: boolean;
  isSaved?: boolean;
  onToggleLike?: () => void;
  onToggleSave?: () => void;
};

export default function JournalCard({
  author = 'Teo Doe',
  timeAgo = '2 hours ago',
  avatarLetter = 'T',
  title = 'Kyoto Temple',
  location = 'Japan',
  description = 'Amazing experience exploring the historical sites...',
  likes = 1200,
  bookmarks = 234,
  isLiked = false,
  isSaved = false,
  onToggleLike,
  onToggleSave,
}: JournalCardProps) {
  const formatLikes = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  };

  return (
    <div className="w-[350px] bg-white rounded-[12px] border border-[#CAC4D0] shadow-md overflow-hidden mx-auto mb-6">
      {/* Header Area */}
        <div className="flex items-center p-4 gap-4">
        <div className="w-10 h-10 bg-[#DAECFF] rounded-full flex items-center justify-center text-[#2C638B] font-medium">
          {avatarLetter}
        </div>
        <div>
          <h3 className="font-['Poppins'] font-medium text-[16px] text-[#1D1B20]">{author}</h3>
          <p className="font-['Inter'] text-[14px] text-[#49454F]">{timeAgo}</p>
        </div>
      </div>

      {/* Media / Image Area */}
      <div className="w-full h-[188px] bg-[#CDE5FF] flex items-center justify-center">
        {/* Replace with your <img> tag later */}
        <span className="text-blue-400">Travel Photo</span>
      </div>

      {/* Text Content */}
      <div className="p-4 space-y-4">
        <div>
          <h2 className="font-['Poppins'] font-semibold text-[24px] text-[#181C20]">{title}</h2>
          <p className="font-['Poppins'] font-medium text-[14px] text-[#B3B3B3] uppercase">{location}</p>
        </div>
        
        <p className="font-['Roboto'] text-[14px] text-[#49454F]">
          {description}
        </p>

        {/* Interaction Bar */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-4 items-center">
            <button
              onClick={onToggleLike}
              aria-label="like"
              className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-[#8b8b8b]'} text-[13px]`}
            >
                <img src="https://www.figma.com/api/mcp/asset/5948b008-a6f4-49fc-b5e9-69df2d30ebb7" alt="like" className="w-4 h-4" />
                <span className={`text-[#8b8b8b] text-[12px]`}>{formatLikes(likes)}</span>
            </button>

            <button
              onClick={onToggleSave}
              aria-label="save"
              className={`flex items-center gap-2 text-[13px]`}
            >
              {/* inline bookmark SVG so color can be toggled */}
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2h12v18l-6-3-6 3V2z" fill={isSaved ? '#094B72' : '#8b8b8b'} />
              </svg>
              <span className={`text-[#8b8b8b] text-[12px] ${isSaved ? 'text-[#094B72]' : ''}`}>{bookmarks}</span>
            </button>
          </div>
          <button className="bg-[#094B72] text-white px-6 py-2 rounded-full text-sm font-medium">
            Read More
          </button>
        </div>
      </div>
    </div>
  );
}