# RaktaCare Algorithms Documentation

This document provides a comprehensive overview of the key algorithms that power the core logic of the RaktaCare project. These algorithms handle donor matching, ranking, prioritization, and geolocation to optimize the blood donation process.

## 1. Donor Notification Trigger and Matching Algorithm (Algorithm 6)
**File:** `services/bloodAlgorithmService.ts` (Function: `findDonorsForRequest`)

**Description:**
This algorithm is responsible for finding the most suitable donors for a given blood request. It works by:
1. Identifying compatible blood types using the compatibility matrix.
2. Querying donor users within a specific geographic bounding box (via Geohash bounds) to reduce read operations.
3. Filtering donors who are out of the exact distance radius or incompatible.
4. Scoring each eligible donor using the **Donor Scoring and Ranking Algorithm**.
5. Selecting the top 10 highest-scoring donors and attaching their references to the request for notifications.

## 2. Escalating Radius Geofencing (Algorithm 4)
**File:** `services/bloodAlgorithmService.ts` (Function: `escalateRequestRadius`)

**Description:**
To ensure requests do not go unanswered, this algorithm dynamically expands the geographic search area over time. If a request has not been fulfilled within a certain localized radius, the algorithm escalates the search radius incrementally:
- Initial radius: 5 km
- First escalation: 15 km
- Second escalation: 30 km
- Third escalation: 100 km (Approximating citywide/regional search)
At each step, it re-triggers the Donor Matching algorithm with the new, wider radius.

## 3. Priority Queue Logic (Algorithm 5)
**File:** `services/bloodAlgorithmService.ts` (Function: `calculateRequestPriority`)

**Description:**
This algorithm dynamically calculates a composite priority score for simultaneous blood requests to ensure the most urgent cases are handled first. The priority score formula includes:
- **Urgency Weight:** High base score for `critical` cases, medium for `urgent`, and low for `standard`.
- **Wait Time Bonus:** Linearly scales up based on the time elapsed since the request was created, maxing out out at a specific value after an hour.
- **Units Needed Bonus:** Provides slight additional weight for requests that demand a higher volume of blood.

## 4. Blood Compatibility Matching
**File:** `utils/bloodCompatibility.ts`

**Description:**
A fundamental rule-based algorithm that acts as the biological safety check. It utilizes a hardcoded `compatibilityMap` matrix to evaluate and return an array of compatible donor blood groups capable of safely donating to a requested blood group. It is heavily utilized to filter database queries during the matching phase.

## 5. Composite Donor Scoring and Ranking
**File:** `utils/donorScoring.ts` (Function: `scoreDonor`)

**Description:**
When multiple donors are found within the geofenced radius, this algorithm ranks them to ensure the most optimal donors are alerted first. It assigns a composite weighted score calculated via:
- **Distance (50%):** Closer donors get higher scores, normalized over a 30 km span. 
- **Reliability (30%):** Donors with a historically higher response rate receive a performance score boost.
- **Urgency Bonus (+30%):** Added unconditionally if the overarching request urgency is set to `critical`.
- **Ineligibility Filter:** Automatically disqualifies donors who have donated within the last 90 days.

## 6. Haversine Distance Calculation
**File:** `utils/haversine.ts` (Functions: `haversineDistance`, `haversineKm`)

**Description:**
A fundamental geolocation algorithm derived from the Haversine formula. It computes the direct, straight-line distance (in kilometers) between two sets of GPS coordinate points (latitude and longitude). Because it factors in the spherical curvature of the Earth, it is highly accurate and forms the basis for all distance-based logic, including geofencing and donor radius scoring.

## 7. Hospital Proximity Search and Ranking
**File:** `services/firebase/osm/overpass.ts` (Function: `fetchNearbyHospitals`)

**Description:**
This algorithm queries real-time OpenStreetMap points of interest (through the Overpass API) to locate nearby hospitals within a specific geographic perimeter. After fetching the raw mapping elements, the algorithm parses them, applies the **Haversine Distance Calculation** to determine their exact distances from the centralized point, and sorts them into ascending order (closest to furthest) up to a hardcoded limit.
