# RaktaCare

RaktaCare is a mobile application built with React Native and Expo that connects blood donors with patients in need of blood rapidly and efficiently. Leveraging advanced geographic and algorithmic matching, it seamlessly manages blood requests, finds nearby compatible donors, and facilitates life-saving donations.

## 🩸 Features

- **Real-time Blood Requests:** Create requests specifying the needed blood group, hospital location, and urgency.
- **Smart Donor Matching:** Intelligent algorithm prioritizes donors based on blood compatibility, geographic proximity (using Haversine distance), and a dynamic donor engagement score.
- **Location Services:** Interactive maps showing request locations and donor proximity using `react-native-maps` and `geofire-common`.
- **Donor Scoring System:** A gamified and reliable scoring system that tracks a donor’s past activity, reliability, and eligibility to donate based on minimum intervals.
- **Notifications & History:** Stay updated on request statuses and track personal donation history.
- **State Management:** Fast, reactive UI powered by Zustand.
- **Backend Setup:** Powered by Firebase (Firestore, Auth, Storage) for real-time capabilities and secure access.

## 🛠️ Technology Stack

- **Framework:** React Native / Expo (Expo Router for navigation)
- **State Management:** Zustand
- **Backend & Database:** Firebase (Firestore)
- **Geolocation & Distances:** `geofire-common`, `expo-location`
- **Maps:** `react-native-maps`
- **UI Components:** React Native Paper / Custom Design System

## 📂 Project Structure

```bash
📦 RaktaCare
 ┣ 📂 app               # Expo Router pages and navigation flow
 ┣ 📂 assets            # Images, fonts, and static resources
 ┣ 📂 components        # Reusable UI components
 ┣ 📂 contexts          # React contexts (e.g., Auth, Theme)
 ┣ 📂 hooks             # Custom React Hooks
 ┣ 📂 services          # API definitions and core logic (e.g., Algorithm Services)
 ┣ 📂 stores            # Zustand state stores
 ┣ 📂 styles            # Shared styling utilities
 ┣ 📂 utils             # Helper functions and utilities (e.g., bloodCompatibility.ts)
 ┣ 📜 README.md         # Project documentation
 ┣ 📜 algorithms.md     # Detailed breakdown of core logic and matching algorithms
 ┗ 📜 package.json      # Dependencies and scripts
```

## 🧠 Core Algorithms

RaktaCare implements sophisticated algorithms to ensure the efficiency and safety of blood donation matching. Detailed documentation of the scoring, distance generation, and compatibility rules can be found in [`algorithms.md`](./algorithms.md).

## 🚀 Getting Started

### Prerequisites

- Node.js (>= 18.x)
- npm or yarn
- Expo CLI
- Firebase Project (configured for Web/Mobile)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd RaktaCare
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *or*
   ```bash
   yarn install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and populate it with your Firebase config values and other required API keys.

4. **Start the development server:**
   ```bash
   npx expo start
   ```

5. **Run on Device / Emulator:**
   - Press `a` in the terminal to open on an Android emulator.
   - Press `i` to open on an iOS simulator.
   - Scan the QR code with the Expo Go app on your physical device.

## 🤝 Contributing

Contributions are welcome! Please feel free to open a Pull Request or create an Issue to discuss proposed changes or features.

## 📄 License

This project is licensed under the MIT License.
