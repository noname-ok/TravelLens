# AI-Powered Trip Planning Feature

## Overview

The AI-Powered Trip Planning feature on the "Nearby" page (the second button in the bottom navigation) helps users automatically plan their destinations and routes with optimized itineraries. The system uses Google Places API and Gemini AI to create comprehensive travel schedules.

## Features

### 1. **Trip Planning Modes**

Users can plan their trip in two ways:

#### Mode A: Custom Place Selection
- Users manually search for and select specific places they want to visit
- Choose how many days they have for the trip
- AI analyzes the selected places and creates an optimized route based on:
  - Shortest travel distances between locations
  - Logical geographic ordering
  - Opening hours and best visit times
  - Rest periods and meal breaks

#### Mode B: Preference-Based Discovery
- Users select interests from categories like:
  - 🏛️ Historical
  - 🎭 Cultural
  - 🌲 Natural
  - 🏔️ Adventure
  - 🍽️ Food & Dining
  - 🛍️ Shopping
  - 🎪 Entertainment
  - 🙏 Religious
- AI searches for real places matching their preferences
- Automatically creates an optimized itinerary

### 2. **Smart Itinerary Generation**

The AI generates detailed itineraries that include:
- **Day-by-day breakdown** with specific times
- **Travel time estimates** between locations
- **Duration recommendations** for each activity
- **Cultural tips and notes** for each place
- **Route optimization** to minimize travel distance
- **Best visit times** considering place opening hours

### 3. **Itinerary Management**

After generation, users can:

#### View Itinerary
- Expand/collapse each day to see activities
- View detailed information for each place:
  - Address and location
  - Recommended time and duration
  - Description of what to do
  - Estimated travel time to next location
  - Special notes and tips

#### Edit Itinerary
- Modify start times for activities
- Adjust duration of visits
- Edit descriptions and notes
- Add or update special instructions
- Delete activities if needed

#### Export Itinerary
- **Export as PDF**: Professional document format for printing or sharing
- **Export as Image**: Shareable PNG format for social media

### 4. **Trip Storage**

Trips are automatically saved to browser's localStorage, allowing users to:
- Save multiple trip plans
- Retrieve previously created itineraries
- Modify saved trips anytime
- Delete trips they no longer need

## Technical Architecture

### New Files Created

#### Types & Data Structures
- **`src/app/types/tripPlanning.ts`**: TypeScript interfaces for trip planning

#### Services
- **`src/app/services/tripPlannerService.ts`**: Business logic for trip planning
  - Route optimization (nearest neighbor algorithm)
  - Distance calculations (Haversine formula)
  - Travel time estimation
  - Storage management (localStorage)
  - Trip generation from places or preferences

- **`src/app/services/geminiService.ts`** (updated): Added AI functions
  - `generateTripItinerary()`: Creates detailed schedule from places
  - `findPlacesByPreference()`: Recommends places based on user interests

#### Components
- **`src/app/components/TripPlanningModal.tsx`**: Initial modal for choosing planning mode
  - Mode selection screen
  - Place search and selection UI (Custom mode)
  - Preference selection UI (Preference mode)
  - Date and duration picker
  - AI loading screen

- **`src/app/components/ItineraryViewScreen.tsx`**: Full itinerary display and management
  - Day-by-day view with expandable sections
  - Edit and delete functionality
  - Export to PDF/Image buttons
  - Trip management (rename, delete entire trip)

- **`src/app/components/EditItineraryModal.tsx`**: Modal for editing individual activities
  - Time and duration editing
  - Description updates
  - Notes management

#### Utilities
- **`src/app/utils/exportUtils.ts`**: Export functionality
  - `exportToPDF()`: Generates PDF documents with jsPDF
  - `exportToImage()`: Creates PNG images with html2canvas

### Key Dependencies Added
```json
{
  "jspdf": "^2.5.1",      // PDF generation
  "html2canvas": "^1.4.1" // Image export from HTML
}
```

## User Flow

```
1. User clicks "Plan Your Trip" button on Map View
   ↓
2. Choose Planning Mode (Custom or Preference)
   ↓
3. Mode-Specific Input
   Custom: Search and select places
   Preference: Choose interests
   ↓
4. Set Duration and Start Date
   ↓
5. AI Generates Itinerary
   - Analyzes locations
   - Optimizes route
   - Creates schedule
   ↓
6. View Generated Itinerary
   - Browse day-by-day activities
   - See details and tips
   ↓
7. Edit (Optional)
   - Modify times, durations, notes
   - Add/remove items
   ↓
8. Export
   - Save as PDF for printing
   - Share as image on social media
   ↓
9. Save Trip
   - Automatically stored in localStorage
   - Can access later and edit
```

