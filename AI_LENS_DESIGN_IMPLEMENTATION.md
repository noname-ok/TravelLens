# AI Lens UI Design Implementation

## Overview
The AI Lens screen now implements a sophisticated **three-layer gesture-based interface** that enables seamless transitions between live camera capture, quick analysis, and deep conversation modes.

---

## Architecture: Three-Layer System

### Layer 1: AI Lens (Live Camera View)
**Purpose:** Full-screen live camera feed with real-time visual analysis capabilities.

#### Key Features:
- **Full-screen video capture** from device's rear-facing camera
- **Top Translation Bar** (Semi-transparent glassmorphic pill)
  - Defaults to: `[Detected Language] ⇄ English`
  - Tap either side to manually select languages
  - Positioned at top-center with 15px blur backdrop
  
- **Real-time OCR Detection**
  - White bounding brackets appear around detected text/objects
  - Brackets have corner indicators (L-shaped corners)
  - Updates as user moves camera (simulated at 500ms intervals)
  - Opacity: 70% for subtle visibility

- **Robot FAB (Floating Action Button)**
  - Bottom-right corner position (right: 24px, bottom: 80px)
  - Glassmomorphic design: Semi-transparent white with blur effect
  - Tap action: Captures current frame and triggers AI analysis
  - Automatically slides up the Hybrid Overlay
  - Shows loading spinner while analyzing

#### State: `viewMode === 'camera'`

---

### Layer 2: Hybrid Camera-Chat Overlay
**Purpose:** Quick analysis preview with smart recommendations before diving into full chat.

#### Key Features:
- **Sheet Coverage:** 40-50% of screen height
- **Glassmorphism Background:**
  - `bg-white/10 backdrop-blur-2xl`
  - Semi-transparent border: `border-white/20`
  - Still see camera feed behind the sheet
  - Rounded top corners (24px radius)

- **Handle Bar**
  - Visual indicator at top center
  - Signals that sheet can be swiped
  - Gray semi-transparent bar (12px wide, 4px tall)

- **Content Area:**
  - Title & Description (3-line limit)
  - Located in top portion

- **Smart Recommendations**
  - Horizontal scrolling pill buttons
  - Pre-filled based on captured content
  - Examples: "What does this mean?", "Is it safe?", "Best time to visit?"
  - Styling: `bg-white/20 border border-white/30 text-white`
  - Hidden horizontal scrollbar

- **Micro Input Field**
  - Compact text input at bottom
  - Glassmorphic design matching background
  - Rounded pill shape (px-4 py-2)
  - Floating Send icon

#### Gesture Controls:
| Gesture | Action | Result |
|---------|--------|--------|
| **Swipe Up** | User swipes up from bottom | Expands to Full AI Chatbox (Layer 3) |
| **Swipe Down** | User swipes down from top | Minimizes to AI Lens (Layer 1) |

#### State: `viewMode === 'hybrid'`

---

### Layer 3: Full AI Chatbox
**Purpose:** Dedicated long-form conversation space with multimedia capabilities.

#### Key Features:
- **Full-screen Sheet** (expanded from Layer 2)
- **Handle Bar** (Same as Layer 2)
  - Reinforces that user can slide down

- **Header Section**
  - Title: "Ask About [Object Name]"
  - Subtitle: "Get instant answers powered by AI"
  - Border-bottom separator

