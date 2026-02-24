# Trip Planning Feature - Visual & UI Reference

## 📱 Screen Layouts

### 1. Map View Screen with Trip Button

```
┌─────────────────────────────┐
│ 9:41                   📶    │  ← Status Bar
├─────────────────────────────┤
│ Map View                     │
├─────────────────────────────┤
│ [🔍] Search your location    │  ← Search Bar
├─────────────────────────────┤
│ All Temples Museums Food ... │  ← Filter Chips
├─────────────────────────────┤
│ [✨ Plan Your Trip]          │  ← NEW BUTTON
├─────────────────────────────┤
│                             │
│                             │
│    🗺️  Google Map View      │  ← Map Container
│                             │
│   (markers for attractions)  │
│                             │
│                             │
├─────────────────────────────┤
│ 🏠 Nearby 📷 AI Lens 👤     │  ← Bottom Navigation
└─────────────────────────────┘
```

### 2. Trip Planning Modal - Mode Selection

```
┌──────────────────────────────┐
│ Plan Your Trip              ✕ │
├──────────────────────────────┤
│                              │
│ How would you like to plan   │
│ your trip?                   │
│                              │
│ ┌──────────────────────────┐ │
│ │ 📍 Select Specific       │ │
│ │    Places               │ │
│ │                         │ │
│ │ You know which places   │ │
│ │ you want to visit       │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ 🔍 Let AI Suggest       │ │
│ │    Places              │ │
│ │                         │ │
│ │ Tell us your interests, │ │
│ │ we'll find places       │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### 3. Trip Planning Modal - Custom Mode

```
┌──────────────────────────────┐
│ Select Places               ✕ │
├──────────────────────────────┤
│ [🔍 Search for places...]    │
├──────────────────────────────┤
│ Search Results:              │
│ ┌─────────────────────────┐ │
│ │ Angkor Wat             │ │
│ │ Siem Reap              │ │
│ │ ⭐ 4.8 (2500 reviews)   │ │
│ └─────────────────────────┘ │
│                              │
│ Selected Places (2):         │
│ ┌─────────────────────────┐ │
│ │ ✓ Angkor Wat       [x]  │ │
│ │ ✓ Central Market   [x]  │ │
│ └─────────────────────────┘ │
│                              │
│ Days: [═════] 3              │
│ Start Date: [2024-02-25]     │
│                              │
│ [ Generate Itinerary ]       │
│ [ Back ]                     │
│                              │
└──────────────────────────────┘
```

### 4. Trip Planning Modal - Preference Mode

```
┌──────────────────────────────┐
│ Choose Preferences          ✕ │
├──────────────────────────────┤
│ Select your interests:       │
│                              │
│ [🏛️]      [🎭]      [🌲]    │
│ Historical Cultural Natural  │
│                              │
│ [🏔️]      [🍽️]      [🛍️]    │
│ Adventure Food Shopping      │
│                              │
│ [🎪]      [🙏]             │
│ Entertainment Religious      │
│                              │
│ Days: [═════] 3              │
│ Start Date: [2024-02-25]     │
│                              │
│ [ Generate Itinerary ]       │
│ [ Back ]                     │
│                              │
└──────────────────────────────┘
```

### 5. Itinerary View Screen

```
┌──────────────────────────────┐
│ ← Back                    [🗑️]│
├──────────────────────────────┤
│ 3-Day Phnom Penh Experience  │
│ (Edit by clicking)           │
│                              │
│ 📅 02/25 - 02/27 | 3 days    │
│ 🗺️ 28.5 km                  │
│                              │
│ [ 📷 Image] [ 📄 PDF ]       │
├──────────────────────────────┤
│                              │
│ ┌──────────────────────────┐ │
│ │ Day 1 - 3 activities  ▼ │ │  ← Collapsible
│ └──────────────────────────┘ │
│   ┌────────────────────────┐ │
│   │ ⏰ 09:00              │ │
│   │ Angkor Wat            │ │
│   │ 📍 Siem Reap          │ │
│   │ ⏱️ 3h | 🚗 15min      │ │
│   │                        │ │
│   │ Explore the iconic...  │ │
│   │                        │ │
│   │ [✎] [🗑️]               │ │
│   └────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Day 2 - 2 activities    │ │  ← Collapsed
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │ Day 3 - 2 activities    │ │
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
```

### 6. Edit Activity Modal

```
┌──────────────────────────────┐
│ Edit Activity               ✕ │
├──────────────────────────────┤
│ Place: Angkor Wat            │
│                              │
│ Start Time: [09:00]          │
│                              │
│ Duration: [3.0] hours        │
│                              │
│ Description:                 │
│ [Explore the iconic...]      │
│                              │
│ Notes (Optional):            │
│ [Bring water and sunscreen]  │
│                              │
│ [ Cancel ] [ Save Changes ]  │
│                              │
└──────────────────────────────┘
```

---

## 🎨 Color & Theme Reference

### Primary Colors
```
Primary Blue:        #2c638b    █████████████
Secondary Blue:      #1e4d6a    █████████████ (darker)
Gradient:            #2c638b → #1e4d6a
```

### Functional Colors
```
Success:             #10b981    ████████████ (green)
Error:               #ef4444    ████████████ (red)
Warning:             #f59e0b    ████████████ (orange)
Info:                #3b82f6    ████████████ (blue)

