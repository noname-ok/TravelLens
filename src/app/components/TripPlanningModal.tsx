import { useState, useEffect, useRef } from 'react';
import { X, Search, Loader, MapPin } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { TRIP_PREFERENCES, PlaceSearchResult, PlaceLocation, TripItinerary } from '@/app/types/tripPlanning';
import { generateTripFromPlaces, generateTripFromPreferences } from '@/app/services/tripPlannerService';

interface TripPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: PlaceLocation | null;
  map: google.maps.Map | null;
  onTripGenerated: (trip: TripItinerary) => void;
}

export default function TripPlanningModal({
  isOpen,
  onClose,
  userLocation,
  map,
  onTripGenerated,
}: TripPlanningModalProps) {
  const [step, setStep] = useState<'mode' | 'custom' | 'preference' | 'generating'>('mode');
  const [mode, setMode] = useState<'custom' | 'preference' | null>(null);

  // Custom mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Preference mode state
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [destinationLocation, setDestinationLocation] = useState('');

  // Common state
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle place search
  const handleSearchPlaces = (query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || !map) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    searchTimeoutRef.current = setTimeout(() => {
      const service = new google.maps.places.PlacesService(map);
      const request = {
        query: query,
        fields: ['name', 'geometry', 'place_id', 'formatted_address', 'rating', 'types'],
      };

      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places: PlaceSearchResult[] = results
            .filter((place) => place.geometry?.location)
            .slice(0, 5)
            .map((place) => ({
              placeId: place.place_id!,
              name: place.name!,
              address: place.formatted_address || 'Unknown address',
              rating: place.rating || 0,
              position: {
                lat: place.geometry!.location!.lat(),
                lng: place.geometry!.location!.lng(),
              },
              types: place.types || [],
            }));
          setSearchResults(places);
        }
        setSearching(false);
      });
    }, 500);
  };

  const handleAddPlace = (place: PlaceSearchResult) => {
    if (!selectedPlaces.find((p) => p.placeId === place.placeId)) {
      setSelectedPlaces([...selectedPlaces, place]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces(selectedPlaces.filter((p) => p.placeId !== placeId));
  };

  const handlePreferenceToggle = (prefId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(prefId) ? prev.filter((p) => p !== prefId) : [...prev, prefId]
    );
  };

  const handleGenerateTrip = async () => {
    if (!userLocation) {
      toast.error('Could not get your location');
      return;
    }

    if (numberOfDays < 1 || numberOfDays > 30) {
      toast.error('Number of days must be between 1 and 30');
      return;
    }

    setGenerating(true);
    setStep('generating');
    setGenerationProgress(8);

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }

    progressTimerRef.current = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 92) return prev;
        const increment = prev < 35 ? 7 : prev < 70 ? 4 : 2;
        return Math.min(92, prev + increment);
      });
    }, 450);

    try {
      let trip: TripItinerary;

      if (mode === 'custom') {
        if (selectedPlaces.length === 0) {
          toast.error('Please select at least one place');
          setGenerating(false);
          setStep('custom');
          return;
        }
        trip = await generateTripFromPlaces(
          selectedPlaces,
          numberOfDays,
          new Date(startDate),
          userLocation
        );
      } else if (mode === 'preference') {
        if (selectedPreferences.length === 0) {
          toast.error('Please select at least one preference');
          setGenerating(false);
          setStep('preference');
          return;
        }

        if (!destinationLocation.trim()) {
          toast.error('Please enter a destination city or location');
          setGenerating(false);
          setStep('preference');
          return;
        }

        if (!map) {
          toast.error('Map not loaded');
          setGenerating(false);
          setStep('preference');
          return;
        }

        // Get location name from user input
        const service = new google.maps.places.PlacesService(map);
        trip = await generateTripFromPreferences(
          selectedPreferences,
          numberOfDays,
          new Date(startDate),
          userLocation,
          destinationLocation, // Location name from user input
          service,
          map
        );
      } else {
        throw new Error('Invalid mode');
      }

      setGenerationProgress(100);

      toast.success('Trip itinerary generated successfully!');
      onTripGenerated(trip);
      onClose();
    } catch (error) {
      console.error('Error generating trip:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to generate trip itinerary'
      );
      setGenerating(false);
      setStep(mode === 'custom' ? 'custom' : 'preference');
    } finally {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setGenerationProgress(0);
      setGenerating(false);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[350px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-['Poppins',sans-serif] font-semibold text-[20px] text-black">
            {step === 'mode' && 'Plan Your Trip'}
            {step === 'custom' && 'Select Places'}
            {step === 'preference' && 'Choose Preferences'}
            {step === 'generating' && 'Creating Itinerary'}
          </h2>
          {step !== 'generating' && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg transition"
            >
              <X size={24} className="text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Mode Selection Step */}
          {step === 'mode' && (
            <div className="space-y-4">
              <p className="font-['Poppins',sans-serif] text-[14px] text-gray-600 mb-4">
                How would you like to plan your trip?
              </p>

              {/* Custom Places Option */}
              <button
                onClick={() => {
                  setMode('custom');
                  setStep('custom');
                }}
                className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-[#2c638b] hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={24} className="text-[#2c638b] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">
                      Select Specific Places
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600 mt-1">
                      You know which places you want to visit
                    </p>
                  </div>
                </div>
              </button>

              {/* Preferences Option */}
              <button
                onClick={() => {
                  setMode('preference');
                  setStep('preference');
                }}
                className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-[#2c638b] hover:bg-blue-50 transition text-left"
              >
                <div className="flex items-start gap-3">
                  <Search size={24} className="text-[#2c638b] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">
                      Let AI Suggest Places
                    </h3>
                    <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600 mt-1">
                      Tell us your interests, we'll find the best places
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Custom Places Step */}
          {step === 'custom' && (
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for places..."
                  value={searchQuery}
                  onChange={(e) => handleSearchPlaces(e.target.value)}
                  className="pl-10"
                />
                {searching && (
                  <Loader
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 animate-spin text-[#2c638b]"
                  />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
                  {searchResults.map((place) => (
                    <button
                      key={place.placeId}
                      onClick={() => handleAddPlace(place)}
                      className="w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">
                        {place.name}
                      </p>
                      <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600">
                        {place.address}
                      </p>
                      {place.rating > 0 && (
                        <p className="font-['Poppins',sans-serif] text-[12px] text-yellow-600 mt-1">
                          ⭐ {place.rating.toFixed(1)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Places */}
              {selectedPlaces.length > 0 && (
                <div className="space-y-2">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black">
                    Selected Places ({selectedPlaces.length})
                  </p>
                  <div className="space-y-2">
                    {selectedPlaces.map((place) => (
                      <div
                        key={place.placeId}
                        className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-['Poppins',sans-serif] font-medium text-[14px] text-black">
                            {place.name}
                          </p>
                          <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600">
                            {place.address}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemovePlace(place.placeId)}
                          className="ml-2 p-1 hover:bg-blue-200 rounded transition"
                        >
                          <X size={18} className="text-[#2c638b]" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Step */}
          {step === 'preference' && (
            <div className="space-y-4">
              {/* Destination Location Input */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
                  Where do you want to go? *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Bangkok, Phuket, Siem Reap..."
                  value={destinationLocation}
                  onChange={(e) => setDestinationLocation(e.target.value)}
                  className="w-full"
                />
                <p className="font-['Poppins',sans-serif] text-[12px] text-gray-600 mt-1">
                  Enter the city or region where you'd like the AI to suggest places
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="font-['Poppins',sans-serif] text-[14px] text-gray-600 mb-3">
                  Select your interests:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {TRIP_PREFERENCES.map((pref) => (
                    <button
                      key={pref.id}
                      onClick={() => handlePreferenceToggle(pref.id)}
                      className={`p-3 rounded-lg border-2 transition text-center font-['Poppins',sans-serif] ${
                        selectedPreferences.includes(pref.id)
                          ? 'border-[#2c638b] bg-blue-50 text-[#2c638b]'
                          : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="text-2xl mb-1">{pref.icon}</div>
                      <div className="text-[12px] font-semibold">{pref.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generating Step */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-full max-w-[320px] space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-['Poppins',sans-serif] font-semibold text-[16px] text-black">
                    Creating Your Itinerary...
                  </p>
                  <p className="font-['Poppins',sans-serif] font-semibold text-[14px] text-[#2c638b]">
                    {generationProgress}%
                  </p>
                </div>
                <div className="w-full h-[10px] bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2c638b] to-[#1e4d6a] transition-all duration-500"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
              <p className="font-['Poppins',sans-serif] text-[14px] text-gray-600 text-center">
                AI is planning the perfect route and schedule for your trip
              </p>
            </div>
          )}

          {/* Common Options */}
          {(step === 'custom' || step === 'preference') && (
            <div className="space-y-4 border-t pt-4">
              {/* Number of Days */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
                  Number of Days: {numberOfDays}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="font-['Poppins',sans-serif] font-semibold text-[14px] text-black block mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-['Poppins',sans-serif]"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateTrip}
                disabled={generating || (mode === 'custom' && selectedPlaces.length === 0) || (mode === 'preference' && selectedPreferences.length === 0)}
                className="w-full bg-[#2c638b] hover:bg-[#234d6a] text-white py-3 rounded-lg font-['Poppins',sans-serif] font-semibold transition"
              >
                {generating ? 'Generating...' : 'Generate Itinerary'}
              </Button>
            </div>
          )}

          {/* Back Button for Custom/Preference Steps */}
          {(step === 'custom' || step === 'preference') && !generating && (
            <Button
              onClick={() => setStep('mode')}
              variant="outline"
              className="w-full"
            >
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
