# Trip Planning Feature - Setup & Testing Guide

## Installation

### 1. Install Required Dependencies

```bash
npm install jspdf html2canvas
# or
pnpm add jspdf html2canvas
```

### 2. Environment Variables

No additional environment variables needed. The feature uses existing:
- `VITE_GEMINI_API_KEY` - Already configured for Gemini API
- `VITE_GOOGLE_MAPS_API_KEY` - Already configured for Google Places API

### 3. Build & Run

```bash
npm run dev
# or
pnpm dev
```

## Testing the Feature

### Test Scenario 1: Custom Place Selection

1. Open the app and navigate to the **Nearby** section (second button)
2. Click the **"Plan Your Trip"** button (wand icon)
3. Select **"Select Specific Places"**
4. Search for places:
   - Try: "Angkor Wat"
   - Try: "Museum of Cambodia"
   - Try: "Central Market"
5. Select 2-3 places
6. Set number of days: 3
7. Set start date: Tomorrow
8. Click **"Generate Itinerary"**
9. Wait for AI to create schedule (15-30 seconds)
10. Review the generated itinerary

### Test Scenario 2: Preference-Based Planning

1. Click **"Plan Your Trip"** button
2. Select **"Let AI Suggest Places"**
3. Choose preferences (select at least 2):
   - Try: Historical + Cultural
   - Try: Natural + Adventure
   - Try: Food + Shopping
4. Set duration: 2 days
5. Click **"Generate Itinerary"**
6. Review AI-discovered places and schedule

### Test Scenario 3: Edit Itinerary

After generating an itinerary:

1. Click on an activity item to expand it
2. Click the **edit icon** (pencil) on any activity
3. Modify:
   - Start time (try changing from 09:00 to 10:00)
   - Duration (try changing from 2h to 3h)
   - Description or notes
4. Click **"Save Changes"**
5. Verify changes are applied

### Test Scenario 4: Export Itinerary

After generating an itinerary:

1. Click **"Image"** button → Should download PNG file
2. Click **"PDF"** button → Should download PDF file
3. Check downloaded files:
   - PNG should be shareable on social media
   - PDF should be printable

### Test Scenario 5: Persistent Storage

1. Generate and save a trip
2. Refresh the page (F5)
3. Navigate back to Nearby → Plan Your Trip
4. The trip should still be in localStorage
5. Note: Currently, viewing saved trips requires manual implementation (see below)

## Implementation Notes

### What's Been Implemented ✅

- ✅ Trip planning modal with dual modes
- ✅ Custom place selection workflow
- ✅ Preference-based place discovery
- ✅ AI-powered itinerary generation
- ✅ Route optimization algorithm
- ✅ Itinerary viewing and management
- ✅ Edit individual activities
- ✅ Export to PDF and Image
- ✅ localStorage persistence
- ✅ Full integration with MapViewScreen

### What You Might Want to Add (Optional Features)

#### 1. Trip History Management
Create a new screen to view all saved trips:

```typescript
// Add this to components
import { loadTripsFromStorage } from '@/app/services/tripPlannerService';

// In a new component: SavedTripsScreen.tsx
export function SavedTripsScreen() {
  const trips = loadTripsFromStorage();
  return (
    <div>
      {trips.map(trip => (
        <div key={trip.id} onClick={() => handleViewTrip(trip)}>
          {trip.tripName} - {trip.startDate.toLocaleDateString()}
        </div>
      ))}
    </div>
  );
}
```

#### 2. View Itinerary on Map
Add map visualization showing all stops:

```typescript
// In ItineraryViewScreen.tsx
import { GoogleMap, Marker } from '@react-google-maps/api';

// Show polyline connecting all stops
// Show markers for each stop with time labels
```

#### 3. Share via Link
Generate shareable URLs:

```typescript
// Encode trip as URL parameter
const shareUrl = `${window.location.origin}?trip=${btoa(JSON.stringify(trip))}`;
```

#### 4. Collaborative Planning
Let users invite friends to plan together:

```typescript
// Share trip ID and allow real-time updates
// Requires backend support
```

## Common Issues & Solutions

### Issue: "AI returned invalid format"
**Solution**: Ensure Gemini API key is valid. Check console for actual response.

### Issue: Trips not saving after refresh
**Solution**: Verify localStorage is enabled:
```javascript
// In browser console
console.log(localStorage.getItem('userTrips'));
```

### Issue: Export not working
**Solution**: 
- For PDF: Ensure jsPDF is properly installed
- For Image: Ensure html2canvas is properly installed
- Check browser console for specific errors

### Issue: Google Places search returns no results
**Solution**: Use full place names, e.g., "Phnom Penh Museum" instead of just "Museum"

### Issue: Map button not appearing
**Solution**: Ensure MapViewScreen.tsx is properly imported with the Wand2 icon

## Testing Checklist

- [ ] Custom place selection mode works
- [ ] Preference-based mode works
- [ ] AI generates valid itineraries
- [ ] Edit functionality works
- [ ] PDF export works and file downloads
- [ ] Image export works and file downloads
- [ ] Trips save to localStorage
- [ ] Date picker works correctly
- [ ] Duration slider works (1-30 days)
- [ ] Error handling displays proper messages
- [ ] UI is responsive on phone size
- [ ] No console errors

## Files Modified/Created

### New Files
```
src/app/types/tripPlanning.ts
src/app/services/tripPlannerService.ts
src/app/components/TripPlanningModal.tsx
src/app/components/ItineraryViewScreen.tsx
src/app/components/EditItineraryModal.tsx
src/app/utils/exportUtils.ts
TRIP_PLANNING_IMPLEMENTATION.md
```

### Modified Files
```
src/app/services/geminiService.ts (added trip planning functions)
src/app/components/MapViewScreen.tsx (added trip button and modal)
src/app/App.tsx (added itinerary screen and trip state management)
package.json (added jspdf and html2canvas)
```

## Development Tips

### Enable Verbose Logging

```typescript
// In tripPlannerService.ts
export async function generateTripFromPlaces(...) {
  console.log('🚀 Starting trip generation with places:', places);
  console.log('📊 Route optimization starting...');
  // ... rest of function
}
```

### Test with Mock Data

```typescript
// For testing without Gemini API
const mockItinerary: ItineraryItem[] = [
  {
    id: 'test_1',
    day: 1,
    time: '09:00',
    placeName: 'Test Place',
    placeId: 'test_id',
    address: 'Test Address',
    position: { lat: 11.5564, lng: 104.9282 },
    duration: 2,
    description: 'Testing',
    estimatedTravelTime: 15
  }
];
```

### Debug Route Optimization

```typescript
// Add this to see optimization process
const distances = places.map((p, i) => ({
  name: p.name,
  distances: places.map(p2 => 
    calculateDistance(p.position.lat, p.position.lng, 
                     p2.position.lat, p2.position.lng)
  )
}));
console.log('🗺️ Distance Matrix:', distances);
```

## Performance Metrics

Target performance:
- Trip generation: 5-30 seconds (depends on Gemini API)
- UI load: <1 second
- Export generation: 1-3 seconds
- Route optimization: <100ms for typical trips

## Browser Compatibility

- ✅ Chrome/Chromium (95+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Edge (95+)
- ⚠️ IE: Not supported

## Support & Debugging

For debugging, check:
1. Browser Console (`F12` → Console tab)
2. Network tab for API requests
3. Application → Storage → Local Storage for saved trips

Common log patterns to look for:
- `🚀` - Start of operation
- `📊` - Data processing
- `🗺️` - Position/routing info
- `✅` - Success
- `❌` - Error
