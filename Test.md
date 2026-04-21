# RaktaCare Testing & Showcase Guide

This document outlines how to test the core algorithms of RaktaCare and provides a script for your final project showcase involving three team members and three separate accounts.

## 1. Testing the Core Algorithms

### Algorithm 1: Location Pinning & Nominatim Geocoding
**What it does:** Converts text-based addresses into GPS coordinates (Latitude/Longitude) using the OpenStreetMap Nominatim API, ensuring accurate map placement even if GPS is unavailable.
**How to test:**
1. Login to an account and create a new blood request.
2. In the "Location" field, deliberately type a specific, known landmark (e.g., "Patan Hospital, Lalitpur").
3. Submit the request.
4. Open the Request Details page.
5. **Expected Result:** The map should automatically pan to the coordinates of Patan Hospital, placing a red marker exactly on the hospital, proving the geocoding converted the text correctly.

### Algorithm 2: Haversine Distance Calculation
**What it does:** Calculates the exact straight-line distance (in kilometers) between the user's current GPS location and the requester's coordinate.
**How to test:**
1. Open up a dummy request where the location is set far from your current GPS location (e.g., you are in Kathmandu, the request is in Pokhara).
2. Open the Request Details page.
3. Wait for the app to fetch your current GPS coordinates.
4. **Expected Result:** The "Distance" stat box at the bottom should display a realistic kilometer difference between Kathmandu and Pokhara (e.g., ~140km+). If you're close by, it will display the distance in meters. 

### Algorithm 3: Client-Side Urgency Keyword Scanning
**What it does:** Automatically assigns a priority badge ("CRITICAL" or "URGENT") based on words found in the request description.
**How to test:**
1. Create Request A with description: "Patient had an accident and is in the ICU with heavy bleeding."
2. Create Request B with description: "Scheduled surgery for next week."
3. Create Request C with description: "Need normal blood for anemia."
4. **Expected Result:** Request A gets a red "CRITICAL" badge. Request B gets a white "URGENT" badge. Request C remains "STANDARD" with no urgency badge.

---

## 2. Project Finals Showcase Strategy (3 People, 3 Accounts)

Since all three of you will be presenting together, you can run a synchronized live demonstration of the core workflow. This will highlight real-time syncing and the "I'll Donate" functionality. 

### Roles:
- **Person A:** The Patient/Requester (Account 1)
- **Person B:** Donor 1 - Close by (Account 2)
- **Person C:** Donor 2 - Further away (Account 3)

### Walkthrough Script:
1. **Introduction:** Briefly explain the problem RaktaCare solves and the technologies used (React Native, Firebase, Zustand, Map geocoding).
2. **Phase 1: Creating the Request (Person A):** 
   - Person A shares their screen to the judges.
   - They create a new Blood Request.
   - They intentionally use keywords like "ICU" or "accident" in the description to demonstrate the **Urgency Algorithm**.
   - They submit the request.
3. **Phase 2: Discovery & Distance (Person B & C):**
   - Person B shares their screen highlighting the "Nearby Requests". 
   - The newly created request pops up immediately (showing Firebase real-time DB).
   - Person B taps the request. The Map loads, demonstrating the **Nominatim Geocoding** and **Haversine Distance** algorithms. Person B's screen shows they are 2km away. 
   - Person C can quickly show their screen indicating a different distance calculated (e.g. 5km away).
4. **Phase 3: The Interaction Flow (All):**
   - Both Person B and Person C tap the recently opened **"I'll Donate"** button. (Note: We removed the strict 'donor role' check, so anyone can donate now!).
   - Person A takes back the screen share. 
   - Person A checks their "Donation Offers" on the request details page.
   - Person A sees two offers: One from Person B, one from Person C. 
   - Person A explains they will **Accept** Person B (because they are closer) and **Reject** Person C. 
5. **Phase 4: Conclusion:** Show that the status changed successfully for the request, completing the lifecycle.

---

## 3. Architecture Decision: Why Zustand instead of Context API?

We removed Context API (for global state like Auth and App settings) and replaced it with **Zustand**. Here is exactly what it is used for and why it is better for our project:

**What it is being used for:**
- `authStore.ts`: Managing everything related to the user session (JWT/Session tokens, user profile data, fetching user info, determining if they are logged out or verified).
- `appStore.ts`: Global app settings that aren't tied directly to the React component tree.

**Why we added Zustand over Context API:**
1. **No Provider Hell/Boilerplate:** Context API requires wrapping the entire app in multiple `<Context.Provider>` components, leading to messy `_layout.tsx` files. Zustand requires zero wrapper components.
2. **Performance (No Unnecessary Re-renders):** Context API triggers a re-render of *every* component consuming the context whenever any value inside it changes. Zustand allows components to selectively bind to *only* the specific state slices they care about. If `user.displayName` changes, only the profile picture updates—not the entire app.
3. **Outside-of-React Usage:** Context API can only be used inside React components (via `useContext`). Zustand allows us to read and write to the global state directly inside standard TypeScript files (like intercepting API calls, or background tasks) via `useAuthStore.getState()`. 
4. **Simpler API:** It drastically reduces the amount of code needed to achieve strong, performant global state.
