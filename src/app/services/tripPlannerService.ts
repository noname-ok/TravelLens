import {
  TripItinerary,
  ItineraryItem,
  PlaceSearchResult,
  TripPlanningRequest,
} from '@/app/types/tripPlanning';
import { PlaceLocation } from '@/app/types/places';
import { generateTripItinerary, findPlacesByPreference, PlaceForItinerary } from './geminiService';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate travel time between two points
 * Rough approximation: average speed 40 km/h in city, varies by distance
 */
export function estimateTravelTime(distanceKm: number): number {
  if (distanceKm < 2) return 10; // walk
  if (distanceKm < 5) return distanceKm * 3; // local transport
  return Math.ceil(distanceKm * 2.5); // further distances
}

/**
 * Calculate optimal route order (simplified nearest neighbor algorithm)
 */
export function optimizeRouteOrder(
  places: PlaceSearchResult[],
  startLocation: PlaceLocation
): PlaceSearchResult[] {
  if (places.length === 0) return places;
  if (places.length === 1) return places;

  const unvisited = [...places];
  const optimized: PlaceSearchResult[] = [];
  let currentLocation = startLocation;

  while (unvisited.length > 0) {
    // Find nearest unvisited place
    let nearestIndex = 0;
    let minDistance = Infinity;

    unvisited.forEach((place, index) => {
      const distance = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        place.position.lat,
        place.position.lng
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = index;
      }
    });

    const nearest = unvisited[nearestIndex];
    optimized.push(nearest);
    currentLocation = nearest.position;
    unvisited.splice(nearestIndex, 1);
  }

  return optimized;
}

/**
 * Generate trip itinerary from optimized places
 */
export async function generateTripFromPlaces(
  places: PlaceSearchResult[],
  numberOfDays: number,
  startDate: Date,
  startLocation: PlaceLocation,
  preferences?: string[]
): Promise<TripItinerary> {
  // Optimize route order
  const optimizedPlaces = optimizeRouteOrder(places, startLocation);

  // Prepare places for AI
  const placesForAI: PlaceForItinerary[] = optimizedPlaces.map((place) => ({
    name: place.name,
    address: place.address,
    lat: place.position.lat,
    lng: place.position.lng,
    estimatedDuration: 2, // Default 2 hours per place
  }));

  // Get AI-generated itinerary
  const aiResponse = await generateTripItinerary(
    placesForAI,
    numberOfDays,
    startDate.toISOString().split('T')[0],
    preferences
  );

  // Convert AI response to itinerary items
  let totalDistance = 0;
  const items: ItineraryItem[] = [];

  for (let i = 0; i < aiResponse.itinerary.length; i++) {
    const item = aiResponse.itinerary[i];
    const matchingPlace = optimizedPlaces.find(
      (p) => p.name.toLowerCase().includes(item.place.toLowerCase())
    );

    if (matchingPlace) {
      // Calculate distance from previous location
      const prevLocation =
        i === 0
          ? startLocation
          : items[i - 1]?.position || startLocation;
      const distance = calculateDistance(
        prevLocation.lat,
        prevLocation.lng,
        matchingPlace.position.lat,
        matchingPlace.position.lng
      );
      totalDistance += distance;

      items.push({
        id: `item_${i}`,
        day: item.day,
        time: item.time,
        placeName: matchingPlace.name,
        placeId: matchingPlace.placeId,
        address: matchingPlace.address,
        position: matchingPlace.position,
        duration: item.duration,
        description: item.description,
        estimatedTravelTime: item.estimatedTravelTime,
        notes: item.notes,
      });
    }
  }

  const tripId = `trip_${Date.now()}`;
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + numberOfDays - 1);

  return {
    id: tripId,
    tripName: `Trip to ${places[0]?.name || 'Unknown'} & more`,
    startDate,
    endDate,
    totalDays: numberOfDays,
    startLocation,
    items,
    preferences,
    totalDistance: Math.round(totalDistance * 10) / 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Find places by preferences and generate itinerary
 */
export async function generateTripFromPreferences(
  preferences: string[],
  numberOfDays: number,
  startDate: Date,
  startLocation: PlaceLocation,
  locationName: string,
  placesService: google.maps.places.PlacesService,
  map: google.maps.Map
): Promise<TripItinerary> {
  // Get AI recommendations
  const aiResponse = await findPlacesByPreference(preferences, numberOfDays, locationName);

  // Search for actual places on Google Maps
  const foundPlaces: PlaceSearchResult[] = [];

  for (const recommendation of aiResponse.recommendedPlaces) {
    try {
      const result = await new Promise<PlaceSearchResult | null>((resolve) => {
        const request = {
          query: `${recommendation.name} at ${locationName}`,
          fields: ['name', 'geometry', 'place_id', 'formatted_address', 'rating'],
        };

        placesService.findPlaceFromQuery(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
            const place = results[0];
            resolve({
              placeId: place.place_id!,
              name: place.name!,
              address: place.formatted_address || recommendation.name,
              rating: place.rating || 4.0,
              position: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0,
              },
              types: [],
            });
          } else {
            resolve(null);
          }
        });
      });

      if (result) {
        foundPlaces.push(result);
      }
    } catch (error) {
      console.error(`Error finding place: ${recommendation.name}`, error);
    }
  }

  // Generate trip from found places
  if (foundPlaces.length === 0) {
    throw new Error('Could not find suitable places matching your preferences.');
  }

  return generateTripFromPlaces(foundPlaces, numberOfDays, startDate, startLocation, preferences);
}

/**
 * Save trip to localStorage
 */
export function saveTripToStorage(trip: TripItinerary): void {
  const trips = JSON.parse(localStorage.getItem('userTrips') || '[]') as TripItinerary[];
  trips.push(trip);
  localStorage.setItem('userTrips', JSON.stringify(trips));
}

/**
 * Load trips from localStorage
 */
export function loadTripsFromStorage(): TripItinerary[] {
  const trips = JSON.parse(localStorage.getItem('userTrips') || '[]') as TripItinerary[];
  return trips.map((trip) => ({
    ...trip,
    startDate: new Date(trip.startDate),
    endDate: new Date(trip.endDate),
    createdAt: new Date(trip.createdAt),
    updatedAt: new Date(trip.updatedAt),
  }));
}

/**
 * Delete trip from localStorage
 */
export function deleteTripFromStorage(tripId: string): void {
  const trips = loadTripsFromStorage();
  const filtered = trips.filter((t) => t.id !== tripId);
  localStorage.setItem('userTrips', JSON.stringify(filtered));
}

/**
 * Update trip in localStorage
 */
export function updateTripInStorage(trip: TripItinerary): void {
  const trips = loadTripsFromStorage();
  const index = trips.findIndex((t) => t.id === trip.id);
  if (index !== -1) {
    trips[index] = { ...trip, updatedAt: new Date() };
    localStorage.setItem('userTrips', JSON.stringify(trips));
  }
}
