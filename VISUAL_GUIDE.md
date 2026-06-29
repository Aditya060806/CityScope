# 📱 Camera Capture - Visual Guide

## Desktop vs Mobile Comparison

### 🖥️ Desktop Experience (sm: >= 640px)

```
┌─────────────────────────────────────────────────┐
│                Browser Window                    │
│                                                  │
│  Page Content (Report Form)                     │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │   📷 Camera Capture Modal                 │  │
│  ├───────────────────────────────────────────┤  │
│  │                                           │  │
│  │ ┌─────────────────────────────────────┐  │  │
│  │ │                                     │  │  │
│  │ │    Camera Preview (16:9)            │  │  │
│  │ │    🟢 Camera Active                 │  │  │
│  │ │                                     │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                           │  │
│  │  [Cancel]                [Capture Photo]  │  │
│  │                                           │  │
│  │  💡 Tips for Best Results:                │  │
│  │  • Good lighting                          │  │
│  │  • Hold steady                            │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
      ↑                                    ↑
   Rounded                              Max-width
   corners                              3xl (768px)
```

---

### 📱 Mobile Experience (sm: < 640px)

```
┌────────────────────┐
│ Device Screen      │ ← Notch/Safe Area
│  (Full Height)     │
├────────────────────┤
│📷 Capture    ✕    │ ← Fixed Header (with safe-area padding)
│  Position camera   │   Black/90 with blur
├────────────────────┤
│                    │
│                    │
│                    │
│   CAMERA FEED      │
│   (Full Screen)    │ ← Video fills entire area
│   Edge-to-Edge     │   No borders
│                    │
│   🟢 Active        │ ← Status badge (top-right)
│                    │
│                    │
│                    │
│                    │
│ 📸 Position here   │ ← Instruction overlay
│                    │   (semi-transparent)
├────────────────────┤
│                    │ ← Gradient overlay
│[Cancel][📷Capture]│ ← Fixed Footer (with safe-area padding)
│                    │   Large buttons (56px height)
└────────────────────┘
      ↑
   Home indicator/
   Navigation bar
```

---

## Feature Comparison Table

| Feature | Desktop | Mobile |
|---------|---------|--------|
| **Modal Size** | Max-width 768px | Full screen (100vw × 100vh) |
| **Borders** | Rounded (12px) | None (edge-to-edge) |
| **Padding** | 1.5rem (24px) | 0 (full bleed) |
| **Header** | Relative position | Fixed position (top) |
| **Footer** | Relative position | Fixed position (bottom) |
| **Button Size** | Regular (h-10) | Large (h-14, 56px) |
| **Tips Section** | Visible | Hidden |
| **Camera Type** | Webcam (user) | Back camera (environment) |
| **Touch Targets** | Mouse-sized | 48px minimum (WCAG) |
| **Scroll Lock** | Not needed | Enabled |
| **Safe Areas** | Not needed | Supported (notch/nav) |

---

## Step-by-Step Visual Flow

### 1️⃣ Report Page - Initial State

```
Desktop & Mobile:
┌────────────────────────────────┐
│ 🏙️ CityScope - Report Issue   │
├────────────────────────────────┤
│                                │
│ Choose Report Mode:            │
│                                │
│ [Manual Report]                │
│ [📷 Photo Analysis] ← Click    │
│                                │
└────────────────────────────────┘
```

### 2️⃣ Photo Analysis Options

```
Desktop:
┌─────────────────────────────────────┐
│ Step 1: Photo Analysis              │
├──────────────────┬──────────────────┤
│  📤 Upload       │  📷 Capture      │ ← Click
│  Photos          │  Photo           │   this
│  Click to upload │  Use your camera │
└──────────────────┴──────────────────┘

Mobile:
┌────────────────────┐
│ Step 1: Photo      │
├────────────────────┤
│  📤 Upload Photos  │
│  Click to upload   │
├────────────────────┤
│  📷 Capture Photo  │ ← Click
│  Use your camera   │   this
└────────────────────┘
```

