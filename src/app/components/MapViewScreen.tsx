import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Home, MapPin, Camera, User } from 'lucide-react';
import PlaceDetailSheet from './PlaceDetailSheet';
import { PLACE_FILTERS, Attraction, PlaceDetails, PlaceLocation } from '@/app/types/places';

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
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<PlaceLocation>({ lat: 11.5564, lng: 104.9282 }); // Phnom Penh default
  const [userLocation, setUserLocation] = useState<PlaceLocation | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string>('');

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
          results
            .filter(place => place.geometry?.location)
            .forEach((place) => {
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
            const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
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
  }, [map]);

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
  }, []);

  // Search when map loads and filter changes
  useEffect(() => {
    if (map && userLocation) {
      const filter = PLACE_FILTERS.find(f => f.id === activeFilter);
      if (filter) {
        console.log(`Filter changed to: ${filter.label}, searching for types:`, filter.types);
        searchNearbyPlaces(userLocation, filter.types);
      }
    }
  }, [map, userLocation, activeFilter, searchNearbyPlaces]);

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

  // Handle search
  const handleSearch = () => {
    if (!searchQuery || !map) return;

    const service = new google.maps.places.PlacesService(map);
    const request = {
      query: searchQuery,
      fields: ['name', 'geometry', 'place_id', 'types'],
    };

    service.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
        const place = results[0];
        if (place.geometry?.location) {
          const newCenter = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
          setCenter(newCenter);
          map.panTo(newCenter);
          map.setZoom(15);
        }
      }
    });
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

        {/* Search Bar */}
        <div className="absolute left-[24px] top-[100px] right-[24px] z-10">
          <div className="bg-[#f5f5f5] flex items-center h-[48px] rounded-[12px] px-[16px] gap-[12px] shadow-sm">
            {/* Menu Icon */}
            <button className="shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#2c638b"/>
              </svg>
            </button>

            {/* Search Input */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search your location"
              className="flex-1 bg-transparent outline-none font-['Poppins',sans-serif] text-[14px] text-[#2c638b] placeholder:text-[#2c638b] placeholder:opacity-70"
            />

            {/* Search Icon */}
            <button onClick={handleSearch} className="shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#2c638b"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="absolute left-0 right-0 top-[160px] z-10 px-[24px]">
          <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {PLACE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-all ${
                  activeFilter === filter.id
                    ? 'bg-[#2c638b] text-white shadow-md'
                    : 'bg-white text-[#2c638b] border border-[#2c638b]'
                }`}
              >
                <span className="font-['Poppins',sans-serif] text-[14px] font-medium">
                  {filter.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Map Container - Google Maps */}
        <div 
          id="google-map" 
          className="absolute left-0 right-0 top-[212px] bottom-[90px]"
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
                console.log(`Rendering ${attractions.length} markers`);
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
                Home
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
                Nearby
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
                AI Lens
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
                Profile
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
