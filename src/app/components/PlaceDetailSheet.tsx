import { useState } from 'react';
import { PlaceDetails, PlaceInsights } from '@/app/types/places';
import { generatePlaceInsights } from '@/app/services/geminiService';

interface PlaceDetailSheetProps {
  place: PlaceDetails | null;
  onClose: () => void;
}

type TabType = 'overview' | 'reviews' | 'aiinsights';

export default function PlaceDetailSheet({ place, onClose }: PlaceDetailSheetProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [aiInsights, setAiInsights] = useState<PlaceInsights | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  if (!place) return null;

  const hasReviews = place.reviews && place.reviews.length > 0;

  // Load AI insights when tab is clicked (lazy loading)
  const handleAIInsightsTab = async () => {
    setActiveTab('aiinsights');
    
    // Only fetch if not already loaded
    if (!aiInsights && !loadingAI && !aiError) {
      setLoadingAI(true);
      setAiError(null);
      
      try {
        const insights = await generatePlaceInsights(
          place.name,
          place.types,
          place.formattedAddress || place.vicinity,
          place.rating
        );
        setAiInsights(insights);
      } catch (error: any) {
        console.error('Failed to load AI insights:', error);
        setAiError(error.message || 'Failed to generate AI insights. Please try again later.');
      } finally {
        setLoadingAI(false);
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] shadow-xl z-50 max-h-[85vh] overflow-hidden animate-slide-up flex flex-col">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
          <div className="w-[40px] h-[4px] bg-gray-300 rounded-full" />
        </div>

        {/* Image */}
        {place.photos && place.photos.length > 0 && (
          <img 
            src={place.photos[0].getUrl({ maxWidth: 400, maxHeight: 200 })}
            alt={place.name}
            className="w-full h-[160px] object-cover object-center flex-shrink-0"
          />
        )}

        {/* Header */}
        <div className="px-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between pt-3">
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
        <div className="flex border-b border-gray-200 px-6 flex-shrink-0">
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

            onClick={handleAIInsightsTab}
            className={`flex-1 py-3 font-['Poppins',sans-serif] text-[14px] border-b-2 transition-colors ${
              activeTab === 'aiinsights'
                ? 'border-[#2c638b] text-[#2c638b] font-medium'
                : 'border-transparent text-gray-500'
            }`}
          >
            AI
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
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
                    <div className="mb-2">
                      <div className="flex items-center justify-between">
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

          {activeTab === 'aiinsights' && (
            <div className="space-y-4">
              {loadingAI && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c638b] mb-4"></div>
                  <p className="font-['Poppins',sans-serif] text-[14px] text-gray-600">Generating AI insights...</p>
                </div>
              )}

              {aiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-[20px]">⚠️</span>
                    <div className="flex-1">
                      <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-red-800 mb-1">Unable to load AI insights</p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-red-600">{aiError}</p>
                    </div>
                  </div>
                </div>
              )}

              {aiInsights && !loadingAI && (
                <>
                  {/* Why Famous Section */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[20px]">🌟</span>
                      <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">
                        Why It's Famous
                      </p>
                    </div>
                    <p className="font-['Poppins',sans-serif] text-[14px] text-gray-700 leading-relaxed pl-8">
                      {aiInsights.whyFamous}
                    </p>
                  </div>

                  {/* Cautions Section */}
                  {aiInsights.cautions && aiInsights.cautions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[20px]">⚠️</span>
                        <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">
                          Safety & Cautions
                        </p>
                      </div>
                      <div className="space-y-2 pl-8">
                        {aiInsights.cautions.map((caution, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="text-red-500 text-[14px] mt-1">•</span>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-gray-700 leading-relaxed flex-1">
                              {caution}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Considerations Section */}
                  {aiInsights.considerations && aiInsights.considerations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[20px]">💡</span>
                        <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">
                          Visitor Tips
                        </p>
                      </div>
                      <div className="space-y-2 pl-8">
                        {aiInsights.considerations.map((tip, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span className="text-[#2c638b] text-[14px] mt-1">•</span>
                            <p className="font-['Poppins',sans-serif] text-[14px] text-gray-700 leading-relaxed flex-1">
                              {tip}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Best Time & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    {aiInsights.bestTimeToVisit && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[16px]">⏰</span>
                          <p className="font-['Poppins',sans-serif] font-semibold text-[12px] text-gray-600">
                            Best Time
                          </p>
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
                          {aiInsights.bestTimeToVisit}
                        </p>
                      </div>
                    )}
                    {aiInsights.estimatedDuration && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[16px]">⌚</span>
                          <p className="font-['Poppins',sans-serif] font-semibold text-[12px] text-gray-600">
                            Duration
                          </p>
                        </div>
                        <p className="font-['Poppins',sans-serif] text-[14px] text-black">
                          {aiInsights.estimatedDuration}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* AI Disclaimer */}
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 text-center">
                      ✨ AI-generated insights by Gemini. Always verify important information locally.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