Background:          #ffffff    (white)
Secondary BG:        #f5f5f5    (light gray)
Text Primary:        #000000    (black)
Text Secondary:      #666666    (gray)
Border:              #e5e7eb    (light gray)
```

### State Colors
```
Active/Selected:     #2c638b with bold text
Hover:               #f5f5f5 background
Disabled:            #cccccc text, no interaction
Loading:             Spinner in #2c638b
```

---

## 🔤 Typography

### Font Family
Primary: 'Poppins' (sans-serif)
Fallback: system sans-serif

### Font Sizes
```
Header (H1):         24px  [Poppins, Semibold]
Header (H2):         20px  [Poppins, Semibold]
Header (H3):         16px  [Poppins, Semibold]
Body:                14px  [Poppins, Regular]
Small:               12px  [Poppins, Regular]
Tiny:                10px  [Poppins, Regular]

Line Height Ratio:   1.5 (for body text)
Letter Spacing:      -0.408px (tight)
```

### Font Weights
```
Regular:             400
Medium:              500
Semibold:            600
Bold:                700
```

---

## 🎯 Icon Reference

### Lucide Icons Used

| Icon | Usage | Size |
|------|-------|------|
| `Wand2` | Trip planning button | 18px |
| `Search` | Preference mode | 24px |
| `MapPin` | Location indicator | 24px |
| `Calendar` | Date picker | 16px |
| `Edit2` | Edit activity | 16px |
| `Trash2` | Delete activity | 16px |
| `Download` | Export button | 16px |
| `FileText` | PDF export | 16px |
| `Image` | Image export | 16px |
| `ChevronUp` / `ChevronDown` | Expand/collapse | 20px |
| `X` | Close modal | 24px |
| `Loader` | Loading spinner | 48px |
| `Home` | Home button | 28px |
| `Camera` | AI Lens button | 28px |
| `User` | Profile button | 28px |

---

## 📐 Spacing & Layout

### Padding
```
Container padding:       24px (left/right)
Card padding:           16px or 20px
Button padding:         12px (v) × 16px (h)
Modal padding:          24px
Section margins:        16px between sections
```

### Gaps
```
Button group:           8px between buttons
List items:             8px between items
Form fields:            12px between fields
Navigation:             10px gap in bottom nav
```

### Border Radius
```
Standard:               12px
Small:                  8px
Extra small:            6px
Buttons:                8px
Cards:                  12px
Modals:                 20px
Full (pills):           24px
```

### Shadows
```
Subtle:                 shadow-sm (0 1px 2px)
Standard:               shadow-md (0 4px 6px)
Elevated:               shadow-lg (0 10px 15px)
Modal:                  shadow-2xl (0 20px 25px)
```

---

## 📏 Responsive Sizes

### Viewport
```
Mobile (Target):        390px width
iPad:                   768px width
Desktop:                1024px+ width

