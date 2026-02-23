# Trip Planning Feature - Architecture & Integration Guide

## Component Hierarchy

```
App.tsx
├── MapViewScreen.tsx
│   ├── GoogleMap (react-google-maps)
│   ├── PlaceDetailSheet.tsx
│   ├── TripPlanningModal.tsx
│   │   └── Uses: 
│   │       - generateTripItinerary() from geminiService
│   │       - findPlacesByPreference() from geminiService
│   │       - generateTripFromPlaces() from tripPlannerService
│   │       - generateTripFromPreferences() from tripPlannerService
│   └── TripPlanningModal (renders when button clicked)
│
├── ItineraryViewScreen.tsx (New conditional screen)
│   ├── EditItineraryModal.tsx
│   └── Uses:
│       - exportToPDF() from exportUtils
│       - exportToImage() from exportUtils
│       - updateTripInStorage() from tripPlannerService
│       - deleteTripFromStorage() from tripPlannerService
│
└── Home navigation to MapViewScreen/ItineraryViewScreen
```

## Data Flow Diagram

```
User Action (Click "Plan Your Trip")
        ↓
TripPlanningModal Opens
        ↓
    ┌─────────────────────────────────┐
    │  Choose Planning Mode            │
    └──────┬──────────────────────────┘
           ├─ Custom Mode              ┌─ Preference Mode
           │  ↓                         │  ↓
           │  Searchable places list    │  Preference checkboxes
           │  ↓                         │  ↓
           │  User selects 2+ places   │  User selects 1+ preferences
           │  ↓                         │  ↓
           └──┬──────────────────────┬─┘
              ↓ (Common Path)         ↓
         Set trip duration & date    Set trip duration & date
              ↓                        ↓
         Click "Generate"         Click "Generate"
              ↓                        ↓
         tripPlannerService:      tripPlannerService:
         generateTripFromPlaces() generateTripFromPreferences()
              ↓                        ↓
         Google Places API        Gemini API (recommendations)
         ↓ (get exact locations)  ↓
         Route Optimization       Google Places API
         (optimize order)         (get real locations)
              ↓                        ↓
         Gemini AI                Route Optimization
         (create schedule)        ↓
              ↓                    Gemini AI
              └──────┬─────────────┘
                     ↓
              TripItinerary Object
                     ↓
         saveTripToStorage(trip)
                     ↓
         ItineraryViewScreen Displays
                     ↓
         User can: Edit | Export | Delete
```

## Service Integration Points

### tripPlannerService.ts Functions

```typescript
// Main Public Functions (exported from tripPlannerService)

calculateDistance(lat1, lng1, lat2, lng2) → number
  // Haversine formula for distance between two coords
  // Used by: optimizeRouteOrder

estimateTravelTime(distanceKm) → number
  // Converts distance to minutes
  // Based on average speeds in cities

optimizeRouteOrder(places, startLocation) → PlaceSearchResult[]
  // Nearest neighbor algorithm
  // Used by: generateTripFromPlaces

generateTripFromPlaces(places, days, startDate, startLocation, preferences?) → Promise<TripItinerary>
  // Custom mode workflow
  // Calls: optimizeRouteOrder → geminiService.generateTripItinerary → saveTripToStorage

generateTripFromPreferences(preferences, days, startDate, startLocation, locationName, placesService, map) → Promise<TripItinerary>
  // Preference mode workflow
  // Calls: geminiService.findPlacesByPreference → Google Places API → generateTripFromPlaces

saveTripToStorage(trip) → void
  // localStorage persistence

loadTripsFromStorage() → TripItinerary[]
  // Retrieve all trips

updateTripInStorage(trip) → void
  // Update existing trip

deleteTripFromStorage(tripId) → void
  // Remove trip from storage
```

### geminiService.ts Functions (Trip Planning)

```typescript
generateTripItinerary(places, numberOfDays, startDate, preferences?) → Promise<ItineraryResponse>
  // Input: Array of places with basic info
  // Output: Detailed day-by-day schedule
  // Model: gemini-2.5-flash-lite
  // Uses rate limiting & retry logic

findPlacesByPreference(preferences, numberOfDays, location) → Promise<PreferencePlacesResponse>
  // Input: User preferences + duration + location
  // Output: List of recommended real places
  // Model: gemini-2.5-flash-lite
  // Used by: generateTripFromPreferences
```

### exportUtils.ts Functions

```typescript
exportToPDF(trip, filename) → Promise<void>
  // Creates PDF from trip itinerary
  // Library: jsPDF
  // Formatting: Professional layout with headers, dividers, etc.

exportToImage(trip, filename) → Promise<void>
  // Creates PNG from trip itinerary
  // Library: html2canvas
  // Formatting: Social media friendly
```

## State Management Flow

### In MapViewScreen.tsx
```typescript
const [isTripPlanningOpen, setIsTripPlanningOpen] = useState(false);
       ↓ (opened when user clicks "Plan Your Trip")
const [generatedTrip, setGeneratedTrip] = useState<TripItinerary | null>(null);
       ↓ (populated when AI finishes generation)
       ↓ (passed to App.tsx via onTripGenerated callback)
```

### In App.tsx
```typescript
const [currentScreen, setCurrentScreen] = useState<Screen>('mapview');
const [selectedTrip, setSelectedTrip] = useState<TripItinerary | null>(null);
       ↓
When trip generated:
  - setSelectedTrip(trip)
  - setCurrentScreen('itinerary')
       ↓
ItineraryViewScreen renders with:
  - trip: selectedTrip
  - onBack: setCurrentScreen('mapview')
  - onDelete: handleDeleteTrip
  - onUpdate: handleUpdateTrip
```

