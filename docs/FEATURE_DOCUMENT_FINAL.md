# GRABAMOVIE - Final Feature Implementation Document

**Project:** GRABAMOVIE - Movie Rating & Booking Platform  
**Date:** 2025-01-27  
**Status:** Planning Phase - Awaiting Confirmation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Feature List Overview](#feature-list-overview)
3. [Detailed Feature Specifications](#detailed-feature-specifications)
4. [Complexity Analysis](#complexity-analysis)
5. [Recommended Build Order](#recommended-build-order)
6. [Technical Requirements](#technical-requirements)
7. [Questions for Clarification](#questions-for-clarification)

---

## Executive Summary

This document outlines the implementation plan for 12 new features that will enhance GRABAMOVIE's user experience, visual appeal, and functionality. These features range from UI enhancements (floating buttons, animations) to complex booking workflows (seat selection, checkout) to gamification (battle of movies).

---

## Feature List Overview

### UI/UX Enhancements (1-7)
1. Floating Action Buttons
2. Animated Genre Chips
3. Full-Screen Movie Preview Fade-In
4. Actors List
5. Dynamic Mood-Based Backgrounds
6. Motion Poster Effect (Living Posters)
7. Horizontal Scrolling Sections

### Navigation & Discovery (8-9)
8. Separate Watchlist Page
9. Separate Favorites Page

### Booking System (10)
10. Newly Released & Coming Soon + Complete Booking Flow

### Gamification (11)
11. Weekly "Battle of Movies"

### Branding (12)
12. Dynamic Logo Transformations

---

## Detailed Feature Specifications

### Feature 1: Floating Action Buttons

#### Short Description
A circular floating button positioned at the bottom right corner that opens a quick actions menu with shortcuts to key features.

#### What It Does
- Displays a floating circular button (always visible)
- Opens/closes a menu of quick action buttons when clicked
- Provides shortcuts to: "Top Rated", "Watchlist", "Filters", "Dark Mode" toggle
- Smooth animations for opening/closing
- Stays fixed at bottom right during scrolling

#### What The User Sees
- A circular floating button (usually with an icon like "+" or menu icon) at bottom right
- When clicked, expands to show 4 action buttons:
  - "Top Rated" - scrolls to top rated section
  - "Watchlist" - navigates to watchlist page
  - "Filters" - opens filter dropdown
  - "Dark Mode" - toggles theme
- Smooth expand/collapse animation
- Overlay/dim background when menu is open

#### Components/Pages Needed
- **Component:** `FloatingActionButton.jsx`
- **Sub-components:** `QuickActionMenu.jsx`
- **Integration:** Add to main App component (always visible)
- **Styling:** Fixed position CSS, z-index management

#### Data Required
- None (UI component only)

---

### Feature 2: Animated Genre Chips

#### Short Description
Genre tags under movie cards have subtle glow or pulse animations on hover, creating a neon lights effect.

#### What It Does
- Adds hover effects to genre tags/chips
- Creates subtle glow or pulse animation
- Enhances visual feedback when hovering over movies
- Theme-appropriate animation styles

#### What The User Sees
- Genre chips (e.g., "Action", "Drama") under movie cards
- On hover: chips glow, pulse, or have neon light effect
- Smooth animation transitions
- Different animation styles per theme

#### Components/Pages Needed
- **Update:** Existing genre tag components
- **CSS:** Add hover animations and transitions
- **Integration:** Apply to all genre displays

#### Data Required
- Movie genre data (existing)

---

### Feature 3: Full-Screen Movie Preview Fade-In

#### Short Description
When clicking a movie card, the movie detail page opens with a smooth fade-in transition that mimics a theater curtain opening effect.

#### What It Does
- Replaces current instant page transition
- Adds fade-in animation when movie detail page loads
- Creates theatrical "curtain opening" effect
- Smooth page transitions

#### What The User Sees
- Current page fades out
- Movie detail page fades in smoothly
- Possible curtain-like animation overlay
- Professional, cinematic feel

#### Components/Pages Needed
- **Update:** Movie detail page component
- **CSS/Animations:** Fade-in transitions, possible curtain animation
- **Integration:** Update `handleMovieClick` navigation

#### Data Required
- None (animation only)

---

### Feature 4: Actors List

#### Short Description
Display a list of main actors for each movie on the movie detail page. Data will be fetched from a public API.

#### What It Does
- Fetches actor/cast information from TMDB or similar API
- Displays main actors (e.g., top 5-6) on movie detail page
- Shows actor names and optionally photos
- Links to actor profiles (optional, future enhancement)

#### What The User Seeds
- New section on movie detail page: "Starring" or "Cast"
- List of actor names with photos (circular thumbnails)
- Horizontal scrolling list or grid
- Clickable actor cards (optional)

#### Components/Pages Needed
- **Component:** `ActorsList.jsx`
- **Integration:** Add to `MovieDetailArea` component
- **Backend Endpoint:** `GET /api/movies/:id/actors` or fetch directly from TMDB
- **API Integration:** TMDB API integration for cast data

#### Data Required
- Movie ID (existing)
- Actor names, photos from TMDB API
- TMDB API key (will need to be configured)

---

### Feature 5: Dynamic Mood-Based Backgrounds

#### Short Description
The entire site's background changes color/effect based on the selected movie's genre, creating an immersive mood.

#### What It Does
- Detects current movie's genre (or selected movie)
- Changes site background based on genre:
  - Horror = dark red haze
  - Romance = soft pink glow
  - Sci-fi = neon blue lines
  - Action = sharp metal gradients
- Smooth transitions between backgrounds
- Applies when viewing movie detail page or hovering

#### What The User Sees
- Background color/gradient changes based on movie genre
- Different visual effects per genre
- Smooth color transitions
- Enhanced immersive experience

#### Components/Pages Needed
- **Component/Logic:** Background theme manager
- **CSS:** Dynamic background styles per genre
- **Integration:** Genre detection and background application

#### Data Required
- Movie genre (existing)
- Genre-to-background mapping

---

### Feature 6: Motion Poster Effect (Living Posters)

#### Short Description
Movie posters have subtle animations on hover - movements, glowing edges, or animated effects like smoke/light.

#### What It Does
- Adds hover animations to movie poster images
- Creates subtle movement effects
- Adds glowing edges or particle effects
- Makes posters feel "alive"

#### What The User Sees
- Static movie posters normally
- On hover: subtle animations
  - Slight zoom or parallax
  - Glowing edges
  - Animated smoke/particles around edges
  - Light effects

#### Components/Pages Needed
- **Update:** Movie card/poster components
- **CSS/Animations:** Hover effects, keyframe animations
- **Optional:** SVG overlay effects

#### Data Required
- Movie poster URLs (existing)

---

### Feature 7: Horizontal Scrolling Sections

#### Short Description
Add horizontal scrolling movie sections (Netflix-style) alongside vertical lists, with smooth inertia scrolling.

#### What It Does
- Creates horizontal movie carousels
- Smooth scrolling with momentum/inertia
- Navigation arrows (left/right)
- Touch/swipe support for mobile
- Replaces or supplements vertical grids

#### What The User Sees
- Horizontal movie rows
- Left/right arrow buttons to scroll
- Smooth scrolling with momentum
- Movie cards slide horizontally
- Scroll indicators/dots

#### Components/Pages Needed
- **Component:** `HorizontalMovieCarousel.jsx`
- **Sub-components:** `CarouselArrow.jsx`, `MovieCard.jsx`
- **Integration:** Replace or add alongside existing movie grids
- **Libraries:** May need scroll library (or custom implementation)

#### Data Required
- Movie list data (existing)

---

### Feature 8: Separate Watchlist Page

#### Short Description
Create a dedicated page that displays all movies a user has added to their watchlist. Add "Watchlist" button to top right navigation.

#### What It Does
- Creates new page/route for watchlist
- Fetches user's watchlist movies from database
- Displays all watchlist movies in grid/list
- Adds "Watchlist" navigation link to header
- Allows removal from watchlist

#### What The User Sees
- "Watchlist" button in top right navigation (next to Home, Ratings, Edit)
- Dedicated watchlist page showing all saved movies
- Movie cards in grid layout
- Remove from watchlist option
- Empty state if watchlist is empty

#### Components/Pages Needed
- **Page Component:** `WatchlistPage.jsx`
- **Backend Endpoint:** `GET /api/watchlist/:userId` (likely exists)
- **Integration:** Add navigation link to header, add route to App
- **Update:** Existing watchlist API endpoints

#### Data Required
- User ID (existing)
- Watchlist movies from database (existing table)

---

### Feature 9: Separate Favorites Page

#### Short Description
Create a dedicated page that displays all movies a user has favorited. Add "Favorites" button to top right navigation.

#### What It Does
- Creates new page/route for favorites
- Fetches user's favorite movies from database
- Displays all favorites in grid/list
- Adds "Favorites" navigation link to header
- Allows removal from favorites

#### What The User Sees
- "Favorites" button in top right navigation
- Dedicated favorites page showing all favorited movies
- Movie cards in grid layout
- Remove from favorites option
- Empty state if no favorites

#### Components/Pages Needed
- **Page Component:** `FavoritesPage.jsx`
- **Backend Endpoint:** `GET /api/favourites/:userId` (likely exists)
- **Integration:** Add navigation link to header, add route to App
- **Update:** Existing favourites API endpoints

#### Data Required
- User ID (existing)
- Favorites movies from database (existing table)

---

### Feature 10: Newly Released & Coming Soon + Complete Booking Flow

#### Short Description
Complete booking system with TMDB API integration for real movie data, seat selection, snacks, and fake checkout.

#### What It Does

**Part A: Movie Discovery**
- Fetches "now playing" movies from TMDB API for "Newly Released"
- Fetches "upcoming" movies from TMDB API for "Coming Soon"
- Displays movie posters, titles, descriptions, release dates
- "Buy Ticket" button on each movie

**Part B: Seat Selection**
- Modal or separate page with seat selection
- Grid of seats (8 rows × 10 seats = 80 seats)
- Some seats shown as "reserved" (grayed out)
- User clicks to select seats
- Selected seats highlighted
- Real-time seat availability

**Part C: Snacks/Add-Ons**
- Modal/section asking "Would you like to add snacks?"
- Items: Popcorn, Soda, Combo, Nachos
- Each shows image and price
- User selects items and sees summary

**Part D: Fake Checkout**
- Purchase summary page
- Shows: selected movie, seats, snacks, total price
- "Confirm Order" button
- Success message: "Thank you! Your ticket has been reserved."
- No real payment processing

#### What The User Sees

**Discovery Sections:**
- "Newly Released" section with movie cards
- "Coming Soon" section with movie cards
- Each card: poster, title, description, release date, "Buy Ticket" button

**Seat Selection:**
- Visual theater layout
- Rows labeled (A-H) and seats numbered (1-10)
- Screen at top
- Selected seats highlighted
- Reserved seats grayed out
- Continue button

**Snacks:**
- Grid of snack items with images
- Quantity selectors
- Cart summary
- Continue to checkout button

**Checkout:**
- Order summary page
- Movie info, seats list, snacks list
- Total price breakdown
- Confirm Order button
- Success confirmation screen

#### Components/Pages Needed
- **Discovery:** 
  - `NewlyReleasedSection.jsx`
  - `ComingSoonSection.jsx`
  - `BuyTicketButton.jsx`
- **Booking:**
  - `SeatSelectionModal.jsx` or `SeatSelectionPage.jsx`
  - `SeatMap.jsx`
  - `Seat.jsx`
- **Snacks:**
  - `SnacksModal.jsx` or `SnacksPage.jsx`
  - `SnackItem.jsx`
  - `SnackCart.jsx`
- **Checkout:**
  - `CheckoutPage.jsx`
  - `CheckoutConfirmation.jsx`
- **Backend:**
  - TMDB API integration service
  - Endpoints for bookings, seats, snacks

#### Data Required
- **From TMDB API:**
  - Movie data (posters, titles, descriptions, release dates)
  - Cast/actors information
- **Database:**
  - Seat layouts and availability
  - Snack catalog
  - Booking records
- **New Tables:**
  - `showings` (movie showtimes)
  - `seats` (theater seats)
  - `snacks` (snack catalog)
  - `bookings` (completed bookings)
  - `booking_seats` (seats in bookings)
  - `booking_snacks` (snacks in bookings)

---

### Feature 11: Weekly "Battle of Movies"

#### Short Description
Gamification feature where two movies appear side-by-side, users vote, and the winner enters a Hall of Fame.

#### What It Does
- Selects two random movies for the week
- Displays them side-by-side
- Users vote for their favorite
- Tracks votes per movie
- At end of week, winner announced and added to Hall of Fame
- Shows weekly battle history

#### What The User Sees
- "Battle of Movies" section/page
- Two movie cards side by side
- "Vote" button on each
- Vote count displayed
- "Hall of Fame" section showing past winners
- Current week's battle status

#### Components/Pages Needed
- **Component:** `BattleOfMovies.jsx`
- **Sub-components:** `BattleCard.jsx`, `HallOfFame.jsx`
- **Backend:**
  - `GET /api/battle/current` - Get current battle
  - `POST /api/battle/vote` - Submit vote
  - `GET /api/battle/hall-of-fame` - Get past winners
- **Database:**
  - `movie_battles` (weekly battles)
  - `battle_votes` (user votes)

#### Data Required
- Movie data (existing)
- Battle week tracking
- User votes
- Hall of Fame records

---

### Feature 12: Dynamic Logo Transformations

#### Short Description
The site logo transforms visually based on theme or event (cracked for horror, snow for holidays, golden for anniversary). Add Anniversary theme to theme selector.

#### What It Does
- Detects current theme or special events
- Applies different logo styles:
  - Horror theme → cracked logo effect
  - Holiday theme → snow particles on logo
  - Anniversary theme → golden/shiny logo
- Adds Anniversary theme to theme selector
- Animated logo transformations

#### What The User Sees
- Logo in header transforms based on theme
- Different visual effects per theme/event
- Smooth transitions when theme changes
- Anniversary theme option in theme selector

#### Components/Pages Needed
- **Update:** Logo component in header
- **CSS:** Logo variations per theme
- **Integration:** Theme detection and logo styling
- **Update:** Add Anniversary theme to `availableThemes`

#### Data Required
- Current theme (existing)
- Logo image/component (existing)

---

## Complexity Analysis

### Low Complexity Features

#### 1. Floating Action Buttons
**Why Low:** Simple UI component, no complex logic, just menu toggle and navigation
**Effort:** 2-3 hours

#### 2. Animated Genre Chips
**Why Low:** CSS animations only, no logic changes
**Effort:** 1-2 hours

#### 3. Full-Screen Movie Preview Fade-In
**Why Low:** CSS transitions, minimal code changes
**Effort:** 1-2 hours

#### 6. Motion Poster Effect
**Why Low:** CSS hover animations
**Effort:** 2-3 hours

#### 12. Dynamic Logo Transformations
**Why Low:** CSS variations based on theme, add theme option
**Effort:** 2-3 hours

---

### Medium Complexity Features

#### 4. Actors List
**Why Medium:** Requires TMDB API integration, new component, data fetching
**Effort:** 3-4 hours

#### 5. Dynamic Mood-Based Backgrounds
**Why Medium:** Dynamic CSS based on genre, multiple variations
**Effort:** 2-3 hours

#### 7. Horizontal Scrolling Sections
**Why Medium:** Custom carousel implementation, smooth scrolling logic
**Effort:** 4-5 hours

#### 8. Separate Watchlist Page
**Why Medium:** New page, routing, uses existing data/API
**Effort:** 2-3 hours

#### 9. Separate Favorites Page
**Why Medium:** New page, routing, uses existing data/API
**Effort:** 2-3 hours

---

### High Complexity Features

#### 10. Complete Booking Flow (Newly Released + Coming Soon + Booking)
**Why High:**
- TMDB API integration
- Multiple new pages/components (seat selection, snacks, checkout)
- Complex state management across flow
- Multiple database tables
- Real-time seat availability
- Complete booking workflow

**Effort:** 15-20 hours (broken into phases)

#### 11. Weekly Battle of Movies
**Why High:**
- Voting system logic
- Weekly reset mechanism
- Hall of Fame tracking
- Battle selection algorithm
- Database schema for battles/votes

**Effort:** 6-8 hours

---

## Recommended Build Order

### Phase 1: Quick UI Wins (Low Complexity)
**Start with these for immediate visual impact:**

1. **Animated Genre Chips** (Low) - Quick visual enhancement
2. **Full-Screen Movie Preview Fade-In** (Low) - Improves existing flow
3. **Motion Poster Effect** (Low) - Enhances movie cards
4. **Dynamic Logo Transformations** (Low) - Branding enhancement

**Why First:**
- Quick wins
- No dependencies
- Immediate visual improvements
- Builds momentum

---

### Phase 2: Navigation & Organization (Medium Complexity)
**Improve site navigation:**

5. **Separate Watchlist Page** (Medium)
6. **Separate Favorites Page** (Medium)
7. **Floating Action Buttons** (Low) - Connects everything

**Why Second:**
- Improves user experience
- Uses existing data (no new APIs)
- Foundation for better organization

---

### Phase 3: Enhanced Discovery (Medium Complexity)
**Improve movie discovery:**

8. **Actors List** (Medium) - Requires TMDB API setup
9. **Dynamic Mood-Based Backgrounds** (Medium)
10. **Horizontal Scrolling Sections** (Medium)

**Why Third:**
- Builds on existing movie pages
- Enhances discovery
- Actors list requires API setup (good foundation for Feature 10)

---

### Phase 4: Gamification (High Complexity)
**Add engagement features:**

11. **Weekly Battle of Movies** (High)

**Why Fourth:**
- Standalone feature
- Adds engagement
- Can be built while planning booking system

---

### Phase 5: Complete Booking System (High Complexity)
**Final major feature:**

12. **Newly Released & Coming Soon + Complete Booking Flow** (High)
   - Break into sub-phases:
     1. TMDB API integration + Newly Released section
     2. Coming Soon section
     3. Buy Ticket button + navigation
     4. Seat Selection
     5. Snacks
     6. Fake Checkout

**Why Last:**
- Most complex feature
- Requires all previous navigation improvements
- Needs TMDB API fully set up
- Multiple interdependent components

---

## Complete Build Sequence

```
Week 1: UI Enhancements
├── 1. Animated Genre Chips
├── 2. Full-Screen Movie Preview Fade-In
├── 3. Motion Poster Effect
└── 4. Dynamic Logo Transformations

Week 1-2: Navigation
├── 5. Separate Watchlist Page
├── 6. Separate Favorites Page
└── 7. Floating Action Buttons

Week 2: Discovery Enhancements
├── 8. Actors List (requires TMDB API setup)
├── 9. Dynamic Mood-Based Backgrounds
└── 10. Horizontal Scrolling Sections

Week 3: Gamification
└── 11. Weekly Battle of Movies

Week 3-4: Booking System
├── 12a. TMDB Integration + Newly Released
├── 12b. Coming Soon Section
├── 12c. Buy Ticket Button
├── 12d. Seat Selection
├── 12e. Snacks
└── 12f. Fake Checkout
```

---

## Technical Requirements

### External APIs Needed

1. **TMDB (The Movie Database) API**
   - Need: API key
   - Used for: Movie data, cast/actors, now playing, upcoming movies
   - Endpoints needed:
     - `/movie/now_playing`
     - `/movie/upcoming`
     - `/movie/{id}/credits` (actors)

### Database Schema Changes

**New Tables:**
1. `movie_battles` - Weekly battles
2. `battle_votes` - User votes in battles
3. `showings` - Movie showtimes
4. `seats` - Theater seats
5. `snacks` - Snack catalog
6. `bookings` - Completed bookings
7. `booking_seats` - Seats in bookings
8. `booking_snacks` - Snacks in bookings

**New Columns:**
- `movies.release_date` (DATE) - For filtering newly released/coming soon

### Frontend Architecture

**New Pages:**
- `/watchlist`
- `/favorites`
- `/battle` (Battle of Movies)
- `/seats` (Seat selection)
- `/snacks` (Snack selection)
- `/checkout` (Checkout)
- `/booking-confirmation` (Success)

**New Components:**
- FloatingActionButton.jsx
- ActorsList.jsx
- HorizontalMovieCarousel.jsx
- BattleOfMovies.jsx
- SeatSelectionPage.jsx
- SnacksPage.jsx
- CheckoutPage.jsx
- And many more...

---

## Questions for Clarification

Before I proceed, please clarify:

### Feature 1: Floating Action Buttons
1. Should the menu close when clicking outside or only when clicking the button again?

### Feature 4: Actors List
2. How many actors should we show? (Top 5? Top 10?)
3. Should clicking an actor do anything? (Future: actor detail page?)

### Feature 5: Dynamic Mood-Based Backgrounds
4. Should this apply only on movie detail page, or entire site when viewing a movie?
5. Do you want specific background patterns for each genre? (I have horror=red, romance=pink, sci-fi=blue, action=metal - are there others?)

### Feature 7: Horizontal Scrolling Sections
6. Which sections should be horizontal? All movie lists or specific ones?
7. Should we keep vertical scrolling as well, or replace entirely?

### Feature 10: Booking System
8. **Theater Layout:** How many rows and seats? (You mentioned 8×10 = 80 seats - is that correct?)
9. **Showtimes:** Should users select a date/time, or just assume one showing per movie?
10. **Seat Types:** Should there be different seat types (standard, premium, VIP) with different prices?
11. **Snacks:** Should we include images for snacks? Should there be categories?
12. **Reserved Seats:** Should some seats be pre-reserved for demo purposes?
13. **TMDB API:** Do you have a TMDB API key, or should I help you get one?

### Feature 11: Battle of Movies
14. How should movies be selected for battle? (Random? Highest rated? User suggestions?)
15. Should users be able to vote multiple times or once per battle?
16. How long is a "week"? (Monday-Sunday? Calendar week?)

### Feature 12: Logo Transformations
17. Should Anniversary theme be a full theme (like Christmas/Halloween) with colors, or just logo styling?
18. What should trigger Anniversary mode? (Date-based? User-selectable?)

---

## Next Steps

**Please review this document and:**
1. ✅ Confirm the features are correctly understood
2. ✅ Answer the clarification questions above
3. ✅ Approve the build order or suggest changes
4. ✅ Let me know which feature to start with

**I will NOT start coding until you confirm and tell me which feature to begin with.**

