/**
 * Leitner System Flashcards App
 * A spaced repetition system for learning
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDatabase } from './src/utils/database';
import { Alert, ActivityIndicator, View, Text, Button } from 'react-native';

function App(): React.JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupDatabase = async () => {
    try {
      console.log('Initializing database...');
      // Initialize database
      await initDatabase();
      console.log('Database initialized successfully');
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      const errorMessage = 'Failed to initialize app: ' + (error instanceof Error ? error.message : String(error));
      setError(errorMessage);
      
      // Show an alert with the error
      Alert.alert(
        'Database Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  useEffect(() => {
    setupDatabase();
  }, []);
  
  const retrySetup = () => {
    setError(null);
    setupDatabase();
  };
  
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <ActivityIndicator size="large" color="#0000ff" />
        {error && (
          <>
            <Text style={{ color: 'red', marginTop: 20, textAlign: 'center' }}>
              {error}
            </Text>
            <View style={{ marginTop: 20 }}>
              <Button 
                title="Retry" 
                onPress={retrySetup} 
                color="#841584"
              />
            </View>
          </>
        )}
      </View>
    );
  }
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
