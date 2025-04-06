# Leitner System Flashcard App

A mobile app for Android and iOS that implements the Leitner System for spaced repetition learning with customizable sessions and intervals.

## What is the Leitner System?

The Leitner System is a method of efficiently learning using flashcards, invented by the German science journalist Sebastian Leitner in the 1970s. It uses a simple principle of spaced repetition where cards are sorted into boxes representing different review intervals:

- Box 1: Review frequently (typically daily)
- Box 2: Review less frequently
- Box 3: Review occasionally
- Box 4: Review rarely
- Box 5: Review very rarely (mastered cards)

When reviewing, if you answer a card correctly, it moves to the next box (longer review interval). If you answer incorrectly, it returns to Box 1 for more frequent review.

## Features

- Create and manage multiple learning sessions for different subjects
- Create and manage flashcards with front (question) and back (answer) content
- Automatic sorting of cards into 5 boxes based on your performance
- Configurable review intervals for each box level
- Daily review system that prioritizes cards due for review
- Statistics tracking for learning progress
- Dark and light theme support
- Clean, user-friendly interface
- Persistent storage using SQLite

## Prerequisites

To run this app, you need to have set up your React Native development environment:

- Node.js v18 or newer
- npm or yarn
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- JDK 11 or newer
- Android SDK (for Android)

For detailed setup instructions, visit the [React Native Setting up the development environment](https://reactnative.dev/docs/environment-setup) guide.

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/leitner-system.git
   cd leitner-system
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. For iOS, install pods (macOS only):
   ```
   cd ios && pod install && cd ..
   ```

## Running the App

### Android

Make sure you have an Android emulator running or a device connected:

```
npx react-native run-android
```

### iOS (macOS only)

```
npx react-native run-ios
```

## Project Structure

```
src/
├── components/        # Reusable UI components
├── models/            # Data models
├── navigation/        # Navigation configuration
├── screens/           # App screens
└── utils/             # Utility functions
```

## Using the App

1. **Learning Sessions Screen**: Create and manage different learning sessions
2. **Boxes Screen**: View summary of all your cards across the 5 boxes for a session
3. **Add Card**: Create new flashcards for a specific learning session
4. **Review**: Practice cards that are due for review in a session
5. **Box Details**: View and manage cards in a specific box
6. **Configure Box Intervals**: Customize the review intervals for each box
7. **Edit Card**: Modify existing flashcard content

## Development

The app is built with:

- React Native 0.78.2
- TypeScript
- React Navigation 7
- SQLite for persistent storage
- React Native Gesture Handler for card swiping
- Async Storage for preferences

## License

This project is proprietary and confidential. All rights reserved. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author.
This project is licensed under the terms specified in the LICENSE file.

## Acknowledgements

- Sebastian Leitner for the spaced repetition system
- React Native team for the framework
- Contributors and users of this app
