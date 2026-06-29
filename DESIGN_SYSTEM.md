# 🎨 CityScope Modern Design System

## Overview
CityScope now features a professional, clean, and modern design system that emphasizes clarity, usability, and visual appeal. This design system replaces the previous AI-generated aesthetics with a polished, human-centered approach.

---

## 🎨 Color Palette

### Primary Colors
- **Royal Blue** - Main brand color
  - `royal-900`: #1e3a8a (Primary actions, headers)
  - `royal-700`: #1d4ed8 (Hover states)
  - `royal-500`: #3b82f6 (Accents)

- **Sky Blue** - Secondary color
  - `powder-300`: #7dd3fc (Secondary actions, highlights)
  - `powder-100`: #e0f2fe (Backgrounds, subtle accents)

### Neutral Colors
- **Slate** - Text and backgrounds
  - `slate-900`: #0f172a (Primary text)
  - `slate-700`: #334155 (Secondary text)
  - `slate-400`: #94a3b8 (Muted text)
  - `slate-200`: #e2e8f0 (Borders)
  - `slate-100`: #f1f5f9 (Light backgrounds)
  - `slate-50`: #f8fafc (Subtle backgrounds)
  - `white`: #ffffff (Cards, surfaces)

### Semantic Colors
- **Success**: #059669 (emerald-600) - Resolved issues, success states
- **Warning**: #f59e0b (amber-500) - Pending issues, warnings
- **Info**: #0ea5e9 (sky-500) - In-progress issues, information
- **Danger**: #dc2626 (red-600) - Errors, critical states

---

## 📝 Typography

### Font Family
- **Primary**: Inter (with variable font support)
- **Fallback**: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### Font Weights
- **Light**: 300
- **Regular**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700
- **Extrabold**: 800

### Type Scale
```
h1: text-4xl md:text-5xl lg:text-6xl (36-60px)
h2: text-3xl md:text-4xl lg:text-5xl (30-48px)
h3: text-2xl md:text-3xl lg:text-4xl (24-36px)
h4: text-xl md:text-2xl lg:text-3xl (20-30px)
h5: text-lg md:text-xl lg:text-2xl (18-24px)
h6: text-base md:text-lg lg:text-xl (16-20px)
Body: text-base (16px)
Small: text-sm (14px)
Tiny: text-xs (12px)
```

### Typography Classes
- `.text-heading` - Bold display font for headings
- `.text-subheading` - Semibold for subheadings
- `.text-body` - Regular body text with good readability
- `.text-muted` - Smaller, lighter text for secondary info
- `.text-tiny` - Extra small text for labels

---

## 🧩 Components

### Buttons

#### Primary Button
```tsx
className="bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-soft hover:shadow-sleek transition-all duration-200 rounded-lg px-4 py-2 active:scale-[0.98]"
```

#### Secondary Button
```tsx
className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold transition-all duration-200 rounded-lg px-4 py-2 active:scale-[0.98]"
```

#### Ghost Button
```tsx
className="hover:bg-slate-100 text-slate-700 font-medium transition-all duration-200 rounded-lg px-4 py-2 active:scale-[0.98]"
```

#### Utility Classes
- `.btn-primary` - Main call-to-action
- `.btn-secondary` - Secondary actions
- `.btn-ghost` - Subtle actions
- `.btn-outline` - Outlined variant
- `.btn-royal` - Brand gradient
- `.btn-glass` - Glass morphism effect

### Cards

#### Standard Card
```tsx
className="bg-white rounded-xl shadow-soft border border-slate-200/60 p-6"
```

#### Interactive Card
```tsx
className="card-interactive" // Includes hover effects
```

#### Premium Card
```tsx
className="card-premium" // Gradient background
```

#### Glass Card
```tsx
className="card-glass" // Frosted glass effect
```

### Badges & Status

#### Status Badges
```tsx
// Pending
className="status-pending" 
// bg-amber-50 text-amber-700 border-amber-200

// In Progress
className="status-progress"
// bg-sky-50 text-sky-700 border-sky-200

// Resolved
className="status-resolved"
// bg-emerald-50 text-emerald-700 border-emerald-200
```

#### Chips
```tsx
className="chip" // Interactive tag/filter chips
```

---

## 🎭 Shadows

### Shadow System
- `shadow-soft`: Subtle elevation (1-3px blur)
- `shadow-sleek`: Medium elevation (4-6px blur)
- `shadow-sleek-lg`: High elevation (10-15px blur)
- `shadow-sleek-xl`: Maximum elevation (20-25px blur)
- `shadow-glass`: Frosted glass effect
- `shadow-royal`: Blue-tinted shadow
- `shadow-powder`: Light blue-tinted shadow

### Usage Guidelines
- Use `shadow-soft` for cards at rest
- Use `shadow-sleek` for hover states
- Use `shadow-sleek-lg` for modals and dropdowns
- Use `shadow-glass` for glass morphism effects

---

## 🎬 Animations

### Animation Classes
- `.animate-fade-in` - Simple fade in (300ms)
- `.animate-fade-in-up` - Fade in with upward motion (400ms)
- `.animate-scale-in` - Scale in from 97% (200ms)
- `.animate-slide-in-left` - Slide from left (400ms)
- `.animate-slide-in-right` - Slide from right (400ms)
- `.animate-shimmer` - Loading shimmer effect
- `.animate-pulse-soft` - Soft pulsing (2s loop)
- `.animate-float` - Floating animation (3s loop)

