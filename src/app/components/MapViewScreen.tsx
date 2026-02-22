import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Home, MapPin, Camera, User, Compass, LocateFixed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PlaceDetailSheet from './PlaceDetailSheet';
import { Attraction, PlaceDetails, PlaceLocation } from '@/app/types/places';

const imgNotch = "https://www.figma.com/api/mcp/asset/447966c0-8cc6-4c7f-a13a-64114ed088bb";
const imgRightSide = "https://www.figma.com/api/mcp/asset/1b3fd3c4-c6a2-4bcf-ab21-ccaf3d359bcf";

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

function StatusBarIPhone({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <div className="h-[47px] relative w-full">
        <div className="-translate-x-1/2 absolute h-[32px] left-1/2 top-[-2px] w-[164px]">
          <img alt="" className="block max-w-none size-full" src={imgNotch} />
        </div>
        <div className="-translate-x-1/2 absolute contents left-[calc(16.67%-11px)] top-[14px]">
          <div className="-translate-x-1/2 absolute h-[21px] left-[calc(16.67%-11px)] rounded-[24px] top-[14px] w-[54px]">
            <p className="-translate-x-1/2 absolute font-['SF_Pro_Text:Semibold',sans-serif] h-[20px] leading-[22px] left-[27px] not-italic text-[17px] text-black text-center top-px tracking-[-0.408px] w-[54px] whitespace-pre-wrap">
              9:41
            </p>
          </div>
        </div>
        <div className="-translate-x-1/2 absolute h-[13px] left-[calc(83.33%-0.3px)] top-[19px] w-[77.401px]">
          <img alt="" className="block max-w-none size-full" src={imgRightSide} />
        </div>
      </div>
    </div>
  );
}

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface MapViewScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
}