- **Message Thread Area**
  - Scrollable conversation history
  - **User Messages:**
    - Blue background (#2563EB equivalent)
    - Right-aligned
    - Rounded with bottom-right corner cut off
    - White text
  
  - **AI Messages:**
    - Light gray background (#F3F4F6 equivalent)
    - Left-aligned
    - Rounded with bottom-left corner cut off
    - Dark text
    - **Robot Avatar:** Small blue-tinted circle with robot icon on left

  - **Typing Indicator:** Animated three-dot bubble

- **Persistent Recommendations**
  - Horizontal scrolling pills (same as Layer 2)
  - Positioned above input area
  - Gray styling: `bg-white border border-gray-200`

- **Multimedia Input Bar** (At bottom)
  - **Gallery Icon** (Left): Upload existing photos
  - **Microphone Icon** (Left): Voice-to-text input
    - Changes to red when listening
    - Shows listening indicator with animation
  - **Text Field** (Center): "What would you like to know?"
  - **Send Button** (Right): Accessible via field

#### Gesture Controls:
| Gesture | Action | Result |
|---------|--------|--------|
| **Swipe Down** | User swipes down from top | Returns to Hybrid Overlay (Layer 2) |

#### State: `viewMode === 'fullchat'`

---

## Technical Implementation Details

### Component Files Modified
1. **AILensScreen.tsx** (Main container)
   - View mode state management
   - Gesture event handling with `useRef` for touch coordinates
   - Renders appropriate layer based on `viewMode`
   - Camera permission handling
   - Frame capture for AI analysis

2. **AIChatSheet.tsx** (Enhanced for new design)
   - Updated styling to match glassmorphism
   - Multimedia input bar implementation
   - Message bubble styling
   - Persistent recommendations

### State Management
```typescript
type ViewMode = 'camera' | 'hybrid' | 'fullchat';

// Key states:
- viewMode: Current active layer
- capturedImage: Base64 image from camera
- explanation: Initial AI analysis result
- messages: Chat conversation history
- detectedTexts: OCR detection array
- fromLang / toLang: Selected languages
```

### Touch Event Handling
```typescript
const touchStartY = useRef(0);

// On touch start: Record Y position
const handleSheetDragStart = (e: React.TouchEvent) => {
  touchStartY.current = e.touches[0].clientY;
};

// On touch end: Calculate delta and determine action
const handleSheetDragEnd = (e: React.TouchEvent) => {
  const diff = e.changedTouches[0].clientY - touchStartY.current;
  
  if (diff < -50) => Swipe UP (expand)
  if (diff > 50) => Swipe DOWN (dismiss)
};
```

### CSS Utilities Added
- **scrollbar-hide:** Hides horizontal scrollbars on recommendation pills
  ```css
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  ```

---

## Visual Hierarchy & Styling

### Colors & Opacity
| Element | Color | Opacity |
|---------|-------|---------|
| Translation Bar BG | White | 15% |
| Translation Bar Border | White | 20% |
| Hybrid Sheet BG | White | 10% |
| Hybrid Sheet Border | White | 20% |
| Hybrid Pills BG | White | 20% |
| Hybrid Pills Border | White | 30% |
| AI Messages | #2C5E86 (dark blue) | 100% |
| User Messages | #2563EB (blue-600) | 100% |
| Bot Avatar BG | Blue | 20% |

### Spacing & Dimensions
| Element | Dimension |
|---------|-----------|
| Robot FAB | 64px × 64px |
| FAB Position | right: 24px, bottom: 80px |
| Sheet Radius | 24px (top corners) |
| Handle Bar | 48px wide × 4px tall |
| Avatar Icon | 18px × 18px |
| Pill Icons | 20px × 20px |
| Message Max Width | 336px (on desktop) |

---

## Gesture Flow Diagram

```
┌─────────────────────────────────────┐
│   CAMERA (Layer 1)                  │
│  - Full screen live view            │
│  - Translation bar (top)            │
│  - OCR brackets                     │
│  - Robot FAB (bottom-right)         │
│  - Bottom nav bar                   │
└──────────┬──────────────────────────┘
           │ TAP Robot FAB
           │ (Image captured)
           ↓
┌─────────────────────────────────────┐
│   HYBRID (Layer 2) [40-50% height]  │
│  - Camera feed visible behind       │
│  - Glassmorphic panel               │
│  - Smart recommendations            │
│  - Micro input field                │
│  - Swipe up/down enabled            │
└──────────┬──────────────────────────┘
           │ SWIPE UP                 ← SWIPE DOWN
           │                          │
           ↓                          │
┌─────────────────────────────────────┐
│   FULL CHAT (Layer 3)               │
│  - Expanded sheet (full screen)     │
│  - Message thread                   │
│  - Multimedia input bar             │
│  - Persistent recommendations       │
│  - Swipe down to collapse           │───→ SWIPE DOWN
└──────────────────────────────────────┘    to Layer 2

Also from Layer 2: SWIPE DOWN → back to CAMERA (Layer 1)
```

---

## User Journey Examples

### Scenario 1: Quick Translation
1. User enters AI Lens (Camera layer)
2. Points camera at sign
3. Taps top translation bar to change language
4. Text translates in real-time

### Scenario 2: Quick Analysis
1. User taps Robot FAB
2. Frame captured → AI analyzes
3. Hybrid sheet slides up (40% height)
4. User reads quick summary
5. Sees smart recommendations
6. Can type quick follow-up or swipe down

### Scenario 3: Deep Conversation
1. User captures frame (Hybrid layer)
2. Swipes up to expand
3. Full Chat view appears
4. User can:
   - Type questions
   - Use voice input
   - Upload additional photos
   - See persistent recommendations
5. Swipes down when done

---

## Accessibility & Performance

### Touch Targets
- Minimum touch target size: 44px×44px (FAB, buttons)
- Tap areas: FAB, translation bar, recommendation pills

### Animations
- Swipe transitions: Smooth CSS transitions
- Loading spinner: Continuous rotation (Bot icon)
- Typing indicator: Three-dot bounce animation
- Listening state: Pulsing animation on microphone

### Performance Considerations
- OCR simulation: 500ms throttle (production: Use ML Kit or Tesseract.js)
- Video stream: Uses `object-cover` for efficient scaling
- Blur effect: Backdrop filter with 15px radius (production: adjust for device performance)
- Scrollable areas: Hidden scrollbars using CSS utility

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Three-layer gesture system
- ✅ Glassmorphism design
- ✅ Mock OCR detection
- ✅ Smart recommendations

### Phase 2 (Planned)
- Real-time OCR using Tesseract.js or ML Kit
- Language detection & automatic switching
- Photo upload from gallery
- Microphone input processing
- Real Gemini API integration
- Conversation persistence

### Phase 3 (Advanced)
- Multi-photo analysis
- Object recognition for recommendations
- Conversation context memory
- Bookmarking favorite analyses
- Sharing conversation threads

---

## Testing Checklist

- [ ] Camera feed loads correctly
- [ ] Translation bar is responsive
- [ ] FAQ buttons work
- [ ] Swipe up gesture expands sheet to full screen
- [ ] Swipe down gesture collapses sheet
- [ ] All touch targets meet 44px minimum
- [ ] Glassmorphism effects visible on dark background
- [ ] Message bubbles align correctly (user right, AI left)
- [ ] Microphone input toggles state
- [ ] Send button disabled when input empty
- [ ] Scrolling on recommendations hides scrollbar
- [ ] Bottom nav bar stays accessible from all layers
- [ ] Performance smooth on mobile device

---

## Files Modified

1. **src/app/components/AILensScreen.tsx**
   - Added three-layer system
   - Gesture handling
   - OCR mock detection
   - Translation bar UI

2. **src/app/components/AIChatSheet.tsx**
   - Updated styling
   - Added multimedia input bar
   - Enhanced message bubbles
   - Persistent recommendations

3. **src/styles/tailwind.css**
   - Added `.scrollbar-hide` utility class

---

**Last Updated:** February 11, 2026
**Design Version:** 1.0
**Status:** Implementation Complete ✓
