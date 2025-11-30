# GRABAMOVIE - Feature Implementation Document

**Project:** GRABAMOVIE - Movie Rating & Booking Platform  
**Date:** 2025-01-27  
**Status:** Planning Phase - Awaiting Confirmation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Features Overview](#current-features-overview)
3. [New Features List](#new-features-list)
4. [Feature Details](#feature-details)
5. [Complexity Analysis](#complexity-analysis)
6. [Recommended Build Order](#recommended-build-order)
7. [Technical Considerations](#technical-considerations)

---

## Executive Summary

This document outlines the implementation plan for 6 new features that will transform GRABAMOVIE from a movie rating platform into a complete movie booking experience. The features range from simple display enhancements to complex booking workflows with seat selection and checkout processes.

---

## Current Features Overview

### Existing Functionality
- ✅ User Authentication (Login/Signup)
- ✅ Movie Browsing & Discovery
- ✅ Movie Rating System (1-5 stars)
- ✅ Comments/Reviews System
- ✅ Favorites & Watchlist
- ✅ User Profiles with Customization
- ✅ Search & Filter Movies
- ✅ Movie Detail Pages
- ✅ IMDB Ratings Integration
- ✅ Theme Customization
- ✅ Top Rated Movies Section

---

## New Features List

1. **Newly Released Movies**
2. **Coming Soon Movies**
3. **Buy Ticket**
4. **Seat Selection**
5. **Snacks**
6. **Fake Checkout**

---

## Feature Details

### Feature 1: Newly Released Movies

#### Short Description
Display a dedicated section showcasing movies that were recently released (within the last 30-90 days).

#### What It Does
- Filters movies from the database based on release date (year/month)
- Shows movies released in the current or previous month
- Provides quick access to the latest releases
- Integrates with existing movie detail pages

#### What The User Sees
- A new section on the Home page titled "Newly Released"
- Grid layout showing movie posters/cards (similar to Top Rated section)
- Each card shows: poster, title, year, genre
- Clicking a card navigates to movie detail page
- Movies are automatically sorted by release date (newest first)

#### Components/Pages Needed
- **Frontend Component:** `NewlyReleasedSection.jsx`
- **Backend Endpoint:** `GET /api/movies/newly-released`
- **Database Query:** Filter movies by `year` and potentially a `release_date` field
- **Integration:** Add section to Home page (similar to top-rated-section)

#### Data Required
- Current date for comparison
- Movie `year` field (existing)
- Optionally: Add `release_date` DATE field to movies table for more precise filtering
- Movie poster, title, genre (existing)

---

### Feature 2: Coming Soon Movies

#### Short Description
Display movies that will be released in the future, creating anticipation and allowing users to add them to watchlists.

#### What It Does
- Shows movies with release dates in the future (next 3-6 months)
- Allows users to "pre-watchlist" upcoming movies
- Displays release countdown or "Coming [Month Year]" text
- Integrates with existing watchlist functionality

#### What The User Sees
- A new section on the Home page titled "Coming Soon"
- Grid layout showing movie posters/cards
- "Coming [Month Year]" or countdown badge on each card
- "Notify Me" or "Add to Watchlist" button
- Clicking card shows preview/trailer information

#### Components/Pages Needed
- **Frontend Component:** `ComingSoonSection.jsx`
- **Backend Endpoint:** `GET /api/movies/coming-soon`
- **Database:** Requires `release_date` DATE field in movies table
- **Integration:** Add section to Home page

#### Data Required
- `release_date` DATE field in movies table (NEW)
- Current date for comparison
- Movie poster, title, genre (existing)
- Trailer URL (existing, optional)

---

### Feature 3: Buy Ticket

#### Short Description
Add a "Buy Ticket" button to movie detail pages that initiates the booking process for authenticated users.

#### What It Does
- Displays "Buy Ticket" button on movie detail pages
- Only visible for "Newly Released" or currently available movies
- Initiates booking flow (leads to seat selection)
- Checks if user is authenticated
- Stores booking session in state/localStorage

#### What The User Sees
- Prominent "Buy Ticket" button on movie detail page
- Button appears next to "Watch Trailer" or in action area
- Tooltip/text: "Purchase tickets for this movie"
- Disabled state with message if not logged in
- Clicking button navigates to seat selection page

#### Components/Pages Needed
- **Frontend Component:** `BuyTicketButton.jsx` (reusable button)
- **Integration:** Add to `MovieDetailArea` component
- **State Management:** Track selected movie for booking
- **Navigation:** Route to seat selection page

#### Data Required
- Movie ID (existing)
- User authentication status (existing)
- Movie availability status (can be derived from release_date)
- No new database tables needed initially

---

### Feature 4: Seat Selection

#### Short Description
Interactive seat map where users can select their preferred seats for a movie showing.

#### What It Does
- Displays a theater-style seat map with rows and seats
- Shows available, selected, and occupied seats
- Allows users to select multiple seats
- Shows pricing based on seat type (standard, premium, VIP)
- Validates seat availability
- Stores selected seats in booking state

#### What The User Sees
- A dedicated "Select Seats" page
- Visual seat map with theater layout
- Legend showing: Available (gray), Selected (blue), Occupied (red)
- Row labels (A, B, C, etc.) and seat numbers (1-20)
- Screen/display area at top
- Seat count and total price display
- "Continue to Snacks" or "Proceed" button

#### Components/Pages Needed
- **Frontend Component:** `SeatSelectionPage.jsx` (full page)
- **Sub-components:** 
  - `SeatMap.jsx` (theater layout)
  - `Seat.jsx` (individual seat component)
  - `SeatLegend.jsx` (legend component)
- **Backend Endpoint:** 
  - `GET /api/bookings/seats/:movieId` - Get seat availability
  - `POST /api/bookings/reserve-seats` - Reserve seats temporarily
- **Database Tables:** 
  - `showings` (movie showtimes)
  - `seats` (theater layout)
  - `seat_reservations` (temporary holds)

#### Data Required
- Movie ID (existing)
- Theater layout configuration (rows, seats per row)
- Seat types/pricing (standard, premium, VIP)
- Showtime/date selection
- Seat availability status
- Reservation timestamps

---

### Feature 5: Snacks

#### Short Description
Allow users to add snacks and beverages to their booking before checkout.

#### What It Does
- Displays catalog of available snacks/drinks
- Shows prices and descriptions
- Add/remove items with quantity selector
- Updates cart total in real-time
- Stores snack selections in booking state
- Integrates with checkout flow

#### What The User Sees
- A dedicated "Add Snacks" page (or section)
- Grid/list of snack items with images
- Each item shows: name, price, description
- "+" and "-" buttons to adjust quantity
- Cart summary showing selected items and totals
- "Continue to Checkout" button
- Option to skip snacks

#### Components/Pages Needed
- **Frontend Component:** `SnacksPage.jsx` or `SnacksSection.jsx`
- **Sub-components:**
  - `SnackItem.jsx` (individual snack card)
  - `SnackCart.jsx` (cart summary sidebar)
  - `QuantitySelector.jsx` (reusable component)
- **Backend Endpoint:**
  - `GET /api/snacks` - Get available snacks catalog
- **Database Table:**
  - `snacks` (snack items catalog)

#### Data Required
- Snack name, description, price
- Snack image URL
- Snack category (popcorn, drinks, candy, etc.)
- Available/in-stock status
- User's selected quantities

---

### Feature 6: Fake Checkout

#### Short Description
Complete the booking flow with a checkout page that processes a fake payment and confirms the booking.

#### What It Does
- Shows booking summary (movie, seats, snacks, total)
- Displays fake payment form (no real payment processing)
- Validates form inputs
- Processes "payment" (fake success)
- Creates booking record in database
- Sends confirmation (visual confirmation page)
- Stores booking history for user

#### What The User Sees
- "Checkout" page with booking summary
- Order breakdown: Tickets, Seats, Snacks, Subtotal, Fees, Total
- Payment form (fake): Card number, Name, CVV, Expiry
- "Complete Purchase" button
- Loading state during "processing"
- Success confirmation page with booking details
- "View My Bookings" link
- Option to return home

#### Components/Pages Needed
- **Frontend Component:** `CheckoutPage.jsx` (full page)
- **Sub-components:**
  - `BookingSummary.jsx` (order breakdown)
  - `PaymentForm.jsx` (fake payment inputs)
  - `CheckoutConfirmation.jsx` (success page)
- **Backend Endpoints:**
  - `POST /api/bookings/create` - Create booking record
  - `GET /api/bookings/:userId` - Get user's bookings
- **Database Tables:**
  - `bookings` (completed bookings)
  - `booking_seats` (seats in booking)
  - `booking_snacks` (snacks in booking)

#### Data Required
- Complete booking details (movie, showtime, seats, snacks)
- User ID
- Booking date/time
- Total amount
- Booking status (confirmed, cancelled, etc.)
- Booking reference number

---

## Complexity Analysis

### Low Complexity Features

#### 1. Newly Released Movies
**Why Low Complexity:**
- Simple database query filtering by date
- Reuses existing movie card components
- Similar structure to existing "Top Rated" section
- No new database tables required (can use existing `year` field)
- Minimal state management
- Straightforward UI integration

**Effort Estimate:** 2-3 hours

#### 2. Coming Soon Movies
**Why Low Complexity:**
- Similar to "Newly Released" but with future dates
- Reuses existing components and patterns
- Only requires adding `release_date` field to database
- Simple date comparison logic
- Can reuse watchlist functionality

**Effort Estimate:** 3-4 hours

---

### Medium Complexity Features

#### 3. Buy Ticket Button
**Why Medium Complexity:**
- Simple UI component but requires:
  - State management for booking flow
  - Navigation routing logic
  - Conditional rendering based on movie availability
  - Authentication checks
- Needs to integrate with existing movie detail page
- Sets up foundation for booking flow

**Effort Estimate:** 2-3 hours

#### 4. Snacks
**Why Medium Complexity:**
- Requires new database table for snacks catalog
- Shopping cart-like functionality (add/remove items)
- Quantity management and price calculations
- State management for cart
- UI design for snack catalog
- Integration with checkout flow

**Effort Estimate:** 4-6 hours

---

### High Complexity Features

#### 5. Seat Selection
**Why High Complexity:**
- Complex UI: Interactive seat map with visual representation
- Multiple database tables needed (showings, seats, reservations)
- Real-time seat availability logic
- Seat state management (available, selected, occupied)
- Theater layout configuration
- Temporary reservation system
- Multiple components with interdependencies
- Complex state management

**Effort Estimate:** 8-12 hours

#### 6. Fake Checkout
**Why High Complexity:**
- Complete booking workflow integration
- Multiple database tables (bookings, booking_seats, booking_snacks)
- Form validation and error handling
- Booking confirmation system
- Order summary calculations
- Booking history/management
- State persistence across multiple pages
- Success/error handling flows

**Effort Estimate:** 6-10 hours

---

## Recommended Build Order

### Phase 1: Foundation & Discovery (Low Complexity)
**Build these first to establish patterns and UI structure:**

1. **Newly Released Movies** (Low)
   - Establishes date-based filtering pattern
   - Creates reusable section component
   - Minimal dependencies

2. **Coming Soon Movies** (Low)
   - Similar pattern to Newly Released
   - Adds `release_date` field to database
   - Completes the discovery features

**Why this order:**
- Both are standalone features
- They enhance the home page experience
- No dependencies on other new features
- Quick wins that improve user experience immediately

---

### Phase 2: Booking Initiation (Medium Complexity)
**Lay the groundwork for the booking flow:**

3. **Buy Ticket Button** (Medium)
   - Adds booking entry point
   - Establishes booking state management
   - Required before seat selection

**Why this order:**
- Users need a way to start the booking process
- Sets up navigation flow to seat selection
- Simple but essential piece

---

### Phase 3: Core Booking Experience (High Complexity)
**Build the main booking functionality:**

4. **Seat Selection** (High)
   - Core booking feature
   - Most complex UI component
   - Required before checkout

5. **Snacks** (Medium)
   - Can be built in parallel or after seat selection
   - Adds value but not critical for checkout
   - Enhances booking experience

**Why this order:**
- Seat selection is the core booking experience
- Snacks can be added as enhancement
- Both feed into checkout

---

### Phase 4: Completion (High Complexity)
**Finish the booking flow:**

6. **Fake Checkout** (High)
   - Requires all previous features complete
   - Final step in booking workflow
   - Depends on: Buy Ticket → Seat Selection → Snacks

**Why this order:**
- Must be built last as it depends on all booking data
- Completes the entire booking flow
- Requires booking state from all previous steps

---

## Complete Build Sequence Summary

```
Phase 1: Discovery (Week 1)
├── 1. Newly Released Movies
└── 2. Coming Soon Movies

Phase 2: Booking Entry (Week 1-2)
└── 3. Buy Ticket Button

Phase 3: Core Booking (Week 2-3)
├── 4. Seat Selection
└── 5. Snacks (can be parallel)

Phase 4: Completion (Week 3-4)
└── 6. Fake Checkout
```

---

## Technical Considerations

### Database Schema Changes

**New Tables Required:**
1. `snacks` - Snack catalog
   ```sql
   - id (PRIMARY KEY)
   - name (VARCHAR)
   - description (TEXT)
   - price (DECIMAL)
   - image_url (VARCHAR)
   - category (VARCHAR)
   - available (BOOLEAN)
   ```

2. `showings` - Movie showtimes
   ```sql
   - id (PRIMARY KEY)
   - movie_id (FOREIGN KEY → movies)
   - showtime (TIMESTAMP)
   - theater_name (VARCHAR)
   - available_seats (INTEGER)
   ```

3. `seats` - Theater seat layout
   ```sql
   - id (PRIMARY KEY)
   - showing_id (FOREIGN KEY → showings)
   - row_label (VARCHAR)
   - seat_number (INTEGER)
   - seat_type (VARCHAR) -- standard, premium, vip
   - price (DECIMAL)
   ```

4. `seat_reservations` - Temporary seat holds
   ```sql
   - id (PRIMARY KEY)
   - seat_id (FOREIGN KEY → seats)
   - user_id (FOREIGN KEY → users)
   - showing_id (FOREIGN KEY → showings)
   - reserved_until (TIMESTAMP)
   ```

5. `bookings` - Completed bookings
   ```sql
   - id (PRIMARY KEY)
   - user_id (FOREIGN KEY → users)
   - movie_id (FOREIGN KEY → movies)
   - showing_id (FOREIGN KEY → showings)
   - total_amount (DECIMAL)
   - booking_date (TIMESTAMP)
   - status (VARCHAR) -- confirmed, cancelled
   - booking_reference (VARCHAR)
   ```

6. `booking_seats` - Seats in bookings
   ```sql
   - id (PRIMARY KEY)
   - booking_id (FOREIGN KEY → bookings)
   - seat_id (FOREIGN KEY → seats)
   ```

7. `booking_snacks` - Snacks in bookings
   ```sql
   - id (PRIMARY KEY)
   - booking_id (FOREIGN KEY → bookings)
   - snack_id (FOREIGN KEY → snacks)
   - quantity (INTEGER)
   - price_at_purchase (DECIMAL)
   ```

**New Columns Required:**
- `movies.release_date` (DATE) - For "Coming Soon" and availability checking

### Frontend Architecture

**New Pages:**
- `/seats` - Seat selection page
- `/snacks` - Snacks selection page
- `/checkout` - Checkout page
- `/booking-confirmation` - Success page

**New State Management:**
- Booking state (movie, showtime, seats, snacks)
- Seat selection state
- Cart state for snacks
- Checkout form state

**Reusable Components:**
- `BookingStepper.jsx` - Progress indicator (Seats → Snacks → Checkout)
- `PriceDisplay.jsx` - Reusable price formatting
- `QuantitySelector.jsx` - For snacks quantity

### Backend API Endpoints

**New Endpoints:**
- `GET /api/movies/newly-released`
- `GET /api/movies/coming-soon`
- `GET /api/bookings/seats/:movieId`
- `POST /api/bookings/reserve-seats`
- `GET /api/snacks`
- `POST /api/bookings/create`
- `GET /api/bookings/user/:userId`
- `GET /api/bookings/:bookingId`

### UI/UX Considerations

1. **Booking Flow Navigation:**
   - Progress stepper showing current step
   - Back/Next buttons
   - Ability to go back and modify selections

2. **Responsive Design:**
   - Seat map must work on mobile (scrollable, zoomable)
   - Snack catalog grid adapts to screen size
   - Checkout form is mobile-friendly

3. **Visual Feedback:**
   - Loading states during API calls
   - Success/error messages
   - Confirmation animations

4. **Accessibility:**
   - Keyboard navigation for seat selection
   - Screen reader support
   - ARIA labels for interactive elements

---

## Dependencies Map

```
Newly Released → (None)
Coming Soon → (None)
Buy Ticket → (None)
Seat Selection → Buy Ticket
Snacks → Buy Ticket (optional dependency)
Fake Checkout → Buy Ticket, Seat Selection, Snacks
```

---

## Risk Assessment

### Low Risk
- Newly Released Movies
- Coming Soon Movies
- Buy Ticket Button

### Medium Risk
- Snacks (cart functionality can have edge cases)

### High Risk
- Seat Selection (complex UI, concurrent users, reservation timing)
- Fake Checkout (data integrity, state management across flow)

---

## Success Criteria

### Feature Completion Checklist

**Newly Released:**
- [ ] Movies released in last 30 days display correctly
- [ ] Section appears on home page
- [ ] Clicking movie navigates to detail page

**Coming Soon:**
- [ ] Future movies display correctly
- [ ] Release date shows on cards
- [ ] Watchlist integration works

**Buy Ticket:**
- [ ] Button appears on movie detail pages
- [ ] Navigation to seat selection works
- [ ] Authentication check works

**Seat Selection:**
- [ ] Seat map displays correctly
- [ ] Seats can be selected/deselected
- [ ] Seat availability updates correctly
- [ ] Price calculation works

**Snacks:**
- [ ] Snack catalog displays
- [ ] Items can be added/removed
- [ ] Quantity selector works
- [ ] Price updates correctly

**Fake Checkout:**
- [ ] Booking summary displays correctly
- [ ] Form validation works
- [ ] Booking is created in database
- [ ] Confirmation page shows correctly

---

## Questions for Confirmation

Before proceeding with implementation, please confirm:

1. ✅ Do you agree with the complexity categorizations?
2. ✅ Do you agree with the recommended build order?
3. ✅ Are there any features you'd like to add, remove, or modify?
4. ✅ Should "Coming Soon" allow users to pre-book tickets or just add to watchlist?
5. ✅ How many seats should be in the theater layout? (e.g., 10 rows × 20 seats?)
6. ✅ Should seat reservations expire after a certain time? (e.g., 5 minutes?)
7. ✅ How many snack items should we include? Should they be categorized?
8. ✅ Should the booking flow allow users to go back and modify previous steps?

---

**Document Status:** Ready for Review  
**Next Step:** Awaiting your confirmation to proceed with implementation