export default function MapViewScreen({ currentScreen, onNavigate }: MapViewScreenProps) {
  const { t } = useTranslation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<PlaceLocation>({ lat: 11.5564, lng: 104.9282 }); // Phnom Penh default
  const [userLocation, setUserLocation] = useState<PlaceLocation | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [activeFilter] = useState('all'); // Keep for compatibility, but not used
  const [searchedPlace, setSearchedPlace] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          setCenter(pos);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Keep default Phnom Penh location if error
        }
      );
    }
  }, []);

  // Strict validation to filter out irrelevant places
  const isValidPlaceForFilter = useCallback((place: google.maps.places.PlaceResult, filterTypes: string[]): boolean => {
    if (!place.types || !place.name) return false;
    
    // Define excluded types for each filter to prevent mismatches
    const excludeMap: { [key: string]: string[] } = {
      all: ['bank', 'atm', 'finance', 'accounting', 'insurance_agency', 'car_repair', 'car_dealer', 'gas_station', 'convenience_store', 'supermarket', 'lodging', 'real_estate_agency', 'laundry', 'car_wash', 'parking', 'storage'],
    };
    
    const excludedTypes = excludeMap[activeFilter] || excludeMap['all'];
    
    // Reject if place has any excluded type
    const hasExcludedType = place.types.some(type => excludedTypes.includes(type));
    if (hasExcludedType) {
      console.log(`❌ Filtered out: ${place.name} - contains excluded type:`, place.types);
      return false;
    }
    
    // Accept if place has at least one desired type
    const hasDesiredType = place.types.some(type => filterTypes.includes(type));
    if (!hasDesiredType) {
      console.log(`❌ Filtered out: ${place.name} - doesn't match filter types`);
      return false;
    }
    
    console.log(`✅ Accepted: ${place.name}`);
    return true;
  }, [activeFilter]);

  // Search nearby places based on filter
  const searchNearbyPlaces = useCallback((location: PlaceLocation, placeTypes: string[]) => {
    if (!map) return;

    setLoading(true);
    const service = new google.maps.places.PlacesService(map);
    const allResults: Attraction[] = [];
    let searchesCompleted = 0;
    const totalSearches = placeTypes.length;
    
    console.log(`Starting search for ${totalSearches} types:`, placeTypes);
    
    // Search for each type and combine results
    placeTypes.forEach((placeType) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: 5000, // 5km
        type: placeType as any,
      };

      service.nearbySearch(request, (results, status) => {
        searchesCompleted++;
        console.log(`Search ${searchesCompleted}/${totalSearches} for "${placeType}": ${status}, found ${results?.length || 0} places`);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Apply strict filtering to remove banks and irrelevant places
          const validResults = results
            .filter(place => place.geometry?.location && isValidPlaceForFilter(place, placeTypes));
          
          console.log(`✅ Valid results for ${placeType}: ${validResults.length}/${results.length}`);
          
          validResults.forEach((place) => {
            // Check if this place already exists in allResults
            const exists = allResults.some(a => a.placeId === place.place_id);
            if (!exists) {
              allResults.push({
                placeId: place.place_id!,
                name: place.name!,
                position: {
                  lat: place.geometry!.location!.lat(),
                  lng: place.geometry!.location!.lng(),
                  },
                  types: place.types || [],
                  rating: place.rating,
                  userRatingsTotal: place.user_ratings_total,
                  vicinity: place.vicinity,
                  photos: place.photos,
                  isOpen: place.opening_hours?.isOpen(),
                });
              }
            });
          }
        
        // When all searches complete, update state
        if (searchesCompleted === totalSearches) {
          console.log(`All searches complete! Total unique results: ${allResults.length}`);
          const finalResults = allResults.slice(0, 30);
          setAttractions(finalResults);
          
          // Adjust map bounds to show all markers
          if (finalResults.length > 0 && map) {
            const bounds = new google.maps.LatLngBounds();
            finalResults.forEach(attraction => {
              bounds.extend(new google.maps.LatLng(attraction.position.lat, attraction.position.lng));
            });
            // Also include user location
            if (location) {
              bounds.extend(new google.maps.LatLng(location.lat, location.lng));
            }
            map.fitBounds(bounds);
            // Don't zoom in too much
            google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
              const currentZoom = map.getZoom();
              if (currentZoom && currentZoom > 15) {
                map.setZoom(15);
              }
            });
          }
          
          setLoading(false);
        }
      });
    });
  }, [map, isValidPlaceForFilter]);

  // Fetch detailed place information
  const fetchPlaceDetails = useCallback((placeId: string, attraction: Attraction) => {
    if (!map) return;

    const service = new google.maps.places.PlacesService(map);
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: placeId,
      fields: [
        'name', 'formatted_address', 'formatted_phone_number', 'website',
        'opening_hours', 'rating', 'user_ratings_total', 'reviews',
        'price_level', 'photos', 'types', 'geometry'
      ]
    };

    service.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const details: PlaceDetails = {
          ...attraction,
          formattedAddress: place.formatted_address,
          phoneNumber: place.formatted_phone_number,
          website: place.website,
          openingHours: place.opening_hours ? {
            isOpen: place.opening_hours.isOpen() || false,
            weekdayText: place.opening_hours.weekday_text || []
          } : undefined,
          reviews: place.reviews
            ?.filter(r => r.rating !== undefined)
            .slice(0, 5)
            .map(r => ({
              authorName: r.author_name,
              rating: r.rating!,
              text: r.text,
              time: r.time,
              profilePhoto: r.profile_photo_url
            })),
          priceLevel: place.price_level,
        };
        setSelectedPlace(details);
      }
    });
  }, [map]);

  // Handle map load
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Initialize services
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
    if (!placesServiceRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(map);
    }

    // Add listener for clicks on Google Maps POI markers
    map.addListener('click', (e: any) => {
      if (e.placeId) {
        // Prevent default behavior of showing Google's info window
        e.stop();
        
        // Fetch basic place info first
        const service = new google.maps.places.PlacesService(map);
        service.getDetails(
          {
            placeId: e.placeId,
            fields: ['name', 'place_id', 'geometry', 'types', 'rating', 'user_ratings_total', 'photos', 'vicinity']
          },
          (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location) {
              const attraction: Attraction = {
                placeId: place.place_id!,
                name: place.name!,
                position: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                types: place.types || [],
                rating: place.rating,
                userRatingsTotal: place.user_ratings_total,
                vicinity: place.vicinity,
                photos: place.photos
              };
              
              // Show info window
              setSelectedAttraction(attraction);
              
              // Fetch and show full details
              fetchPlaceDetails(place.place_id!, attraction);
            }
          }
        );
      }
    });
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Handle search input change
  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Check if services are available
    if (!autocompleteServiceRef.current) {
      // Try to initialize if Google Maps is available
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      } else {
        console.warn('Google Maps AutocompleteService not ready yet');
        return;
      }
    }

    const currentLoc = userLocation || center;
    const request: google.maps.places.AutocompletionRequest = {
      input: value,
      location: new google.maps.LatLng(currentLoc.lat, currentLoc.lng),
      radius: 20000, // 20km radius (matches MAX_DISTANCE_KM filter)
      componentRestrictions: { country: 'my' } // Restrict to Malaysia
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Fetch details for each prediction to get coordinates and calculate distance
        const detailsPromises = results.slice(0, 10).map((prediction) => {
          return new Promise<{prediction: google.maps.places.AutocompletePrediction, distance: number}>((resolve) => {
            // Initialize placesService if needed
            if (!placesServiceRef.current && map) {
              placesServiceRef.current = new google.maps.places.PlacesService(map);
            }
            
            if (!placesServiceRef.current) {
              resolve({ prediction, distance: Infinity });
              return;
            }
            
            placesServiceRef.current.getDetails(
              { placeId: prediction.place_id, fields: ['geometry'] },
              (place, detailStatus) => {
                if (detailStatus === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                  const distance = calculateDistance(
                    currentLoc.lat,
                    currentLoc.lng,
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                  );
                  resolve({ prediction, distance });
                } else {
                  resolve({ prediction, distance: Infinity });
                }
              }
            );
          });
        });

        Promise.all(detailsPromises).then((predictionsWithDistance) => {
          // Filter out results beyond 20km and sort by distance
          const MAX_DISTANCE_KM = 20;
          const sorted = predictionsWithDistance
            .filter(item => item.distance <= MAX_DISTANCE_KM)
            .sort((a, b) => a.distance - b.distance)
            .map(item => item.prediction);
          setPredictions(sorted);
          setShowPredictions(sorted.length > 0);
        });
      } else {
        setPredictions([]);
        setShowPredictions(false);
      }
    });
  }, [userLocation, center, calculateDistance, map]);

  // Handle prediction selection
  const handlePredictionSelect = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current || !map) return;
    
    setSearchQuery(prediction.description);
    setShowPredictions(false);
    setPredictions([]);
    
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ['place_id', 'name', 'geometry', 'types', 'formatted_address', 'vicinity', 'rating']
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place && place.geometry?.location && place.place_id) {
          const newCenter = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          
          const searchedAttraction: Attraction = {
            placeId: place.place_id,
            name: place.name || 'Selected Place',
            position: newCenter,
            types: place.types || [],
            rating: place.rating,
            vicinity: place.vicinity || place.formatted_address,
          };
          
          setSearchedPlace(searchedAttraction);
          setCenter(newCenter);
          map.panTo(newCenter);
          map.setZoom(16);
        }
      }
    );
  }, [map]);

  // Search for tourist destinations (triggered by floating button)
  const searchTouristDestinations = useCallback(() => {
    if (!map) return;
    
    // Use searched place location if available, otherwise use user's current location or map center
    const searchLocation = searchedPlace?.position || userLocation || center;
    
    const touristTypes = [
      'tourist_attraction',
      'museum',
      'art_gallery',
      'aquarium',
      'zoo',
      'amusement_park',
      'park',
      'church',
      'hindu_temple',
      'mosque',
      'stadium',
      'library'
    ];
    
    console.log('Searching for tourist destinations at:', searchLocation);
    searchNearbyPlaces(searchLocation, touristTypes);
  }, [searchedPlace, userLocation, center, map, searchNearbyPlaces]);

  // Reset map to user's current location
  const resetToUserLocation = useCallback(() => {
    if (!userLocation || !map) return;
    
    setSearchedPlace(null); // Clear searched place so nearby button uses current location
    setCenter(userLocation);
    map.panTo(userLocation);
    map.setZoom(15);
  }, [userLocation, map]);

  // Log when attractions update
  useEffect(() => {
    console.log(`Attractions updated: ${attractions.length} markers should be visible`);
    if (attractions.length > 0) {
      console.log('First 3 attractions:', attractions.slice(0, 3).map(a => ({
        name: a.name,
        position: a.position
      })));
    }
  }, [attractions]);

  // Handle marker click
  const handleMarkerClick = (attraction: Attraction) => {
    setSelectedAttraction(attraction);
  };

  const handleNavigation = (screen: 'home' | 'mapview' | 'ailens' | 'profile') => {
    onNavigate(screen);
  };

  return (
    <div className="bg-white relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        {/* Status Bar */}
        <StatusBarIPhone className="absolute h-[47px] left-0 right-0 overflow-clip top-0" />

        {/* Header */}
        <div className="absolute left-[24px] top-[52px]">
          <h1 className="font-['Poppins',sans-serif] font-semibold text-[24px] text-black leading-[32px]">
            Map View
          </h1>
        </div>

        {/* Map Container - Google Maps */}
        <div 
          id="google-map" 
          className="absolute left-0 right-0 top-[160px] bottom-[90px]"
        >
        {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? (
          <LoadScript
            googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
            libraries={libraries}
            onError={(error) => {
              console.error('Google Maps Load Error:', error);
              setLoadError('Failed to load Google Maps. Check API key restrictions.');
            }}
          >
            {/* Search Bar - Must be inside LoadScript for Autocomplete to work */}
            <div className="absolute left-[24px] top-[-60px] right-[24px] z-10">
              <div className="bg-[#f5f5f5] flex items-center h-[48px] rounded-[12px] px-[16px] gap-[12px] shadow-sm">
                {/* Menu Icon */}
                <button className="shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#2c638b"/>
                  </svg>
                </button>

                {/* Autocomplete Search Input */}
                <div className="flex-1 relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onFocus={() => {
                      if (predictions.length > 0) setShowPredictions(true);
                    }}
                    onBlur={() => {
                      // Delay to allow click on prediction
                      setTimeout(() => setShowPredictions(false), 200);
                    }}
                    placeholder="Search here..."
                    className="w-full bg-transparent outline-none font-['Poppins',sans-serif] text-[14px] text-[#2c638b] placeholder:text-[#2c638b] placeholder:opacity-70"
                    onClick={(e) => {
                      // Select all text on click if there's content
                      const input = e.currentTarget;
                      if (input.value) {
                        setTimeout(() => input.select(), 0);
                      }
                    }}
                  />
                  
                  {/* Custom Dropdown for Predictions */}
                  {showPredictions && predictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-50">
                      {predictions.map((prediction) => (
                        <button
                          key={prediction.place_id}
                          onClick={() => handlePredictionSelect(prediction)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
                        >
                          <div className="flex items-start gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2c638b"/>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="font-['Poppins',sans-serif] text-[14px] text-black font-medium truncate">
                                {prediction.structured_formatting.main_text}
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 truncate">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Icon */}
                <button className="shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#2c638b"/>
                  </svg>
                </button>
              </div>
            </div>
            {loadError ? (
              <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-[#ffe8e8] to-[#ffd0d0]">
                <div className="mb-[24px]">
                  <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                    <circle cx="60" cy="60" r="50" fill="#ff6b6b" opacity="0.2"/>
                    <path d="M60 35v35M60 82v3" stroke="#ff0000" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="font-['Poppins',sans-serif] font-semibold text-[20px] text-black mb-[8px]">
                  Map Load Error
                </p>
                <p className="font-['Poppins',sans-serif] text-[14px] text-[rgba(0,0,0,0.6)] text-center px-[40px] mb-[16px]">
                  {loadError}
                </p>
                <div className="bg-white p-4 rounded-lg shadow-lg mx-[24px] text-left">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mb-2">
                    🔧 Fix Steps:
                  </p>
                  <ol className="font-['Poppins',sans-serif] text-[12px] text-gray-700 space-y-1 list-decimal list-inside">
                    <li>Go to Google Cloud Console</li>
                    <li>Find your API key</li>
                    <li>Remove referrer restrictions OR add:</li>
                  </ol>
                  <div className="bg-gray-100 p-2 rounded mt-2 font-mono text-[10px]">
                    http://localhost:*/*<br/>
                    http://127.0.0.1:*/*
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-3 w-full bg-[#2c638b] text-white px-4 py-2 rounded-lg text-[12px] font-['Poppins',sans-serif] hover:bg-[#234d6a] transition"
                  >
                    Retry After Fixing
                  </button>
                </div>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={14}
                options={mapOptions}
                onLoad={onLoad}
              >
              {/* User Location Marker */}
              {userLocation && (
                <Marker
                  position={userLocation}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#2c638b',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 3,
                  }}
                  title="Your Location"
                />
              )}

              {/* Attraction Markers */}
              {(() => {
                console.log(`Rendering ${attractions.length} tourist markers`);
                return attractions.map((attraction) => (
                  <Marker
                    key={attraction.placeId}
                    position={attraction.position}
                    onClick={() => handleMarkerClick(attraction)}
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                      scaledSize: new google.maps.Size(40, 40)
                    }}
                    title={attraction.name}
                  />
                ));
              })()}

              {/* Searched Place Marker (Different Color) */}
              {searchedPlace && (
                <Marker
                  position={searchedPlace.position}
                  onClick={() => {
                    handleMarkerClick(searchedPlace);
                    fetchPlaceDetails(searchedPlace.placeId, searchedPlace);
                  }}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new google.maps.Size(40, 40)
                  }}
                  title={searchedPlace.name}
                />
              )}

              {/* Info Window */}
              {selectedAttraction && (
                <InfoWindow
                  position={selectedAttraction.position}
                  onCloseClick={() => setSelectedAttraction(null)}
                >
                  <div className="p-2 min-w-[200px] max-w-[250px]">
                    {selectedAttraction.photos && selectedAttraction.photos.length > 0 && (
                      <img 
                        src={selectedAttraction.photos[0].getUrl({ maxWidth: 250, maxHeight: 150 })}
                        alt={selectedAttraction.name}
                        className="w-full h-[100px] object-cover rounded-lg mb-2"
                      />
                    )}
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black mb-1">
                      {selectedAttraction.name}
                    </h3>
                    {selectedAttraction.rating && (
                      <div className="flex items-center gap-1 mb-2">
                        <span className="text-[14px]">⭐</span>
                        <span className="font-['Poppins',sans-serif] text-[12px]">
                          {selectedAttraction.rating.toFixed(1)}
                        </span>
                        {selectedAttraction.userRatingsTotal && (
                          <span className="font-['Poppins',sans-serif] text-[10px] text-gray-500">
                            ({selectedAttraction.userRatingsTotal})
                          </span>
                        )}
                      </div>
                    )}
                    {selectedAttraction.vicinity && (
                      <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600 mb-2">
                        {selectedAttraction.vicinity}
                      </p>
                    )}
                    <button
                      onClick={() => fetchPlaceDetails(selectedAttraction.placeId, selectedAttraction)}
                      className="bg-[#2c638b] text-white px-3 py-1 rounded-lg text-[12px] font-['Poppins',sans-serif] hover:bg-[#234d6a] transition w-full"
                    >
                      View Details
                    </button>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
            )}
          </LoadScript>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-[#e8f4f8] to-[#d0e8f0]">
            <div className="mb-[24px]">
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                <circle cx="60" cy="60" r="50" fill="#8bb4c4" opacity="0.2"/>
                <circle cx="60" cy="60" r="35" fill="#8bb4c4" opacity="0.3"/>
                <path 
                  d="M60 30C48.954 30 40 38.954 40 50c0 15 20 40 20 40s20-25 20-40c0-11.046-8.954-20-20-20zm0 27c-3.866 0-7-3.134-7-7s3.134-7 7-7 7 3.134 7 7-3.134 7-7 7z" 
                  fill="#2c638b"
                />
              </svg>
            </div>
            <p className="font-['Poppins',sans-serif] font-semibold text-[20px] text-black mb-[8px]">
              Google Maps API Key Required
            </p>
            <p className="font-['Poppins',sans-serif] text-[14px] text-[rgba(0,0,0,0.6)] text-center px-[40px]">
              Add VITE_GOOGLE_MAPS_API_KEY to your .env file
            </p>
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg z-20">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c638b]"></div>
              <span className="font-['Poppins',sans-serif] text-[14px] text-black">Loading...</span>
            </div>
          </div>
        )}

        {/* Floating Action Buttons */}
        <div className="absolute bottom-[30px] left-[24px] z-20 flex gap-3">
          {/* View Nearby Button */}
          <button
            onClick={searchTouristDestinations}
            disabled={!map || loading}
            className="bg-[#2c638b] text-white rounded-full shadow-lg hover:bg-[#234d6a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-5 py-3"
            title="View nearby tourist attractions"
          >
            <Compass size={20} strokeWidth={2.5} />
            <span className="font-['Poppins',sans-serif] text-[14px] font-medium">
              Nearby Attractions
            </span>
          </button>

          {/* Back to Location Button */}
          <button
            onClick={resetToUserLocation}
            disabled={!userLocation}
            className="bg-white text-[#2c638b] rounded-full shadow-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-[48px] h-[48px]"
            title="Back to my location"
          >
            <LocateFixed size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>

        {/* Place Detail Sheet */}
        {selectedPlace && (
          <PlaceDetailSheet
            place={selectedPlace}
            onClose={() => {
              setSelectedPlace(null);
              setSelectedAttraction(null);
            }}
          />
        )}

        {/* Bottom Navigation */}
        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          {/* Divider */}
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)]" />
          
          {/* Nav Bar */}
          <div className="flex flex-col h-[78px] p-[10px]">
            <div className="flex gap-[10px] h-[60px] items-center justify-center p-[10px]">
            {/* Home */}
            <button
              onClick={() => handleNavigation('home')}
              className="flex-1 flex flex-col items-center"
            >
              <Home 
                size={28}
                className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                {t('navigation.home')}
              </p>
            </button>

            {/* Nearby */}
            <button
              onClick={() => handleNavigation('mapview')}
              className="flex-1 flex flex-col items-center"
            >
              <MapPin 
                size={28}
                className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                {t('navigation.nearby')}
              </p>
            </button>

            {/* AI Lens */}
            <button
              onClick={() => handleNavigation('ailens')}
              className="flex-1 flex flex-col items-center"
            >
              <Camera 
                size={28}
                className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                {t('navigation.aiLens')}
              </p>
            </button>

            {/* Profile */}
            <button
              onClick={() => handleNavigation('profile')}
              className="flex-1 flex flex-col items-center"
            >
              <User 
                size={28}
                className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)]'
              }`}>
                {t('navigation.profile')}
              </p>
            </button>
            </div>
          </div>

          {/* Home Indicator */}
          <HomeIndicator className="absolute h-[34px] left-0 right-0 bottom-0" />
        </div>
      </div>
    </div>
  );
}
