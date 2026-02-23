export interface PlaceLocation {
  lat: number;
  lng: number;
}

export interface TripPreference {
  id: string;
  label: string;
  icon: string;
}

export interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  position: PlaceLocation;
  types: string[];
}

export interface ItineraryItem {
  id: string;
  day: number;
  time: string;
  placeName: string;
  placeId: string;
  address: string;
  position: PlaceLocation;
  duration: number; // in hours
  description: string;
  estimatedTravelTime?: number; // in minutes
  notes?: string;
  images?: string[];
}

export interface TripItinerary {
  id: string;
  tripName: string;
  startDate: Date;
  endDate: Date;
  totalDays: number;
  startLocation: PlaceLocation;
  items: ItineraryItem[];
  preferences?: string[]; // e.g., 'historical', 'cultural', 'natural'
  totalDistance?: number; // in km
  createdAt: Date;
  updatedAt: Date;
}

export interface TripPlanningRequest {
  mode: 'custom' | 'preference'; // custom = user provides places, preference = AI finds places
  selectedPlaces?: PlaceSearchResult[]; // for custom mode
  preferences?: string[]; // for preference mode
  numberOfDays: number;
  startLocation: PlaceLocation;
  startDate: Date;
}

export interface AITripPlan {
  itinerary: ItineraryItem[];
  totalDistance: number;
  summary: string;
  highlights: string[];
}

export const TRIP_PREFERENCES: TripPreference[] = [
  { id: 'historical', label: 'Historical', icon: '🏛️' },
  { id: 'cultural', label: 'Cultural', icon: '🎭' },
  { id: 'natural', label: 'Natural', icon: '🌲' },
  { id: 'adventure', label: 'Adventure', icon: '🏔️' },
  { id: 'food', label: 'Food & Dining', icon: '🍽️' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎪' },
  { id: 'religious', label: 'Religious', icon: '🙏' },
];

// Mapping preferences to Google Place types
export const PREFERENCE_TO_PLACE_TYPES: Record<string, string[]> = {
  historical: ['museum', 'art_gallery', 'historic_building'],
  cultural: ['museum', 'place_of_worship', 'library', 'cultural_landmark'],
  natural: ['park', 'natural_feature', 'zoo', 'botanical_garden'],
  adventure: ['mountain', 'hiking_trail', 'amusement_park', 'water_park'],
  food: ['restaurant', 'cafe', 'bakery', 'bar', 'food'],
  shopping: ['shopping_mall', 'store', 'market'],
  entertainment: ['amusement_park', 'movie_theater', 'night_club'],
  religious: ['place_of_worship', 'hindu_temple', 'church', 'mosque'],
};