## API Integration

### Google Places API
- Place search and discovery
- Place details (address, hours, reviews)
- Distance matrix calculations (implicit via coordinates)

### Gemini AI API
- **Model**: gemini-2.5-flash and gemini-2.5-flash-lite
- **Rate Limiting**: ~10 requests per minute (free tier)
- **Functions**:
  - Itinerary generation from selected places
  - Place recommendations from user preferences
  - Natural language processing for descriptions and tips

## Data Flow

```
User Input
   ↓
Google Places API Search → Place Details
   ↓
Route Optimization (Haversine formula)
   ↓
Gemini AI Generation
   ├─ Analyze selected places
   ├─ Optimize route
   ├─ Create schedule
   └─ Generate descriptions & tips
   ↓
Trip Itinerary Object
   ↓
localStorage Storage + UI Display
   ↓
Export (PDF/Image) or Edit
```

## Storage Schema

### Trip Itinerary (localStorage)
```typescript
{
  id: string;                    // Unique trip ID
  tripName: string;              // User-defined name
  startDate: Date;               // Trip start date
  endDate: Date;                 // Trip end date
  totalDays: number;             // Duration in days
  startLocation: PlaceLocation;  // Starting point
  items: ItineraryItem[];        // Daily activities
  preferences?: string[];        // User preferences (if applicable)
  totalDistance?: number;        // Total estimated km
  createdAt: Date;               // Creation timestamp
  updatedAt: Date;               // Last update timestamp
}
```

### Itinerary Item (Activity)
```typescript
{
  id: string;                 // Unique item ID
  day: number;                // Day number (1-based)
  time: string;               // Start time (HH:MM format)
  placeName: string;          // Destination name
  placeId: string;            // Google Place ID
  address: string;            // Full address
  position: PlaceLocation;    // Coordinates
  duration: number;           // Duration in hours
  description: string;        // What to do there
  estimatedTravelTime?: number; // Travel time to next location (minutes)
  notes?: string;             // Additional tips
  images?: string[];          // Place images (optional)
}
```

## Theme Integration

The feature follows the existing TravelLens theme:
- **Primary Color**: `#2c638b` (Dark Blue)
- **Secondary Color**: `#1e4d6a` (Darker Blue)
- **Font**: 'Poppins' for consistency
- **UI Components**: Uses existing shadcn/ui components (Button, Input, Dialog, etc.)

## Error Handling

- **No location**: Prompts user to enable location services
- **API failures**: Retry with exponential backoff
- **Rate limiting**: Queues requests and informs user
- **Invalid input**: Validation before API calls
- **Export errors**: User-friendly error messages via toast notifications

## Future Enhancements

1. **Real-time Collaboration**: Share trip plans with friends
2. **Budget Tracking**: Estimate and track spending per trip
3. **Weather Integration**: Show weather forecast for trip dates
4. **Booking Integration**: Direct booking links for accommodations/transport
5. **Photo Collections**: Organize photos by trip and location
6. **Offline Mode**: Download itineraries for offline access
7. **Social Sharing**: Share itinerary directly to social media
8. **Trip Analytics**: Track completed trips and statistics
9. **Multi-city Support**: Plan trips spanning multiple destinations
10. **Voice Commands**: Voice-based trip planning

## Usage Tips

1. **Custom Mode Best For**: Users who have specific places in mind
2. **Preference Mode Best For**: Users exploring new areas without a fixed plan
3. **Route Optimization**: The system automatically finds the most efficient order
4. **Editing**: Users can refine any aspect after AI generation
5. **Export Timing**: Export after final edits for best results

## Troubleshooting

| Issue | Solution |
|-------|----------|
| AI takes too long | Check internet connection; Gemini might be rate-limited |
| Places not found | Search with full place name; try alternative names |
| Export fails | Clear browser cache; try different export format |
| Trips not saving | Ensure localStorage is enabled in browser settings |
| Map not loading | Verify Google Maps API key is valid and unrestricted |

## Accessibility

- Keyboard navigation supported
- Focus indicators on interactive elements
- Clear labels and instructions
- Toast notifications for feedback
- Readable font sizes and colors
- Mobile-optimized layout

## Performance Considerations

- **Lazy loading**: Modals load on demand
- **Debounced search**: Reduces API calls during typing
- **Memoization**: Components memo-ized to prevent unnecessary re-renders
- **Efficient routing**: Nearest neighbor algorithm (O(n²)) suitable for typical trip sizes
- **localStorage**: No server requests for saved trips

## Security Notes

- No sensitive data stored in localStorage
- Trip data is client-side only (no backend storage)
- Google API key should be restricted to specific URLs
- Gemini API usage respects rate limits to prevent abuse
