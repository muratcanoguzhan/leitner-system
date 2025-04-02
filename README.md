# Leitner System Flashcard App

A mobile app for Android and iOS that implements the Leitner System for spaced repetition learning.

## What is the Leitner System?

The Leitner System is a method of efficiently learning using flashcards, invented by the German science journalist Sebastian Leitner in the 1970s. It uses a simple principle of spaced repetition where cards are sorted into boxes representing different review intervals:

- Box 1: Review daily (new and difficult cards)
- Box 2: Review every 3 days
- Box 3: Review weekly
- Box 4: Review every 2 weeks
- Box 5: Review monthly (mastered cards)

When reviewing, if you answer a card correctly, it moves to the next box (longer review interval). If you answer incorrectly, it returns to Box 1 for more frequent review.

## Features

- Create and manage flashcards with front (question) and back (answer) content
- Automatic sorting of cards into 5 boxes based on your performance
- Daily review system that prioritizes cards due for review
- Detailed statistics of your learning progress
- Clean, user-friendly interface

## Prerequisites

To run this app, you need to have set up your React Native development environment:

- Node.js
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

1. **Home Screen**: View summary of all your cards across the 5 boxes
2. **Add Card**: Create new flashcards
3. **Review**: Practice cards that are due for review
4. **Box Details**: View and manage cards in a specific box

## Development

The app is built with:

- React Native
- TypeScript
- React Navigation
- AsyncStorage for persistent storage

## License

This project is proprietary and confidential. All rights reserved. No part of this software may be reproduced, distributed, or transmitted in any form or by any means without the prior written permission of the author.

## Acknowledgements

- Sebastian Leitner for the spaced repetition system
- React Native team for the framework
- Contributors and users of this app
