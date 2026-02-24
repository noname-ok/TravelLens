import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { Home, MapPin, Camera, User, Wand2, Compass, LocateFixed, Car, PersonStanding, Bike, Bus, ChevronDown, Plus, X, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PlaceDetailSheet from './PlaceDetailSheet';
import TripPlanningModal from './TripPlanningModal';
import { PLACE_FILTERS, Attraction, PlaceDetails, PlaceLocation } from '@/app/types/places';
import { TripItinerary } from '@/app/types/tripPlanning';
import { saveTripToStorage } from '@/app/services/tripPlannerService';

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

function HomeIndicator({ className }: { className?: string }) {
  return (
    <div className={className || ""}>
      <div className="h-[34px] relative w-full">
        <div className="-translate-x-1/2 absolute bg-black dark:bg-white bottom-[8px] h-[5px] left-[calc(50%+0.5px)] rounded-[100px] w-[134px]" />
      </div>
    </div>
  );
}

interface MapViewScreenProps {
  currentScreen: 'home' | 'mapview' | 'ailens' | 'profile';
  onNavigate: (screen: 'home' | 'mapview' | 'ailens' | 'profile') => void;
  onViewTrip?: (trip: TripItinerary) => void;
}

export default function MapViewScreen({ currentScreen, onNavigate, onViewTrip }: MapViewScreenProps) {
  const { t } = useTranslation();
  
  // Tab Management
  const [activeTab, setActiveTab] = useState<'nearby' | 'route'>('nearby');
  
  // Shared Map State
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState<PlaceLocation>({ lat: 11.5564, lng: 104.9282 }); // Phnom Penh default
  const [userLocation, setUserLocation] = useState<PlaceLocation | null>(null);
  
  // Nearby Tab State
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<Attraction | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [activeFilter] = useState('all'); // Keep for compatibility, but not used
  const [searchedPlace, setSearchedPlace] = useState<Attraction | null>(null);
  const [loading, setLoading] = useState(false);
  const [attractionsVisible, setAttractionsVisible] = useState(false);
  const [loadError, setLoadError] = useState<string>('');
  const [isTripPlanningOpen, setIsTripPlanningOpen] = useState(false);
  const [generatedTrip, setGeneratedTrip] = useState<TripItinerary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [selectedPredictionIndex, setSelectedPredictionIndex] = useState(-1);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  
  // Route Tab State
  const [routeOrigin, setRouteOrigin] = useState<PlaceLocation | null>(null);
  const [routeDestination, setRouteDestination] = useState<PlaceLocation | null>(null);
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'>('DRIVING');
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string>('');
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const [routeOriginInput, setRouteOriginInput] = useState('');
  const [routeDestinationInput, setRouteDestinationInput] = useState('');
  const [routeOriginPredictions, setRouteOriginPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [routeDestinationPredictions, setRouteDestinationPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showOriginPredictions, setShowOriginPredictions] = useState(false);
  const [showDestinationPredictions, setShowDestinationPredictions] = useState(false);
  const [selectedOriginIndex, setSelectedOriginIndex] = useState(-1);
  const [selectedDestinationIndex, setSelectedDestinationIndex] = useState(-1);
  const [isRoutePanelCollapsed, setIsRoutePanelCollapsed] = useState(false);
  
  // Waypoints state
  interface Waypoint {
    location: PlaceLocation | null;
    input: string;
    predictions: google.maps.places.AutocompletePrediction[];
    showPredictions: boolean;
    selectedIndex: number;
  }
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{ type: 'origin' | 'waypoint' | 'destination', index?: number } | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{ type: 'origin' | 'waypoint' | 'destination', index?: number } | null>(null);

  const routeLegs = directionsResult?.routes?.[0]?.legs || [];
  const totalDistanceMeters = routeLegs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
  const totalDurationSeconds = routeLegs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);

  const formatDistance = (meters: number): string => {
    if (!meters) return '--';
    const km = meters / 1000;
    if (km < 1) return `${Math.round(meters)} m`;
    return `${km.toFixed(km >= 10 ? 0 : 1)} km`;
  };

  const formatDuration = (seconds: number): string => {
    if (!seconds) return '--';
    const totalMinutes = Math.ceil(seconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr`;
    return `${hours} hr ${minutes} min`;
  };

  const formatEta = (seconds: number): string => {
    if (!seconds) return '--';
    const arrival = new Date(Date.now() + seconds * 1000);
    return arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTravelModeLabel = (mode: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'): string => {
    switch (mode) {
      case 'DRIVING':
        return t('mapView.travelModeDriving');
      case 'WALKING':
        return t('mapView.travelModeWalking');
      case 'BICYCLING':
        return t('mapView.travelModeCycling');
      case 'TRANSIT':
        return t('mapView.travelModeTransit');
      default:
        return mode;
    }
  };

  const openGoogleMapsNavigation = () => {
    if (!routeOrigin || !routeDestination) return;

    const waypointCoordinates = waypoints
      .map((waypoint) => waypoint.location)
      .filter((location): location is PlaceLocation => location !== null)
      .map((location) => `${location.lat},${location.lng}`)
      .join('|');

    const waypointQuery = waypointCoordinates
      ? `&waypoints=${encodeURIComponent(waypointCoordinates)}`
      : '';

    const url = `https://www.google.com/maps/dir/?api=1&origin=${routeOrigin.lat},${routeOrigin.lng}&destination=${routeDestination.lat},${routeDestination.lng}${waypointQuery}&travelmode=${travelMode.toLowerCase()}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
    
    // Initialize directions services for route planning
    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map: null, // Don't bind to map yet, will bind when route tab is active
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#2c638b',
          strokeWeight: 5,
          strokeOpacity: 0.8,
        }
      });
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
    setSelectedPredictionIndex(-1);
    
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
      locationBias: {
        radius: 5000, // 5km radius - prioritize very nearby places
        center: new google.maps.LatLng(currentLoc.lat, currentLoc.lng),
      },
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // Fetch details for each prediction to get coordinates and calculate distance
        const detailsPromises = results.map((prediction) => {
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
          // Sort by distance (closest first) but show all results
          const sorted = predictionsWithDistance
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
    setSelectedPredictionIndex(-1);
    
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

  // Handle search button click or Enter key - select first result
  const handleSearchSubmit = useCallback(() => {
    if (predictions.length > 0) {
      const indexToSelect = selectedPredictionIndex >= 0 ? selectedPredictionIndex : 0;
      handlePredictionSelect(predictions[indexToSelect]);
    }
  }, [predictions, selectedPredictionIndex, handlePredictionSelect]);

  // Handle keyboard navigation for search
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPredictions || predictions.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedPredictionIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedPredictionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        handleSearchSubmit();
        break;
      case 'Escape':
        setShowPredictions(false);
        setSelectedPredictionIndex(-1);
        break;
    }
  }, [showPredictions, predictions, selectedPredictionIndex, handleSearchSubmit]);

  // Route input handlers with autocomplete
  const handleRouteOriginInput = useCallback((value: string) => {
    setRouteOriginInput(value);
    setSelectedOriginIndex(-1);
    
    if (!autocompleteServiceRef.current || value.trim().length < 2) {
      setRouteOriginPredictions([]);
      setShowOriginPredictions(false);
      return;
    }

    const currentLoc = userLocation || center;
    const request: google.maps.places.AutocompletionRequest = {
      input: value,
      locationBias: {
        radius: 5000,
        center: new google.maps.LatLng(currentLoc.lat, currentLoc.lng),
      },
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setRouteOriginPredictions(predictions);
          setShowOriginPredictions(true);
        } else {
          setRouteOriginPredictions([]);
          setShowOriginPredictions(false);
        }
      }
    );
  }, [userLocation, center]);

  const handleRouteDestinationInput = useCallback((value: string) => {
    setRouteDestinationInput(value);
    setSelectedDestinationIndex(-1);
    
    if (!autocompleteServiceRef.current || value.trim().length < 2) {
      setRouteDestinationPredictions([]);
      setShowDestinationPredictions(false);
      return;
    }

    const currentLoc = userLocation || center;
    const request: google.maps.places.AutocompletionRequest = {
      input: value,
      locationBias: {
        radius: 5000,
        center: new google.maps.LatLng(currentLoc.lat, currentLoc.lng),
      },
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setRouteDestinationPredictions(predictions);
          setShowDestinationPredictions(true);
        } else {
          setRouteDestinationPredictions([]);
          setShowDestinationPredictions(false);
        }
      }
    );
  }, [userLocation, center]);

  const handleRouteOriginSelect = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;
    
    setRouteOriginInput(prediction.description);
    setShowOriginPredictions(false);
    setRouteOriginPredictions([]);
    setSelectedOriginIndex(-1);
    
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          setRouteOrigin({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      }
    );
  }, []);

  const handleRouteDestinationSelect = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;
    
    setRouteDestinationInput(prediction.description);
    setShowDestinationPredictions(false);
    setRouteDestinationPredictions([]);
    setSelectedDestinationIndex(-1);
    
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          setRouteDestination({
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          });
        }
      }
    );
  }, []);

  // Waypoint handlers
  const addWaypoint = useCallback(() => {
    setWaypoints(prev => [...prev, {
      location: null,
      input: '',
      predictions: [],
      showPredictions: false,
      selectedIndex: -1
    }]);
  }, []);

  const removeWaypoint = useCallback((index: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleWaypointInput = useCallback((index: number, value: string) => {
    setWaypoints(prev => {
      const updated = [...prev];
      updated[index].input = value;
      updated[index].selectedIndex = -1;
      return updated;
    });

    if (!autocompleteServiceRef.current || value.trim().length < 2) {
      setWaypoints(prev => {
        const updated = [...prev];
        updated[index].predictions = [];
        updated[index].showPredictions = false;
        return updated;
      });
      return;
    }

    const currentLoc = userLocation || center;
    const request: google.maps.places.AutocompletionRequest = {
      input: value,
      locationBias: {
        radius: 5000,
        center: new google.maps.LatLng(currentLoc.lat, currentLoc.lng),
      },
    };

    autocompleteServiceRef.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setWaypoints(prev => {
            const updated = [...prev];
            updated[index].predictions = predictions;
            updated[index].showPredictions = true;
            return updated;
          });
        }
      }
    );
  }, [userLocation, center]);

  const handleWaypointSelect = useCallback((index: number, prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesServiceRef.current) return;

    setWaypoints(prev => {
      const updated = [...prev];
      updated[index].input = prediction.description;
      updated[index].showPredictions = false;
      updated[index].predictions = [];
      updated[index].selectedIndex = -1;
      return updated;
    });

    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ['geometry'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const location = place.geometry.location;
          setWaypoints(prev => {
            const updated = [...prev];
            updated[index].location = {
              lat: location.lat(),
              lng: location.lng(),
            };
            return updated;
          });
        }
      }
    );
  }, []);

  // Keyboard handlers for Route tab inputs
  const handleOriginKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showOriginPredictions || routeOriginPredictions.length === 0) {
      if (e.key === 'Enter' && routeOriginPredictions.length > 0) {
        const indexToSelect = selectedOriginIndex >= 0 ? selectedOriginIndex : 0;
        handleRouteOriginSelect(routeOriginPredictions[indexToSelect]);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedOriginIndex(prev => 
          prev < routeOriginPredictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedOriginIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        const indexToSelect = selectedOriginIndex >= 0 ? selectedOriginIndex : 0;
        if (routeOriginPredictions[indexToSelect]) {
          handleRouteOriginSelect(routeOriginPredictions[indexToSelect]);
        }
        break;
      case 'Escape':
        setShowOriginPredictions(false);
        setSelectedOriginIndex(-1);
        break;
    }
  }, [showOriginPredictions, routeOriginPredictions, selectedOriginIndex, handleRouteOriginSelect]);

  const handleDestinationKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDestinationPredictions || routeDestinationPredictions.length === 0) {
      if (e.key === 'Enter' && routeDestinationPredictions.length > 0) {
        const indexToSelect = selectedDestinationIndex >= 0 ? selectedDestinationIndex : 0;
        handleRouteDestinationSelect(routeDestinationPredictions[indexToSelect]);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedDestinationIndex(prev => 
          prev < routeDestinationPredictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedDestinationIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        const indexToSelect = selectedDestinationIndex >= 0 ? selectedDestinationIndex : 0;
        if (routeDestinationPredictions[indexToSelect]) {
          handleRouteDestinationSelect(routeDestinationPredictions[indexToSelect]);
        }
        break;
      case 'Escape':
        setShowDestinationPredictions(false);
        setSelectedDestinationIndex(-1);
        break;
    }
  }, [showDestinationPredictions, routeDestinationPredictions, selectedDestinationIndex, handleRouteDestinationSelect]);

  const handleWaypointKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const waypoint = waypoints[index];
    if (!waypoint.showPredictions || waypoint.predictions.length === 0) {
      if (e.key === 'Enter' && waypoint.predictions.length > 0) {
        const indexToSelect = waypoint.selectedIndex >= 0 ? waypoint.selectedIndex : 0;
        handleWaypointSelect(index, waypoint.predictions[indexToSelect]);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setWaypoints(prev => {
          const updated = [...prev];
          updated[index].selectedIndex = 
            updated[index].selectedIndex < updated[index].predictions.length - 1
              ? updated[index].selectedIndex + 1
              : updated[index].selectedIndex;
          return updated;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setWaypoints(prev => {
          const updated = [...prev];
          updated[index].selectedIndex = 
            updated[index].selectedIndex > 0 ? updated[index].selectedIndex - 1 : -1;
          return updated;
        });
        break;
      case 'Enter':
        e.preventDefault();
        const indexToSelect = waypoint.selectedIndex >= 0 ? waypoint.selectedIndex : 0;
        if (waypoint.predictions[indexToSelect]) {
          handleWaypointSelect(index, waypoint.predictions[indexToSelect]);
        }
        break;
      case 'Escape':
        setWaypoints(prev => {
          const updated = [...prev];
          updated[index].showPredictions = false;
          updated[index].selectedIndex = -1;
          return updated;
        });
        break;
    }
  }, [waypoints, handleWaypointSelect]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, type: 'origin' | 'waypoint' | 'destination', index?: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, index }));
    setDraggedItem({ type, index });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, type: 'origin' | 'waypoint' | 'destination', index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem({ type, index });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropType: 'origin' | 'waypoint' | 'destination', dropIndex?: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    const { type: dragType, index: dragIndex } = draggedItem;

    // If dropping on the same position, do nothing
    if (dragType === dropType && dragIndex === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Get the dragged item's data
    let draggedData: { location: PlaceLocation | null; input: string } | null = null;
    
    if (dragType === 'origin') {
      draggedData = { location: routeOrigin, input: routeOriginInput };
    } else if (dragType === 'destination') {
      draggedData = { location: routeDestination, input: routeDestinationInput };
    } else if (dragType === 'waypoint' && dragIndex !== undefined) {
      const waypoint = waypoints[dragIndex];
      draggedData = { location: waypoint.location, input: waypoint.input };
    }

    if (!draggedData) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Handle different drop scenarios
    if (dropType === 'origin') {
      // Something is being dropped on origin position
      const currentOrigin = { location: routeOrigin, input: routeOriginInput };
      
      setRouteOrigin(draggedData.location);
      setRouteOriginInput(draggedData.input);

      if (dragType === 'destination') {
        // Swap origin and destination
        setRouteDestination(currentOrigin.location);
        setRouteDestinationInput(currentOrigin.input);
      } else if (dragType === 'waypoint' && dragIndex !== undefined) {
        // Move waypoint to origin, push current origin to waypoints
        const newWaypoints = [...waypoints];
        newWaypoints.splice(dragIndex, 1);
        newWaypoints.unshift({
          location: currentOrigin.location,
          input: currentOrigin.input,
          predictions: [],
          showPredictions: false,
          selectedIndex: -1
        });
        setWaypoints(newWaypoints);
      }
    } else if (dropType === 'destination') {
      // Something is being dropped on destination position
      const currentDestination = { location: routeDestination, input: routeDestinationInput };
      
      setRouteDestination(draggedData.location);
      setRouteDestinationInput(draggedData.input);

      if (dragType === 'origin') {
        // Swap origin and destination
        setRouteOrigin(currentDestination.location);
        setRouteOriginInput(currentDestination.input);
      } else if (dragType === 'waypoint' && dragIndex !== undefined) {
        // Move waypoint to destination, push current destination to waypoints
        const newWaypoints = [...waypoints];
        newWaypoints.splice(dragIndex, 1);
        newWaypoints.push({
          location: currentDestination.location,
          input: currentDestination.input,
          predictions: [],
          showPredictions: false,
          selectedIndex: -1
        });
        setWaypoints(newWaypoints);
      }
    } else if (dropType === 'waypoint' && dropIndex !== undefined) {
      // Something is being dropped on a waypoint position
      const newWaypoints = [...waypoints];
      
      if (dragType === 'waypoint' && dragIndex !== undefined) {
        // Reorder waypoints
        const [removed] = newWaypoints.splice(dragIndex, 1);
        newWaypoints.splice(dropIndex, 0, removed);
      } else if (dragType === 'origin') {
        // Move origin to waypoint position
        const currentOrigin = newWaypoints[0] || { location: null, input: '', predictions: [], showPredictions: false, selectedIndex: -1 };
        setRouteOrigin(currentOrigin.location);
        setRouteOriginInput(currentOrigin.input);
        
        newWaypoints.splice(0, 1);
        newWaypoints.splice(dropIndex, 0, {
          location: draggedData.location,
          input: draggedData.input,
          predictions: [],
          showPredictions: false,
          selectedIndex: -1
        });
      } else if (dragType === 'destination') {
        // Move destination to waypoint position
        newWaypoints.splice(dropIndex, 0, {
          location: draggedData.location,
          input: draggedData.input,
          predictions: [],
          showPredictions: false,
          selectedIndex: -1
        });
        
        // Set the last waypoint as the new destination
        const lastWaypoint = newWaypoints[newWaypoints.length - 1];
        if (lastWaypoint) {
          setRouteDestination(lastWaypoint.location);
          setRouteDestinationInput(lastWaypoint.input);
          newWaypoints.pop();
        }
      }
      
      setWaypoints(newWaypoints);
    }

    setDraggedItem(null);
    setDragOverItem(null);
  }, [draggedItem, routeOrigin, routeOriginInput, routeDestination, routeDestinationInput, waypoints]);

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
    setAttractionsVisible(true);
  }, [searchedPlace, userLocation, center, map, searchNearbyPlaces]);

  // Toggle nearby attractions visibility
  const toggleNearbyAttractions = useCallback(() => {
    if (attractionsVisible) {
      // Hide attractions
      setAttractions([]);
      setSelectedAttraction(null);
      setAttractionsVisible(false);
    } else {
      // Show attractions
      searchTouristDestinations();
    }
  }, [attractionsVisible, searchTouristDestinations]);

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

  // Set user location as default origin for route planning
  useEffect(() => {
    if (activeTab === 'route' && userLocation && !routeOrigin) {
      setRouteOrigin(userLocation);
      setRouteOriginInput(t('mapView.myLocation'));
    }
  }, [activeTab, userLocation, routeOrigin, t]);

  // Bind/unbind DirectionsRenderer based on active tab
  useEffect(() => {
    if (!map || !directionsRendererRef.current) return;
    
    if (activeTab === 'route') {
      // Bind renderer to map for route tab
      directionsRendererRef.current.setMap(map);
    } else {
      // Unbind renderer when in nearby tab
      directionsRendererRef.current.setMap(null);
      // Clear directions result
      setDirectionsResult(null);
    }
  }, [activeTab, map]);

  // Calculate route when inputs change
  useEffect(() => {
    if (activeTab !== 'route' || !routeOrigin || !routeDestination || !directionsServiceRef.current || !directionsRendererRef.current) {
      return;
    }

    setRouteLoading(true);
    setRouteError('');

    // Build waypoints array from valid waypoint locations
    const waypointsForRequest: google.maps.DirectionsWaypoint[] = waypoints
      .filter(wp => wp.location !== null)
      .map(wp => ({
        location: new google.maps.LatLng(wp.location!.lat, wp.location!.lng),
        stopover: true
      }));

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(routeOrigin.lat, routeOrigin.lng),
      destination: new google.maps.LatLng(routeDestination.lat, routeDestination.lng),
      waypoints: waypointsForRequest.length > 0 ? waypointsForRequest : undefined,
      travelMode: travelMode as google.maps.TravelMode,
    };

    directionsServiceRef.current.route(request, (result, status) => {
      setRouteLoading(false);
      
      if (status === google.maps.DirectionsStatus.OK && result) {
        setDirectionsResult(result);
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections(result);
        }
      } else {
        console.error('Directions request failed:', status);
        setRouteError(t('mapView.noRouteFound'));
        setDirectionsResult(null);
      }
    });
  }, [activeTab, routeOrigin, routeDestination, waypoints, travelMode, t]);

  return (
    <div className="bg-white dark:bg-gray-900 relative size-full">
      <div className="relative mx-auto w-full max-w-[390px] h-full">
        {/* Header */}
        <div className="absolute left-[24px] top-[25px]">
          <h1 className="font-['Poppins',sans-serif] font-semibold text-[24px] text-black dark:text-white leading-[32px]">
            {t('mapView.title')}
          </h1>
        </div>

        {/* Tabs */}
        <div className="absolute left-[24px] right-[24px] top-[65px]">
          <div className="relative flex gap-2">
            <button
              onClick={() => setActiveTab('nearby')}
              className={`flex-1 py-2 text-center font-['Poppins',sans-serif] text-[14px] font-medium transition-all ${
                activeTab === 'nearby'
                  ? 'text-[#2c638b] dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {t('mapView.nearby')}
            </button>
            <button
              onClick={() => setActiveTab('route')}
              className={`flex-1 py-2 text-center font-['Poppins',sans-serif] text-[14px] font-medium transition-all ${
                activeTab === 'route'
                  ? 'text-[#2c638b] dark:text-blue-400'
                  : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {t('mapView.route')}
            </button>
          </div>
          {/* Tab Indicator */}
          <div
            className="h-[3px] bg-[#2c638b] dark:bg-blue-400 rounded-full transition-all duration-200 absolute left-[-24px]"
            style={{
              width: 'calc(50% + 24px)',
              transform: `translateX(${activeTab === 'route' ? '100%' : '0'})`
            }}
          />
        </div>



        {/* Map Container - Google Maps */}
        <div 
          id="google-map" 
          className={`absolute left-0 right-0 top-[105px] bottom-[90px]`}
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
            {/* Nearby Tab - Search Bar */}
            {activeTab === 'nearby' && (
              <div className="absolute left-[20px] top-[10px] right-[23px] z-10">
                <div className="bg-[#f5f5f5] dark:bg-gray-800 flex items-center h-[40px] rounded-[12px] px-[16px] gap-[12px] shadow-sm relative">
                  {/* Autocomplete Search Input */}
                  <div className="flex-1 relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={() => {
                        if (predictions.length > 0) setShowPredictions(true);
                      }}
                      onBlur={() => {
                        // Delay to allow click on prediction
                        setTimeout(() => {
                          setShowPredictions(false);
                          setSelectedPredictionIndex(-1);
                        }, 200);
                      }}
                      placeholder="Search here..."
                      className="w-full bg-transparent outline-none font-['Poppins',sans-serif] text-[14px] text-[#2c638b] dark:text-white placeholder:text-[#2c638b] dark:placeholder:text-gray-400 placeholder:opacity-70"
                      onClick={(e) => {
                        // Select all text on click if there's content
                        const input = e.currentTarget;
                        if (input.value) {
                          setTimeout(() => input.select(), 0);
                        }
                      }}
                    />
                  </div>

                  {/* Search Icon */}
                  <button 
                    onClick={handleSearchSubmit}
                    className="shrink-0 hover:opacity-70 transition"
                    type="button"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#2c638b"/>
                    </svg>
                  </button>

                  {/* Custom Dropdown for Predictions - Positioned to match full search bar width */}
                  {showPredictions && predictions.length > 0 && (
                    <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-50">
                      {predictions.map((prediction, index) => (
                        <button
                          key={prediction.place_id}
                          onClick={() => handlePredictionSelect(prediction)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition ${
                            index === selectedPredictionIndex
                              ? 'bg-gray-100 dark:bg-gray-700'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}>
                          <div className="flex items-start gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
                              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#2c638b" className="dark:fill-blue-400"/>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="font-['Poppins',sans-serif] text-[14px] text-black dark:text-white font-medium truncate">
                                {prediction.structured_formatting.main_text}
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[12px] text-gray-500 dark:text-gray-400 truncate">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Route Tab - Control Panel */}
            {activeTab === 'route' && (
              <div className="absolute left-[20px] top-[10px] right-[23px] z-10">
                <div className={`bg-white dark:bg-gray-800 rounded-[16px] shadow-lg transition-all duration-300 ${
                  isRoutePanelCollapsed ? 'p-2' : 'p-4'
                } ${
                  isRoutePanelCollapsed ? '' : 'max-h-[calc(100vh-235px)] overflow-y-auto'
                }`}>
                  
                  {/* Collapsed State - Compact Header */}
                  {isRoutePanelCollapsed && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[13px] font-['Poppins',sans-serif] font-medium text-gray-600 dark:text-gray-300 pl-2">
                          Route controls
                        </p>
                        <button
                          onClick={() => setIsRoutePanelCollapsed(false)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                          title="Expand panel"
                        >
                          <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                      <div className="bg-[#f5f5f5] dark:bg-gray-700 rounded-[10px] px-3 py-2">
                        <p className="text-[11px] font-['Poppins',sans-serif] text-gray-500 dark:text-gray-400">
                          Travel Mode: <span className="font-medium text-[#2c638b] dark:text-blue-400">{getTravelModeLabel(travelMode)}</span>
                        </p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div className="text-center">
                            <p className="text-[10px] text-gray-500 font-['Poppins',sans-serif]">Distance</p>
                            <p className="text-[12px] font-semibold text-[#2c638b] dark:text-blue-400 font-['Poppins',sans-serif]">{formatDistance(totalDistanceMeters)}</p>
                          </div>
                          <div className="text-center border-x border-[rgba(0,0,0,0.08)] dark:border-gray-600">
                            <p className="text-[10px] text-gray-500 font-['Poppins',sans-serif]">Duration</p>
                            <p className="text-[12px] font-semibold text-[#2c638b] dark:text-blue-400 font-['Poppins',sans-serif]">{formatDuration(totalDurationSeconds)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-[10px] text-gray-500 font-['Poppins',sans-serif]">ETA</p>
                            <p className="text-[12px] font-semibold text-[#2c638b] dark:text-blue-400 font-['Poppins',sans-serif]">{formatEta(totalDurationSeconds)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded State - Full Panel */}
                  {!isRoutePanelCollapsed && (
                    <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-['Poppins',sans-serif] font-semibold text-[#2c638b] dark:text-blue-400 pl-2">
                      Route controls
                    </p>
                    <button
                      onClick={() => setIsRoutePanelCollapsed(true)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                      title="Collapse panel"
                    >
                      <ChevronDown size={20} className="text-gray-600 dark:text-gray-400 rotate-180" />
                    </button>
                  </div>

                  {/* Origin Input */}
                  <div className="space-y-1 relative">
                    <label className="text-[12px] font-['Poppins',sans-serif] text-gray-600 dark:text-gray-400">
                      {t('mapView.origin')}
                    </label>
                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'origin')}
                      onDragOver={(e) => handleDragOver(e, 'origin')}
                      onDrop={(e) => handleDrop(e, 'origin')}
                      onDragEnd={handleDragEnd}
                      className={`bg-[#f5f5f5] dark:bg-gray-700 rounded-[12px] px-3 py-2 flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing ${
                        draggedItem?.type === 'origin' ? 'opacity-50' : ''
                      } ${
                        dragOverItem?.type === 'origin' && draggedItem?.type !== 'origin' 
                          ? 'border-2 border-blue-500' 
                          : ''
                      }`}
                    >
                      <GripVertical size={16} className="text-gray-400 cursor-move" />
                      <MapPin size={16} className="text-[#2c638b] dark:text-blue-400" />
                      <input
                        type="text"
                        value={routeOriginInput}
                        onChange={(e) => handleRouteOriginInput(e.target.value)}
                        onKeyDown={handleOriginKeyDown}
                        onFocus={() => {
                          if (routeOriginPredictions.length > 0) setShowOriginPredictions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowOriginPredictions(false);
                            setSelectedOriginIndex(-1);
                          }, 200);
                        }}
                        placeholder={t('mapView.myLocation')}
                        className="flex-1 bg-transparent outline-none text-[14px] font-['Poppins',sans-serif] text-black dark:text-white placeholder:text-gray-400 cursor-text"
                        draggable={false}
                      />
                    </div>
                    
                    {/* Origin Predictions Dropdown */}
                    {showOriginPredictions && routeOriginPredictions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                        {routeOriginPredictions.map((prediction, index) => (
                          <button
                            key={prediction.place_id}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleRouteOriginSelect(prediction);
                            }}
                            className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition ${
                              index === selectedOriginIndex
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <p className="font-['Poppins',sans-serif] text-[13px] text-black dark:text-white font-medium truncate">
                              {prediction.structured_formatting.main_text}
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {prediction.structured_formatting.secondary_text}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Waypoints */}
                  {waypoints.map((waypoint, index) => (
                    <div key={index} className="space-y-1 relative">
                      <div className="flex items-center justify-between">
                        <label className="text-[12px] font-['Poppins',sans-serif] text-gray-600 dark:text-gray-400">
                          {t('mapView.waypoint')} {index + 1}
                        </label>
                        <button
                          onClick={() => removeWaypoint(index)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title={t('mapView.removeStop')}
                        >
                          <X size={14} className="text-red-500" />
                        </button>
                      </div>
                      <div 
                        draggable
                        onDragStart={(e) => handleDragStart(e, 'waypoint', index)}
                        onDragOver={(e) => handleDragOver(e, 'waypoint', index)}
                        onDrop={(e) => handleDrop(e, 'waypoint', index)}
                        onDragEnd={handleDragEnd}
                        className={`bg-[#f5f5f5] dark:bg-gray-700 rounded-[12px] px-3 py-2 flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing ${
                          draggedItem?.type === 'waypoint' && draggedItem?.index === index ? 'opacity-50' : ''
                        } ${
                          dragOverItem?.type === 'waypoint' && dragOverItem?.index === index && 
                          !(draggedItem?.type === 'waypoint' && draggedItem?.index === index)
                            ? 'border-2 border-blue-500' 
                            : ''
                        }`}
                      >
                        <GripVertical size={16} className="text-gray-400 cursor-move" />
                        <MapPin size={16} className="text-orange-500" />
                        <input
                          type="text"
                          value={waypoint.input}
                          onChange={(e) => handleWaypointInput(index, e.target.value)}
                          onKeyDown={(e) => handleWaypointKeyDown(index, e)}
                          onFocus={() => {
                            if (waypoint.predictions.length > 0) {
                              setWaypoints(prev => {
                                const updated = [...prev];
                                updated[index].showPredictions = true;
                                return updated;
                              });
                            }
                          }}
                          onBlur={() => setTimeout(() => {
                            setWaypoints(prev => {
                              const updated = [...prev];
                              updated[index].showPredictions = false;
                              updated[index].selectedIndex = -1;
                              return updated;
                            });
                          }, 200)}
                          placeholder={`${t('mapView.waypoint')} ${index + 1}`}
                          className="flex-1 bg-transparent outline-none text-[14px] font-['Poppins',sans-serif] text-black dark:text-white placeholder:text-gray-400 cursor-text"
                          draggable={false}
                        />
                      </div>
                      
                      {/* Waypoint Predictions Dropdown */}
                      {waypoint.showPredictions && waypoint.predictions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                          {waypoint.predictions.map((prediction, predIndex) => (
                            <button
                              key={prediction.place_id}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleWaypointSelect(index, prediction);
                              }}
                              className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition ${
                                predIndex === waypoint.selectedIndex
                                  ? 'bg-gray-100 dark:bg-gray-700'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              <p className="font-['Poppins',sans-serif] text-[13px] text-black dark:text-white font-medium truncate">
                                {prediction.structured_formatting.main_text}
                              </p>
                              <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {prediction.structured_formatting.secondary_text}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Destination Input */}
                  <div className="space-y-1 relative">
                    <label className="text-[12px] font-['Poppins',sans-serif] text-gray-600 dark:text-gray-400">
                      {t('mapView.destination')}
                    </label>
                    <div 
                      draggable
                      onDragStart={(e) => handleDragStart(e, 'destination')}
                      onDragOver={(e) => handleDragOver(e, 'destination')}
                      onDrop={(e) => handleDrop(e, 'destination')}
                      onDragEnd={handleDragEnd}
                      className={`bg-[#f5f5f5] dark:bg-gray-700 rounded-[12px] px-3 py-2 flex items-center gap-2 transition-all cursor-grab active:cursor-grabbing ${
                        draggedItem?.type === 'destination' ? 'opacity-50' : ''
                      } ${
                        dragOverItem?.type === 'destination' && draggedItem?.type !== 'destination' 
                          ? 'border-2 border-blue-500' 
                          : ''
                      }`}
                    >
                      <GripVertical size={16} className="text-gray-400 cursor-move" />
                      <MapPin size={16} className="text-red-500" />
                      <input
                        type="text"
                        value={routeDestinationInput}
                        onChange={(e) => handleRouteDestinationInput(e.target.value)}
                        onKeyDown={handleDestinationKeyDown}
                        onFocus={() => {
                          if (routeDestinationPredictions.length > 0) setShowDestinationPredictions(true);
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowDestinationPredictions(false);
                            setSelectedDestinationIndex(-1);
                          }, 200);
                        }}
                        placeholder={t('mapView.selectDestination')}
                        className="flex-1 bg-transparent outline-none text-[14px] font-['Poppins',sans-serif] text-black dark:text-white placeholder:text-gray-400 cursor-text"
                        draggable={false}
                      />
                    </div>
                    
                    {/* Destination Predictions Dropdown */}
                    {showDestinationPredictions && routeDestinationPredictions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-50">
                        {routeDestinationPredictions.map((prediction, index) => (
                          <button
                            key={prediction.place_id}
                            onMouseDown={(event) => {
                              event.preventDefault();
                              handleRouteDestinationSelect(prediction);
                            }}
                            className={`w-full text-left px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition ${
                              index === selectedDestinationIndex
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            <p className="font-['Poppins',sans-serif] text-[13px] text-black dark:text-white font-medium truncate">
                              {prediction.structured_formatting.main_text}
                            </p>
                            <p className="font-['Poppins',sans-serif] text-[11px] text-gray-500 dark:text-gray-400 truncate">
                              {prediction.structured_formatting.secondary_text}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Stop Button */}
                  <button
                    onClick={addWaypoint}
                    className="w-full py-2 px-3 bg-blue-50 dark:bg-blue-900/20 text-[#2c638b] dark:text-blue-400 rounded-[12px] text-[13px] font-['Poppins',sans-serif] font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    {t('mapView.addStop')}
                  </button>

                  {/* Travel Mode Selector */}
                  <div className="space-y-2">
                    <label className="text-[12px] font-['Poppins',sans-serif] text-gray-600 dark:text-gray-400">
                      Travel Mode
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => setTravelMode('DRIVING')}
                        className={`p-2 rounded-[10px] flex flex-col items-center gap-1 transition ${
                          travelMode === 'DRIVING'
                            ? 'bg-[#2c638b] dark:bg-blue-600 text-white'
                            : 'bg-[#f5f5f5] dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Car size={20} />
                        <span className="text-[10px] font-['Poppins',sans-serif]">{t('mapView.travelModeDriving')}</span>
                      </button>
                      <button
                        onClick={() => setTravelMode('WALKING')}
                        className={`p-2 rounded-[10px] flex flex-col items-center gap-1 transition ${
                          travelMode === 'WALKING'
                            ? 'bg-[#2c638b] dark:bg-blue-600 text-white'
                            : 'bg-[#f5f5f5] dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <PersonStanding size={20} />
                        <span className="text-[10px] font-['Poppins',sans-serif]">{t('mapView.travelModeWalking')}</span>
                      </button>
                      <button
                        onClick={() => setTravelMode('BICYCLING')}
                        className={`p-2 rounded-[10px] flex flex-col items-center gap-1 transition ${
                          travelMode === 'BICYCLING'
                            ? 'bg-[#2c638b] dark:bg-blue-600 text-white'
                            : 'bg-[#f5f5f5] dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Bike size={20} />
                        <span className="text-[10px] font-['Poppins',sans-serif]">{t('mapView.travelModeCycling')}</span>
                      </button>
                      <button
                        onClick={() => setTravelMode('TRANSIT')}
                        className={`p-2 rounded-[10px] flex flex-col items-center gap-1 transition ${
                          travelMode === 'TRANSIT'
                            ? 'bg-[#2c638b] dark:bg-blue-600 text-white'
                            : 'bg-[#f5f5f5] dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Bus size={20} />
                        <span className="text-[10px] font-['Poppins',sans-serif]">{t('mapView.travelModeTransit')}</span>
                      </button>
                    </div>
                  </div>

                  {directionsResult && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 font-['Poppins',sans-serif]">Distance</p>
                          <p className="text-[13px] font-semibold text-[#2c638b] dark:text-blue-400 font-['Poppins',sans-serif]">{formatDistance(totalDistanceMeters)}</p>
                        </div>
                        <div className="text-center border-x border-[rgba(0,0,0,0.08)] dark:border-gray-600">
                          <p className="text-[10px] text-gray-500 font-['Poppins',sans-serif]">Duration</p>
                          <p className="text-[13px] font-semibold text-[#2c638b] dark:text-blue-400 font-['Poppins',sans-serif]">{formatDuration(totalDurationSeconds)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-gray-500 font-['Poppins',sans-serif]">ETA</p>
                          <p className="text-[13px] font-semibold text-[#2c638b] dark:text-blue-400 font-['Poppins',sans-serif]">{formatEta(totalDurationSeconds)}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsRoutePanelCollapsed(true)}
                        className="w-full bg-[#5b9fd9] dark:bg-blue-500 text-white py-2.5 rounded-[10px] text-[14px] font-['Poppins',sans-serif] font-semibold hover:bg-[#4a8bc2] dark:hover:bg-blue-600 transition"
                      >
                        Show the Route
                      </button>

                      <button
                        onClick={openGoogleMapsNavigation}
                        disabled={!routeOrigin || !routeDestination}
                        className="w-full bg-gradient-to-r from-[#2c638b] to-[#1e4d6a] text-white py-2.5 rounded-[10px] text-[14px] font-['Poppins',sans-serif] font-semibold hover:from-[#235070] hover:to-[#17394d] transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Start Navigation in Google Maps
                      </button>
                    </div>
                  )}

                  {routeLoading && (
                    <div className="text-center py-2">
                      <p className="text-[12px] font-['Poppins',sans-serif] text-gray-500 dark:text-gray-400">
                        {t('mapView.calculating')}
                      </p>
                    </div>
                  )}

                  {routeError && (
                    <div className="text-center py-2">
                      <p className="text-[12px] font-['Poppins',sans-serif] text-red-500">
                        {routeError}
                      </p>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              </div>
            )}


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
              {/* Nearby Tab - Markers and InfoWindows */}
              {activeTab === 'nearby' && (
                <>
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
                </>
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
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg z-20">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c638b] dark:border-blue-400"></div>
              <span className="font-['Poppins',sans-serif] text-[14px] text-black dark:text-white">Loading...</span>
            </div>
          </div>
        )}

        {/* Trip Planning Button - Route tab only */}
        {activeTab === 'route' && (
          <div className="absolute bottom-[30px] left-[24px] z-0">
            {generatedTrip ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onViewTrip && generatedTrip) {
                      onViewTrip(generatedTrip);
                    }
                  }}
                  className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2c638b] to-[#1e4d6a] hover:from-[#1e4d6a] hover:to-[#152a3a] text-white px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] font-semibold text-[14px] shadow-md transition-all"
                >
                  <Wand2 size={18} />
                  View Itinerary
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('This will delete your current itinerary and create a new one. Continue?')) {
                      setGeneratedTrip(null);
                      setIsTripPlanningOpen(true);
                    }
                  }}
                  className="px-4 py-3 bg-white border-2 border-[#2c638b] text-[#2c638b] rounded-[12px] font-['Poppins',sans-serif] font-semibold text-[14px] hover:bg-blue-50 transition-all"
                >
                  Replan
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsTripPlanningOpen(true)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#2c638b] to-[#1e4d6a] hover:from-[#1e4d6a] hover:to-[#152a3a] text-white px-4 py-3 rounded-[12px] font-['Poppins',sans-serif] font-semibold text-[14px] shadow-md transition-all"
              >
                <Wand2 size={18} />
                Plan Your Trip
              </button>
            )}
          </div>
        )}

        {/* Floating Action Buttons - Nearby Tab Only */}
        {activeTab === 'nearby' && (
          <div className="absolute bottom-[30px] left-[24px] z-20 flex gap-3">
            {/* View Nearby Button */}
            <button
              onClick={toggleNearbyAttractions}
              disabled={!map || loading}
              className="bg-[#2c638b] text-white rounded-full shadow-lg hover:bg-[#234d6a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-5 py-3"
              title={attractionsVisible ? "Hide nearby attractions" : "View nearby tourist attractions"}
            >
              <Compass size={20} strokeWidth={2.5} />
              <span className="font-['Poppins',sans-serif] text-[14px] font-medium">
                {attractionsVisible ? 'Hide Attractions' : t('mapView.nearbyAttractions')}
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
        )}
      </div>

        {/* Place Detail Sheet - Nearby Tab Only */}
        {activeTab === 'nearby' && selectedPlace && (
          <PlaceDetailSheet
            place={selectedPlace}
            onClose={() => {
              setSelectedPlace(null);
              setSelectedAttraction(null);
            }}
          />
        )}

        {/* Trip Planning Modal */}
        <TripPlanningModal
          isOpen={isTripPlanningOpen}
          onClose={() => setIsTripPlanningOpen(false)}
          userLocation={userLocation}
          map={map}
          onTripGenerated={(trip) => {
            saveTripToStorage(trip);
            setGeneratedTrip(trip);
            setIsTripPlanningOpen(false);
          }}
        />

        {/* Bottom Navigation */}
        <div className="absolute left-0 right-0 bottom-0 h-[90px]">
          {/* Divider */}
          <div className="h-px w-full bg-[rgba(0,0,0,0.1)] dark:bg-gray-700" />
          
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
                className={currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'home' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
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
                className={currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'mapview' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
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
                className={currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'ailens' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
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
                className={currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'}
                strokeWidth={2}
              />
              <p className={`font-['Inter',sans-serif] font-normal text-[12px] leading-[22px] text-center tracking-[-0.408px] ${
                currentScreen === 'profile' ? 'text-[#2c638b]' : 'text-[rgba(0,0,0,0.4)] dark:text-gray-400'
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