### 3️⃣ Camera Modal Opens

```
Desktop:
┌─────────────────────────────────────┐
│ Page (dimmed)                       │
│  ┌───────────────────────────────┐  │
│  │ 📷 Capture Photo         ✕   │  │
│  ├───────────────────────────────┤  │
│  │  ⏳ Starting camera...        │  │
│  │     Please allow access       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Mobile (Full Screen):
┌────────────────────┐
│📷 Capture    ✕    │
├────────────────────┤
│                    │
│  ⏳ Starting...    │
│                    │
│  Please allow      │
│  camera access     │
│                    │
│                    │
└────────────────────┘
```

### 4️⃣ Camera Active

```
Desktop:
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │ 📷 Capture Photo  🟢 Active  │  │
│  ├───────────────────────────────┤  │
│  │ ┌─────────────────────────┐  │  │
│  │ │  [Live Camera Feed]     │  │  │
│  │ │  📸 Position within     │  │  │
│  │ └─────────────────────────┘  │  │
│  │ [Cancel]       [Capture]     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Mobile:
┌────────────────────┐
│📷 Capture    ✕    │
│              🟢 Active
├────────────────────┤
│                    │
│ [Live Camera Feed] │
│                    │
│ Edge-to-Edge View  │
│                    │
│ 📸 Position here   │
│                    │
├────────────────────┤
│[Cancel] [Capture]  │
└────────────────────┘
```

### 5️⃣ Photo Captured

```
Desktop & Mobile:
✅ Photo captured successfully!

Photo added to gallery:
┌────────────┬────────────┬────────────┐
│ Photo 1    │ Photo 2    │ Photo 3    │
│ [Preview]  │ [Preview]  │ [Preview]  │
│     ✕      │     ✕      │     ✕      │
└────────────┴────────────┴────────────┘

[🔍 Analyze All Photos] ← Click to analyze
```

---

## UI Element Sizes

### Desktop

```
Header:       h-auto    (flexible)
Video:        16:9      (aspect ratio)
Buttons:      h-10      (40px)
Touch Target: -         (mouse precision)
Modal Width:  max-w-3xl (768px)
Padding:      p-6       (24px)
Border Radius: rounded-lg (12px)
```

### Mobile

```
Header:       h-16       (64px) + safe-area
Video:        100vh      (full viewport height)
Buttons:      h-14       (56px) for capture, h-12 for cancel
Touch Target: 48px min   (WCAG guideline)
Modal Width:  100vw      (full width)
Padding:      p-0        (edge-to-edge)
Border Radius: none      (full screen)
```

---

## Color Palette

### Desktop Mode

```
Background:    bg-background (#ffffff)
Header:        text-foreground (#1a1a1a)
Buttons:       
  - Cancel:    border-input hover:bg-accent
  - Capture:   bg-royal (#162660) text-white
```

### Mobile Mode

```
Background:    bg-black
Header:        bg-black/90 backdrop-blur text-white
Overlay:       bg-black/70 backdrop-blur
Buttons:
  - Cancel:    bg-white/10 border-white/30 text-white
  - Capture:   bg-royal (#162660) text-white shadow-lg
```

---

## Responsive Breakpoints

### Tailwind Breakpoints Used

```css
/* Mobile: Default (< 640px) */
- Full screen modal
- Edge-to-edge layout
- Fixed header/footer
- Large buttons

/* Desktop: sm and above (>= 640px) */
- Centered modal (max-w-3xl)
- Rounded corners
- Relative positioning
- Normal buttons
- Tips section visible
```

### Media Query Logic

```css
/* Mobile-first approach */
.camera-modal {
  /* Mobile styles by default */
  width: 100%;
  height: 100vh;
  
  /* Desktop overrides at sm breakpoint */
  @media (min-width: 640px) {
    width: auto;
    max-width: 768px;
    height: auto;
  }
}
```

---

## Touch Interaction Zones

### Mobile Touch Zones