### Hover Effects
- `.hover-lift` - Lifts element on hover (-4px)
- `.hover-scale` - Scales to 102% on hover
- `.hover-card` - Card-specific hover effect
- `.hover-subtle` - Subtle background change

### Stagger Delays
Use for sequential animations:
- `.stagger-1` through `.stagger-6` (50ms-300ms)

### Easing Functions
- **Default**: `ease-out` - Quick start, slow end
- **Interactive**: `cubic-bezier(0.16, 1, 0.3, 1)` - Smooth, natural
- **Bounce**: `cubic-bezier(0.34, 1.56, 0.64, 1)` - Playful bounce

---

## 📐 Spacing

### Spacing Scale
```
0.5: 2px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
```

### Common Patterns
- Card padding: `p-6` (24px)
- Button padding: `px-4 py-2` (16px/8px)
- Section spacing: `py-12 md:py-16 lg:py-20`
- Gap between elements: `gap-4` or `gap-6`

---

## 🔘 Border Radius

### Radius Scale
- `rounded-sm`: 6px - Small elements
- `rounded-md`: 10px - Inputs, badges
- `rounded-lg`: 12px - Buttons, cards
- `rounded-xl`: 16px - Large cards
- `rounded-2xl`: 20px - Feature sections
- `rounded-3xl`: 24px - Hero sections
- `rounded-full`: Circle - Avatars, icons

---

## 🎨 Gradients

### Brand Gradients
```css
bg-gradient-royal: from-blue-900 to-blue-600
bg-gradient-powder: from-sky-300 to-sky-100
bg-gradient-civic: from-blue-800 to-blue-500
bg-gradient-hero: from-blue-900 via-blue-600 to-sky-300
```

### Background Gradients
```css
bg-gradient-sleek: from-white to-slate-50
bg-gradient-soft: from-slate-50 to-slate-200
bg-gradient-card: from-white to-slate-50 (diagonal)
```

### Text Gradients
```tsx
className="text-gradient-royal" // Blue gradient text
className="text-gradient-powder" // Sky blue gradient text
```

---

## 📱 Responsive Design

### Breakpoints
```
sm: 640px   (Mobile landscape, small tablets)
md: 768px   (Tablets)
lg: 1024px  (Laptops, small desktops)
xl: 1280px  (Desktops)
2xl: 1536px (Large desktops)
```

### Responsive Utilities
```tsx
// Hide on mobile, show on desktop
className="hidden md:block"

// Stack on mobile, grid on desktop
className="flex flex-col md:grid md:grid-cols-2"

// Responsive text
className="text-responsive-xl" // Auto-scales with breakpoints
```

---

## ♿ Accessibility

### Focus States
All interactive elements have visible focus indicators:
```css
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:ring-offset-2
```

### Color Contrast
- All text meets WCAG AA standards (4.5:1 minimum)
- Important actions meet AAA standards (7:1 minimum)

### Motion
Respects `prefers-reduced-motion`:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 🎯 Best Practices

### Do's ✅
- Use consistent spacing from the spacing scale
- Apply shadows subtly for depth
- Use animations purposefully (enhance UX, not distract)
- Maintain high color contrast for readability
- Use semantic colors for status indicators
- Keep border radius consistent within component types

### Don'ts ❌
- Don't mix different shadow styles on same page
- Don't overuse animations (avoid motion sickness)
- Don't use pure black (#000000) - use slate-900 instead
- Don't create custom colors - use the design system
- Don't apply heavy shadows to small elements
- Don't use more than 3 font sizes on one screen

---

## 🚀 Quick Start Examples

### Modern Card with Hover
```tsx
<div className="card-interactive">
  <h3 className="text-heading text-xl mb-2">Card Title</h3>
  <p className="text-body">Card content goes here</p>
</div>
```

### Primary Action Button
```tsx
<button className="btn-primary px-6 py-3">
  Get Started
</button>
```

### Status Badge
```tsx
<span className="status-resolved">
  Resolved
</span>
```

### Animated Section
```tsx
<section className="animate-fade-in-up section-spacing">
  <div className="container-wide">
    {/* Content */}
  </div>
</section>
```

---

## 📚 Resources

### Design Tokens
All design tokens are defined in `tailwind.config.ts`

### CSS Files
- `src/index.css` - Base styles and utilities
- `src/styles/animations.css` - Animation definitions
- `src/styles/globals.css` - Global typography and elements

### Inspiration
- Apple Human Interface Guidelines
- Material Design 3
- Tailwind CSS Design System
- Modern web best practices

---

## 🔄 Migration from Old Design

### Color Updates
- `#162660` (old royal) → `#1e3a8a` (new royal-900)
- `#D0E6FD` (old powder) → `#7dd3fc` (new powder-300)
- `#F1E4D1` (old bone) → `#f8fafc` (new slate-50)

### Shadow Updates
- `shadow-sleek` - Now more subtle and modern
- Removed overly dramatic shadows
- Added `shadow-soft` for minimal elevation

### Border Radius
- Reduced from 16px default to 12px
- More conservative, professional look
- Still rounded enough to feel modern

---

## 💡 Tips for Developers

1. **Use Tailwind Classes**: Prefer Tailwind utilities over custom CSS
2. **Consistent Spacing**: Always use the spacing scale (no arbitrary values)
3. **Animation Sparingly**: Only animate state changes and interactions
4. **Test Accessibility**: Always check keyboard navigation and screen readers
5. **Mobile First**: Design for mobile, enhance for desktop
6. **Performance**: Use CSS transforms for animations (GPU accelerated)

---

**Last Updated**: December 2024
**Version**: 2.0.0