Modal max-width:        500px
```

### Touch Targets
```
Minimum:                44px × 44px
Comfortable:            48px × 48px
Buttons:                40-50px height
Icons:                  20-28px
```

---

## 🔄 Interaction States

### Button States
```
Default:     [Background] [Text] (no shadow)
Hover:       [Darker background] (shadow-md)
Active:      [Darker background] (shadow-lg)
Disabled:    [Gray background] (no interaction)
Loading:     [Same] with [spinner overlay]
```

### Form States
```
Empty:       [Border: light gray]
Focused:     [Border: #2c638b] [Glow effect]
Filled:      [Show input value]
Error:       [Border: red] [Error message below]
Success:     [Border: green]
```

### Modal States
```
Closed:      Hidden (display: none)
Opening:     Fade in + scale animation
Visible:     Fixed position, z-50
Closing:     Fade out + scale animation
```

---

## 🎬 Animation Reference

### Transitions
```
Color/background:      150ms ease-in-out
Scale:                 150ms ease-out
Opacity:               150ms ease-in-out
Transform:             150ms cubic-bezier(0.4, 0, 0.2, 1)
```

### Loading Spinner
```
Animation:             infinite rotation
Duration:              450ms per rotation
Direction:             clockwise
Easing:                linear
```

### Expansion (Days)
```
Type:                  Height change + opacity
Duration:              200ms
Easing:                ease-in-out
Direction:             Slide down / collapse up
```

---

## 📱 Responsive Behavior

### Mobile (390px)
```
Full width layout
Single column
Modals: 100vw - 48px padding
Buttons: Full width or stacked
```

### Tablet (768px)
```
Centered max-width
Two columns possible
Modal: max-width 500px
Buttons: Side-by-side
```

---

## 🎨 Component Dimensions

### Trip Button
```
Width:       Full (with 24px margins)
Height:      48px
Padding:     12px (v) × 16px (h)
Border:      0px (no border)
Background:  Gradient #2c638b → #1e4d6a
```

### Modal
```
Width:       100% (mobile), max 500px (desktop)
Max Height:  90vh
Border:      0px
Shadow:      shadow-2xl
Rounded:     20px
```

### Activity Card
```
Width:       100% (in list)
Padding:     12px
Margin:      8px 0
Border:      1px solid #e0e0e0
Background:  #f8f9fa or #ffffff
Rounded:     8px
```

### Input Fields
```
Width:       100%
Height:      40px
Padding:     8px × 12px
Border:      1px solid #d1d5db
Rounded:     8px
Font:        14px
```

---

## 🔍 Accessibility Features

### Keyboard Navigation
```
Tab:         Navigate between focusable elements
Enter:       Activate buttons/submit forms
Escape:      Close modals
Arrow Keys:  Expand/collapse lists
Space:       Toggle checkboxes
```

### Focus Indicators
```
Color:       #2c638b
Style:       2px solid outline
Offset:      2px from element
Contrast:    WCAG AA compliant (4.5:1)
```

### Semantic HTML
```
<button>     For clickable actions
<input>      For form fields
<label>      For form labels
<fieldset>   For grouped inputs
<aria-*>     For screen readers
```

---

## 🖼️ Example Component Hierarchy

```
TripPlanningModal
├── Header
│   ├── Title (h2)
│   └── Close Button (icon)
├── Content
│   ├── Mode Selection Screen
│   │   ├── Info Text (p)
│   │   ├── Option Button 1
│   │   │   ├── Icon
│   │   │   ├── Heading (h3)
│   │   │   └── Description (p)
│   │   └── Option Button 2
│   │       ├── Icon
│   │       ├── Heading (h3)
│   │       └── Description (p)
│   ├── Place Selection Screen
│   │   ├── Search Input
│   │   ├── Results List
│   │   ├── Selected Items List
│   │   ├── Days Slider
│   │   └── Date Picker
│   └── Generating Screen
│       ├── Spinner Icon (animated)
│       ├── Loading Text (h3)
│       └── Info Text (p)
└── Footer
    ├── Generate Button (primary)
    ├── Back Button (outline)
    └── Cancel Button
```

---

## 📋 Data Visualization

### Itinerary Item Card Layout
```
┌─ Card Container ──────────────┐
│                               │
│ ⏰ 09:00 [Edit Icon] [Delete]  │
│                               │
│ Place Name (Large)            │
│ 📍 Address (Small)            │
│                               │
│ ⏱️ 3h | 🚗 15min              │
│                               │
│ ┌─ Description Box ──────────┐│
│ │ Lorem ipsum dolor...       ││
│ └────────────────────────────┘│
│                               │
│ 💡 Note: Tips and info...      │
│                               │
└───────────────────────────────┘
```

### Day Section Header
```
┌─ Day Header ─────────────────────────────┐
│ Day 1 - 3 activities                  ▼  │
└───────────────────────────────────────────┘
  (Gradient background: #2c638b → #1e4d6a)
  (White text, bold font)
  (Chevron icon on right)
```

---

## ✨ Special Effects

### Gradient Backgrounds
```
Day Headers:    linear-gradient(90deg, #2c638b, #1e4d6a)
Button:         linear-gradient(135deg, #2c638b, #1e4d6a)
Hover Button:   linear-gradient(135deg, #1e4d6a, #152a3a)
```

### Hover Effects
```
Card:           Slight scale up + shadow increase
Button:         Darken background + shadow
Link:           Color change + underline
Icon:           Scale 1.1 + color change
```

### Loading States
```
Spinner:        Rotating animation (infinite)
Text:           Pulse animation (fade in/out)
Opacity:        50% during disabled state
Cursor:         Not-allowed during disabled
```

---

**Design System Version**: 1.0
**Last Updated**: February 23, 2026
**Compatibility**: iOS 14+, Android 5.0+, Modern browsers
