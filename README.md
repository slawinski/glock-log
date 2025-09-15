# TriggerNote - Firearm Inventory Management App

A React Native application for tracking firearm inventory, ammunition usage, and range visits with a retro terminal aesthetic.

## Features

- Track firearm inventory with detailed specifications
- Record purchase details and costs
- Monitor ammunition inventory and usage
- Log range visits with ammunition consumption
- Upload firearm photos with gallery view
- View comprehensive collection statistics
- Terminal-inspired UI with green/black aesthetic
- Secure local storage with MMKV

## Tech Stack

- **Frontend**: React Native with TypeScript and Expo
- **Styling**: Tailwind CSS (NativeWind) with custom terminal theme
- **Storage**: MMKV for secure local data persistence
- **Navigation**: React Navigation (Native Stack)
- **Forms**: React Hook Form with Zod validation
- **Images**: Expo Image Picker for photo management
- **Testing**: Jest with React Native Testing Library

## Prerequisites

- Node.js (v18 or higher) and npm
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Physical device or emulator for testing

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd glock-log
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on your preferred platform:**
   ```bash
   # iOS Simulator
   npm run ios
   
   # Android Emulator
   npm run android
   
   # Expo Go app (scan QR code)
   npm start
   ```

## Development Commands

- `npm start` - Start Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm test` - Run test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript compiler

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # Screen components organized by feature
├── services/           # Data storage and business logic
├── validation/         # Zod schemas for data validation
└── types/             # TypeScript type definitions
```

## Key Features

### Firearm Management
- Add, edit, and delete firearms with detailed specifications
- Upload and manage photos for each firearm
- Track purchase details and costs
- Monitor total rounds fired per firearm

### Ammunition Tracking
- Maintain ammunition inventory by caliber and brand
- Record purchase details and quantities
- Track usage during range visits

### Range Visit Logging
- Log visits to shooting ranges with date and location
- Record which firearms were used and ammunition consumed
- Calculate total rounds fired per visit

### Statistics Dashboard
- View collection overview with totals and values
- Analyze shooting patterns with charts and graphs
- Track spending and usage trends

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the existing code style and patterns
4. Write tests for new functionality
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

This project is licensed under the MIT License.