## API & External Dependencies

### Google Maps API

```typescript
// Used in TripPlanningModal for place search
const service = new google.maps.places.PlacesService(map);
service.findPlaceFromQuery(request, callback);
// Finds real places matching user search or AI recommendations
```

### Gemini API

```typescript
// Two main calls:

1. generateTripItinerary()
   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent
   Input: Places + duration + preferences
   Output: JSON { itinerary, summary, highlights, tips }

2. findPlacesByPreference()
   POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent
   Input: Preferences + location + duration
   Output: JSON { recommendedPlaces, summary }
```

## Class/Interface Relationships

```
TripItinerary (Main container)
├── startDate: Date
├── endDate: Date
├── items: ItineraryItem[] (1 to many)
│   ├── day: number
│   ├── time: string
│   ├── placeName: string
│   ├── position: PlaceLocation
│   ├── duration: number
│   └── description: string
├── startLocation: PlaceLocation
└── preferences?: string[]

PlaceSearchResult (intermediate, used during generation)
├── placeId: string
├── name: string
├── address: string
├── position: PlaceLocation
└── rating: number

TripPlanningRequest (user input)
├── mode: 'custom' | 'preference'
├── selectedPlaces?: PlaceSearchResult[]
├── preferences?: string[]
├── numberOfDays: number
└── startDate: Date
```

## Error Handling Chain

```
User Action
    ↓
Validation (numberOfDays, places selected, etc.)
    ├─ FAIL → Show toast error
    └─ PASS → Continue
        ↓
API Call (Gemini/Google Places)
    ├─ Rate Limited (429) → Retry with backoff
    ├─ Other Error → Show error toast
    ├─ Invalid Response → Parse error, show toast
    └─ Success → Continue
        ↓
Data Processing (route optimization)
    ├─ Error → Show toast
    └─ Success → Continue
        ↓
Storage
    ├─ Error (localStorage full) → Show warning
    └─ Success → Show success toast

Similar pattern for Edit, Export, Delete operations
```

## Performance Optimization Points

### 1. Memoization
```typescript
// In components, use React.memo for expensive components
const EditItineraryModal = React.memo(EditItineraryModalComponent);
```

### 2. Debounced Search
```typescript
// In TripPlanningModal
const handleSearchPlaces = debounce((query) => {
  // search logic
}, 500);
```

### 3. Lazy Loading
```typescript
// Modals load only when needed
{isTripPlanningOpen && <TripPlanningModal ... />}
{currentScreen === 'itinerary' && <ItineraryViewScreen ... />}
```

### 4. LocalStorage Caching
```typescript
// Avoid repeated API calls for saved trips
const cachedTrips = loadTripsFromStorage();
// Displayed without additional API calls
```

## Integration Checklist

- [x] TripPlanning types defined
- [x] Trip planner service implemented
- [x] Gemini integration for trip generation
- [x] TripPlanningModal component created
- [x] Place search integration
- [x] Preference-based discovery
- [x] ItineraryViewScreen component created
- [x] Edit functionality
- [x] PDF/Image export
- [x] LocalStorage persistence
- [x] MapViewScreen integration (button + modal)
- [x] App.tsx screen routing
- [x] Error handling
- [x] Loading states

## Testing Points

### Unit Tests (Would Add)
```typescript
// tripPlannerService.test.ts
- calculateDistance() with known coordinates
- estimateTravelTime() with various distances
- optimizeRouteOrder() with test place sets

// exportUtils.test.ts
- exportToPDF() generates valid PDF
- exportToImage() generates PNG

// geminiService.test.ts (with mock responses)
- generateTripItinerary() parsing
- findPlacesByPreference() parsing
```

### Integration Tests (Would Add)
```typescript
- Custom mode end-to-end
- Preference mode end-to-end
- Edit and save workflow
- Export workflow
- Storage persistence
```

### E2E Tests (Would Add)
```typescript
- Full user workflow with real APIs
- Error scenarios
- Rate limiting behavior
```

## Deployment Considerations

1. **Environment Variables**: Ensure API keys are set
2. **CORS**: Google Places API needs proper CORS configuration
3. **Rate Limiting**: Monitor Gemini API usage
4. **Storage Quota**: localStorage max is ~5-10MB (sufficient for many trips)
5. **Browser Support**: Test on target browsers
6. **Mobile**: Verify touch interactions work smoothly
7. **Offline**: Currently no offline support (could be added)

## Future Extension Points

### Easy to Add
```typescript
// More preferences
TRIP_PREFERENCES.push({
  id: 'nightlife',
  label: 'Nightlife',
  icon: '🌙'
});

// More export formats
exportToMarkdown(trip)  // Travel blog format
exportToCalendar(trip)  // iCal format
exportToJSON(trip)      // Shareable link format
```

### Moderate to Add
```typescript
// Collaborative planning
shareTrip(tripId, emails) // Send to friends

// Map visualization
showTripOnMap(trip)     // Draw polyline + markers

// Booking integration
bookHotel(place, dates) // Connect to booking APIs
bookTransport(leg)      // Flight/car rental APIs
```

### Complex to Add
```typescript
// Real-time collaboration
liveEditTrip(tripId)    // WebSocket for live updates

// Backend storage
syncToCloud()           // Database persistence

// Multi-language support
translateItinerary()    // Translate descriptions to other languages
```
