import { useState } from 'react';
import { CULTURAL_TIPS_DB, DRESS_CODE_DB, PlaceDetails } from '@/app/types/places';

interface PlaceDetailSheetProps {
  place: PlaceDetails | null;
  onClose: () => void;
}

type TabType = 'overview' | 'reviews' | 'cultural' | 'alerts';

export default function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!place) return null;

  // Get cultural tips based on place type
  const getCulturalTips = (): string[] => {
    if (place.types.some(t => t.includes('temple') || t.includes('worship') || t.includes('church'))) {
      return CULTURAL_TIPS_DB.temple;
    }
    if (place.types.some(t => t.includes('restaurant') || t.includes('cafe') || t.includes('food'))) {
      return CULTURAL_TIPS_DB.restaurant;
    }
    if (place.types.some(t => t.includes('museum') || t.includes('art_gallery'))) {
      return CULTURAL_TIPS_DB.museum;
    }
    if (place.types.some(t => t.includes('shopping') || t.includes('store'))) {
      return CULTURAL_TIPS_DB.shopping;
    }
    if (place.types.some(t => t.includes('park'))) {
      return CULTURAL_TIPS_DB.park;
    }
    return ['Respect local customs and traditions', 'Be mindful of cultural sensitivities', 'Ask locals if unsure about etiquette'];
  };

  // Get dress code based on place type
  const getDressCode = (): string[] => {
    if (place.types.some(t => t.includes('temple') || t.includes('worship') || t.includes('church'))) {
      return DRESS_CODE_DB.temple;
    }
    if (place.types.some(t => t.includes('restaurant'))) {
      return DRESS_CODE_DB.restaurant;
    }
    if (place.types.some(t => t.includes('museum') || t.includes('art_gallery'))) {
      return DRESS_CODE_DB.museum;
    }
    if (place.types.some(t => t.includes('shopping') || t.includes('store'))) {
      return DRESS_CODE_DB.shopping;
    }
    if (place.types.some(t => t.includes('park'))) {
      return DRESS_CODE_DB.park;
    }
    return ['👕 No specific dress code', '✅ Dress comfortably and appropriately'];
  };

  const culturalTips = getCulturalTips();
  const dressCode = getDressCode();
  const hasReviews = place.reviews && place.reviews.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-xl z-50 max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-[40px] h-[4px] bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-200">
          {place.photos && place.photos.length > 0 && (
            <img 
              src={place.photos[0].getUrl({ maxWidth: 400, maxHeight: 200 })}
              alt={place.name}
              className="w-full h-[160px] object-cover rounded-lg mb-3 -mx-6 -mt-0 rounded-t-none"
            />
          )}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-black leading-[28px]">
                {place.name}
              </h2>
              {place.rating && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[16px]">⭐</span>
                  <span className="font-['Poppins',sans-serif] text-[14px] text-black">
                    {place.rating.toFixed(1)}
                  </span>
                  {place.userRatingsTotal && (
                    <span className="font-['Poppins',sans-serif] text-[12px] text-gray-500">
                      ({place.userRatingsTotal} reviews)
                    </span>
                  )}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 font-['Poppins',sans-serif] text-[14px] border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-[#2c638b] text-[#2c638b] font-medium'
                : 'border-transparent text-gray-500'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-3 font-['Poppins',sans-serif] text-[14px] border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-[#2c638b] text-[#2c638b] font-medium'
                : 'border-transparent text-gray-500'
            }`}
          >
            Reviews
          </button>
          <button
            onClick={() => setActiveTab('cultural')}
            className={`flex-1 py-3 font-['Poppins',sans-serif] text-[14px] border-b-2 transition-colors ${
              activeTab === 'cultural'
                ? 'border-[#2c638b] text-[#2c638b] font-medium'
                : 'border-transparent text-gray-500'
            }`}
          >
            🧠 Tips
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3 font-['Poppins',sans-serif] text-[14px] border-b-2 transition-colors ${
              activeTab === 'alerts'
                ? 'border-[#2c638b] text-[#2c638b] font-medium'
                : 'border-transparent text-gray-500'
            }`}
          >
            ⚠️ Dress
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[50vh] px-6 py-4">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {place.vicinity && (
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mb-1">Address</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-black">{place.vicinity}</p>
                </div>
              )}
              {place.formattedAddress && place.formattedAddress !== place.vicinity && (
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mb-1">Full Address</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-black">{place.formattedAddress}</p>
                </div>
              )}
              {place.phoneNumber && (
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mb-1">Phone</p>
                  <a href={`tel:${place.phoneNumber}`} className="font-['Poppins',sans-serif] text-[14px] text-[#2c638b] hover:underline">
                    {place.phoneNumber}
                  </a>
                </div>
              )}
              {place.website && (
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mb-1">Website</p>
                  <a 
                    href={place.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-['Poppins',sans-serif] text-[14px] text-[#2c638b] hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
              {place.openingHours && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500">Opening Hours</p>
                    <span className={`text-[12px] font-semibold ${place.openingHours.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                      {place.openingHours.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {place.openingHours.weekdayText?.map((day, idx) => (
                      <p key={idx} className="font-['Poppins',sans-serif] text-[14px] text-black">
                        {day}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {place.priceLevel !== undefined && (
                <div>
                  <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 mb-1">Price Level</p>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-black">
                    {'$'.repeat(place.priceLevel || 1)} {place.priceLevel === 0 ? '(Free)' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {hasReviews ? (
                place.reviews!.map((review, idx) => (
                  <div key={idx} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-2">
                      {review.profilePhoto ? (
                        <img 
                          src={review.profilePhoto} 
                          alt={review.authorName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#2c638b] flex items-center justify-center">
                          <span className="font-['Poppins',sans-serif] text-white text-[12px] font-semibold">
                            {review.authorName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">
                          {review.authorName}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-[12px]">⭐</span>
                          <span className="font-['Poppins',sans-serif] text-[12px] text-gray-600">
                            {review.rating.toFixed(1)}
                          </span>
                          <span className="font-['Poppins',sans-serif] text-[12px] text-gray-400">
                            · {new Date(review.time * 1000).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-gray-700 leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-['Poppins',sans-serif] text-[14px] text-gray-500 text-center py-8">
                  No reviews available yet
                </p>
              )}
            </div>
          )}

          {activeTab === 'cultural' && (
            <div className="space-y-3">
              <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">
                Cultural Tips & Etiquette
              </p>
              {culturalTips.map((tip, idx) => (
                <div key={idx} className="flex gap-3 bg-blue-50 p-3 rounded-lg">
                  <span className="text-[18px] shrink-0">🧠</span>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-black leading-relaxed">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black mb-4">
                Dress Code & Requirements
              </p>
              {dressCode.map((code, idx) => {
                const isWarning = code.startsWith('⚠️');
                const isRequired = code.startsWith('✅');
                const isTip = code.startsWith('💡');
                
                return (
                  <div 
                    key={idx} 
                    className={`flex gap-3 items-start p-3 rounded-lg ${
                      isWarning ? 'bg-red-50 border border-red-200' :
                      isRequired ? 'bg-green-50 border border-green-200' :
                      isTip ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-gray-50'
                    }`}
                  >
                    <p className="font-['Poppins',sans-serif] text-[14px] text-black leading-relaxed flex-1">
                      {code}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
