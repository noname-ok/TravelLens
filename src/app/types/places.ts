export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface PlaceType {
  id: string;
  label: string;
  types: string[];
  icon: string;
}

export interface Attraction {
  placeId: string;
  name: string;
  position: PlaceLocation;
  types: string[];
  rating?: number;
  userRatingsTotal?: number;
  vicinity?: string;
  photos?: google.maps.places.PlacePhoto[];
  isOpen?: boolean;
}

export interface PlaceDetails extends Attraction {
  formattedAddress?: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    isOpen: boolean;
    weekdayText: string[];
  };
  reviews?: PlaceReview[];
  priceLevel?: number;
  culturalTips?: string[];
  dressCode?: string[];
}

export interface PlaceReview {
  authorName: string;
  rating: number;
  text: string;
  time: number;
  profilePhoto?: string;
}

export interface PlaceInsights {
  whyFamous: string;           // Main explanation
  cautions: string[];          // Safety/behavioral warnings
  considerations: string[];    // Tips for visiting
  bestTimeToVisit?: string;    // Optimal visit time
  estimatedDuration?: string;  // How long to spend
}

// Predefined place types for filtering
// Using STRICT Google Places API types only - no keywords
export const PLACE_FILTERS: PlaceType[] = [
  { id: 'all', label: 'All', types: ['tourist_attraction', 'museum', 'art_gallery', 'aquarium', 'zoo', 'amusement_park', 'park'], icon: '' },
  { id: 'temples', label: 'Temples', types: ['hindu_temple', 'place_of_worship', 'church', 'mosque', 'synagogue'], icon: '' },
  { id: 'museums', label: 'Museums', types: ['museum', 'art_gallery'], icon: '' },
  { id: 'food', label: 'Food', types: ['restaurant', 'cafe', 'bakery', 'meal_takeaway'], icon: '' },
  { id: 'shopping', label: 'Shopping', types: ['shopping_mall', 'department_store', 'store'], icon: '' },
  { id: 'parks', label: 'Parks', types: ['park', 'natural_feature', 'campground'], icon: '' },
];

// Cultural tips database (can be expanded or moved to backend)
export const CULTURAL_TIPS_DB: Record<string, string[]> = {
  temple: [
    "Remove shoes before entering temple grounds",
    "Dress modestly - cover shoulders and knees",
    "Ask permission before taking photos of monks or worshippers",
    "Walk clockwise around stupas and pagodas",
    "Do not point your feet at Buddha statues or religious items",
    "Speak quietly and maintain a respectful demeanor"
  ],
  restaurant: [
    "Tipping is appreciated but not mandatory in some countries (5-10%)",
    "Try traditional dishes with your hands if locals do",
    "Tea or water is often served for free",
    "Wait for elders or hosts to start eating first",
    "Learn basic phrases like 'thank you' in the local language"
  ],
  museum: [
    "Photography may require a permit or additional fee",
    "Flash photography is often prohibited",
    "Speak quietly and respect other visitors",
    "Don't touch artifacts or displays unless permitted",
    "Follow the suggested route if indicated"
  ],
  shopping: [
    "Bargaining is expected in many markets",
    "Cash is preferred in local markets",
    "Inspect goods carefully before purchasing",
    "Ask about return policies for larger purchases"
  ],
  park: [
    "Respect nature and wildlife",
    "Stay on designated paths",
    "Dispose of trash properly",
    "Be mindful of local customs regarding public spaces"
  ]
};

export const DRESS_CODE_DB: Record<string, string[]> = {
  temple: [
    "⚠️ Shoulders must be covered (no tank tops or sleeveless shirts)",
    "⚠️ Knees must be covered (long pants, skirts, or dresses)",
    "⚠️ Remove shoes and hats before entering",
    "⚠️ Avoid tight or revealing clothing",
    "✅ Modest, respectful clothing is required",
    "💡 Tip: Carry a light shawl or sarong for coverage"
  ],
  restaurant: [
    "👔 Smart casual for upscale restaurants",
    "👕 Casual attire acceptable for most places",
    "🚫 Some fine dining may require no shorts or flip-flops",
    "✅ Clean, presentable clothing recommended"
  ],
  museum: [
    "👕 Casual attire is acceptable",
    "👟 Comfortable walking shoes recommended",
    "🎒 Large bags may need to be checked",
    "✅ No specific dress code in most cases"
  ],
  shopping: [
    "👕 Casual, comfortable clothing",
    "👟 Comfortable shoes for walking",
    "🎒 Secure bag for valuables",
    "✅ Dress appropriately for the climate"
  ],
  park: [
    "👟 Comfortable walking or hiking shoes",
    "🧢 Hat and sunscreen for sun protection",
    "💧 Bring water and appropriate gear",
    "✅ Weather-appropriate clothing"
  ]
};