```
┌────────────────────┐
│ [Header Zone]      │ ← 64px + safe-area (tappable)
│ Non-interactive    │
├────────────────────┤
│                    │
│   [Camera Zone]    │ ← Non-interactive (just viewing)
│                    │
│   No touch         │
│   interaction      │
│                    │
├────────────────────┤
│ [Cancel][Capture]  │ ← 56px + safe-area (large tap targets)
│ Touch zones        │
└────────────────────┘

Touch Target Sizes:
✅ Cancel Button:  ~180px × 56px
✅ Capture Button: ~180px × 56px
✅ Close Button:   48px × 48px (header)

All meet WCAG 2.1 Level AA (44×44px minimum)
```

---

## Animation & Transitions

### Modal Entry (Mobile)

```
Frame 1 (0ms):          Frame 2 (150ms):        Frame 3 (300ms):
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│                │      │     ↑ Sliding  │      │ Fully Visible  │
│                │      │                │      │ 📷 Camera      │
│                │      │                │      │ [Feed]         │
│                │      │                │      │                │
│                │      │ 📷 Camera      │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
Opacity: 0              Opacity: 0.5            Opacity: 1
Transform: Y(100%)      Transform: Y(50%)       Transform: Y(0)
```

### Modal Exit (Mobile)

```
Frame 1 (0ms):          Frame 2 (150ms):        Frame 3 (300ms):
┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Fully Visible  │      │  ↓ Sliding     │      │                │
│ 📷 Camera      │      │                │      │                │
│ [Feed]         │      │                │      │                │
│                │      │ 📷 Camera      │      │                │
│                │      │                │      │                │
└────────────────┘      └────────────────┘      └────────────────┘
Opacity: 1              Opacity: 0.5            Opacity: 0
Transform: Y(0)         Transform: Y(50%)       Transform: Y(100%)
```

---

## Accessibility Features

### Visual Indicators

```
Status:          🟢 Camera Active (green badge)
Loading:         ⏳ Spinner + "Starting camera..."
Error:           ⚠️ Alert icon + error message
Success:         ✅ "Photo captured successfully"
```

### Screen Reader Announcements

```
Modal Open:     "Camera capture dialog opened"
Camera Ready:   "Camera is active and ready"
Capture:        "Photo captured successfully"
Close:          "Camera closed"
Error:          "Error: [specific error message]"
```

### Keyboard Navigation

```
Tab Order:
1. Close button (✕)
2. Cancel button
3. Capture button
4. (cycle back to 1)

Shortcuts:
Esc:    Close modal
Space:  Capture photo (when capture button focused)
Enter:  Activate focused button
```

---

## Summary Diagram

```
┌─────────────────────────────────────────────────┐
│              CityScope Camera Feature            │
├─────────────────────────────────────────────────┤
│                                                  │
│  Desktop (>= 640px)      Mobile (< 640px)       │
│  ─────────────────       ──────────────         │
│                                                  │
│  ┌─────────────┐         ┌────────────┐        │
│  │ Modal 768px │         │ Full Screen│        │
│  │ Rounded     │         │ Edge-to-   │        │
│  │ Centered    │         │ Edge       │        │
│  │ Tips shown  │         │ No tips    │        │
│  │ Webcam      │         │ Back cam   │        │
│  └─────────────┘         └────────────┘        │
│                                                  │
│  Both versions:                                 │
│  • AI analysis ready                            │
│  • 1920×1080 capture                           │
│  • JPEG 95% quality                             │
│  • Instant preview                              │
│  • Clean UI/UX                                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

## Quick Reference

### Desktop
- ✅ Centered modal (768px max)
- ✅ Rounded corners
- ✅ Webcam
- ✅ Tips visible
- ✅ Mouse optimized

### Mobile  
- ✅ Full-screen modal
- ✅ Edge-to-edge
- ✅ Back camera
- ✅ Tips hidden
- ✅ Touch optimized
- ✅ Safe areas
- ✅ Scroll locked

---

**Visual design complete! Test both experiences!** 🖥️📱

