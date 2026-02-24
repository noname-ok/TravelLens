import {
  TripItinerary,
  ItineraryItem,
  PlaceSearchResult,
  TripPlanningRequest,
} from '@/app/types/tripPlanning';
import { PlaceLocation } from '@/app/types/places';
import { generateTripItinerary, findPlacesByPreference, PlaceForItinerary } from './geminiService';

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scorePlaceMatch(aiPlace: string, candidate: PlaceSearchResult): number {
  const left = normalizeText(aiPlace);
  const right = normalizeText(candidate.name);
  if (!left || !right) return 0;
  if (left === right) return 100;
  if (left.includes(right) || right.includes(left)) return 80;

  const leftWords = new Set(left.split(' '));
  const rightWords = new Set(right.split(' '));
  let overlap = 0;
  rightWords.forEach((word) => {
    if (leftWords.has(word)) overlap += 1;
  });
  return overlap;
}

function pickBestMatchingPlace(
  aiPlace: string,
  candidates: PlaceSearchResult[],
  usedPlaceIds: Set<string>,
): PlaceSearchResult | null {
  let best: PlaceSearchResult | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    if (usedPlaceIds.has(candidate.placeId)) continue;
    const score = scorePlaceMatch(aiPlace, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  if (best && bestScore > 0) return best;

  for (const candidate of candidates) {
    if (!usedPlaceIds.has(candidate.placeId)) return candidate;
  }

  return candidates[0] || null;
}

function fallbackTime(index: number): string {
  const slots = ['09:00', '12:00', '15:00', '18:00'];
  return slots[index % slots.length];
}

function clampDay(day: number, totalDays: number): number {
  if (!Number.isFinite(day)) return 1;
  return Math.max(1, Math.min(totalDays, Math.floor(day)));
}

function recomputeTotalDistance(items: ItineraryItem[], startLocation: PlaceLocation): number {
  let total = 0;
  let previous = startLocation;

  for (const item of items) {
    const distance = calculateDistance(previous.lat, previous.lng, item.position.lat, item.position.lng);
    total += distance;
    previous = item.position;
  }

  return Math.round(total * 10) / 10;
}

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
  const items: ItineraryItem[] = [];
  const usedPlaceIds = new Set<string>();

  for (let i = 0; i < aiResponse.itinerary.length; i++) {
    const item = aiResponse.itinerary[i];
    const matchingPlace = pickBestMatchingPlace(item.place, optimizedPlaces, usedPlaceIds);
    if (!matchingPlace) continue;

    usedPlaceIds.add(matchingPlace.placeId);

    const prevLocation =
      i === 0
        ? startLocation
        : items[i - 1]?.position || startLocation;
    const estimatedTravelTime =
      item.estimatedTravelTime && item.estimatedTravelTime > 0
        ? item.estimatedTravelTime
        : estimateTravelTime(
            calculateDistance(
              prevLocation.lat,
              prevLocation.lng,
              matchingPlace.position.lat,
              matchingPlace.position.lng,
            ),
          );

    items.push({
      id: `item_${i}`,
      day: clampDay(item.day, numberOfDays),
      time: item.time || fallbackTime(i),
      placeName: matchingPlace.name,
      placeId: matchingPlace.placeId,
      address: matchingPlace.address,
      position: matchingPlace.position,
      duration: item.duration && item.duration > 0 ? item.duration : 2,
      description: item.description || `Explore ${matchingPlace.name}.`,
      estimatedTravelTime,
      notes: item.notes,
    });
  }

  if (items.length === 0) {
    const fallbackCount = Math.max(numberOfDays, Math.min(optimizedPlaces.length, numberOfDays * 2));
    for (let index = 0; index < fallbackCount; index++) {
      const place = optimizedPlaces[index % optimizedPlaces.length];
      const prevLocation = index === 0 ? startLocation : items[index - 1].position;
      items.push({
        id: `fallback_item_${index}`,
        day: (index % numberOfDays) + 1,
        time: fallbackTime(index),
        placeName: place.name,
        placeId: place.placeId,
        address: place.address,
        position: place.position,
        duration: 2,
        description: `Explore ${place.name} and nearby highlights.`,
        estimatedTravelTime: estimateTravelTime(
          calculateDistance(prevLocation.lat, prevLocation.lng, place.position.lat, place.position.lng),
        ),
        notes: 'Generated fallback activity to complete your itinerary.',
      });
    }
  }

  for (let day = 1; day <= numberOfDays; day++) {
    const hasDay = items.some((entry) => entry.day === day);
    if (hasDay) continue;

    const place = optimizedPlaces[(day - 1) % optimizedPlaces.length];
    const previous = items
      .filter((entry) => entry.day < day)
      .sort((left, right) => left.day - right.day)
      .pop();
    const prevLocation = previous?.position || startLocation;

    items.push({
      id: `filled_day_${day}`,
      day,
      time: '10:00',
      placeName: place.name,
      placeId: place.placeId,
      address: place.address,
      position: place.position,
      duration: 2,
      description: `Day ${day} focus: Discover ${place.name} and the surrounding area at a relaxed pace.`,
      estimatedTravelTime: estimateTravelTime(
        calculateDistance(prevLocation.lat, prevLocation.lng, place.position.lat, place.position.lng),
      ),
      notes: 'Auto-filled to ensure each day has at least one activity.',
    });
  }

  items.sort((left, right) => {
    if (left.day !== right.day) return left.day - right.day;
    return left.time.localeCompare(right.time);
  });

  const totalDistance = recomputeTotalDistance(items, startLocation);

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
