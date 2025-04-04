import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Card, LearningSession } from '../models/Card';
import { isDueForReview, getCardsForSession, loadSessions } from '../utils/storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  LearningSessions: undefined;
  Home: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  AddCard: { sessionId: string };
  Review: { sessionId: string };
  ConfigureBoxIntervals: { sessionId: string };
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState<LearningSession | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [boxCounts, setBoxCounts] = useState([0, 0, 0, 0, 0]);
  const [dueCards, setDueCards] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessionData = async () => {
      const sessions = await loadSessions();
      const currentSession = sessions.find(s => s.id === sessionId);
      setSession(currentSession || null);
    };

    const loadCardData = async () => {
      try {
        setLoading(true);
        const sessionCards = await getCardsForSession(sessionId);
        setCards(sessionCards);
        
        // Get all sessions to pass to isDueForReview
        const allSessions = await loadSessions();
        
        // Count cards in each box
        const counts = [0, 0, 0, 0, 0];
        let dueCount = 0;
        
        // Check each card if it's due for review
        for (const card of sessionCards) {
          // Adjust for 0-based array and 1-based boxLevel
          counts[card.boxLevel - 1]++;
          
          // Use the non-async version with sessions parameter
          if (isDueForReview(card, allSessions)) {
            dueCount++;
          }
        }
        
        setBoxCounts(counts);
        setDueCards(dueCount);
      } catch (error) {
        console.error('Error loading card data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Update card data when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadSessionData();
      loadCardData();
    });

    // Initial load
    loadSessionData();
    loadCardData();

    return unsubscribe;
  }, [navigation, sessionId]);

  const renderBoxItem = ({ item, index }: { item: number; index: number }) => {
    const boxLevel = index + 1;
    let reviewText = '';
    
    // Use the session's custom box intervals if available
    if (session && session.boxIntervals) {
      switch(boxLevel) {
        case 1: 
          reviewText = session.boxIntervals.box1Days === 1 
            ? 'Review daily' 
            : `Review every ${session.boxIntervals.box1Days} days`;
          break;
        case 2: 
          reviewText = `Review every ${session.boxIntervals.box2Days} days`;
          break;
        case 3: 
          reviewText = `Review every ${session.boxIntervals.box3Days} days`;
          break;
        case 4: 
          reviewText = `Review every ${session.boxIntervals.box4Days} days`;
          break;
        case 5: 
          reviewText = `Review every ${session.boxIntervals.box5Days} days`;
          break;
        default:
          reviewText = 'Custom review interval';
      }
    } else {
      // Fallback to default text if session or intervals are not available
      switch(boxLevel) {
        case 1: reviewText = 'Review daily'; break;
        case 2: reviewText = 'Review every 3 days'; break;
        case 3: reviewText = 'Review weekly'; break;
        case 4: reviewText = 'Review bi-weekly'; break;
        case 5: reviewText = 'Review monthly'; break;
        default: reviewText = 'Custom review interval';
      }
    }
    
    return (
      <TouchableOpacity 
        style={[styles.boxItem, { backgroundColor: boxLevel === 5 ? '#e6ffe6' : '#fff' }]}
        onPress={() => navigation.navigate('BoxDetails', { boxLevel, sessionId })}
      >
        <Text style={styles.boxTitle}>Box {boxLevel}</Text>
        <Text style={styles.boxCount}>{item} cards</Text>
        <Text style={styles.boxDescription}>{reviewText}</Text>
      </TouchableOpacity>
    );
  };

  if (!session || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('LearningSessions')}
        >
          <Text style={styles.backButtonText}>← All Sessions</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{session.name}</Text>
        <Text style={styles.subtitle}>Spaced Repetition Flashcards</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cards.length}</Text>
          <Text style={styles.statLabel}>Total Cards</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dueCards}</Text>
          <Text style={styles.statLabel}>Due for Review</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your Boxes</Text>
        <TouchableOpacity 
          style={styles.configButton}
          onPress={() => navigation.navigate('ConfigureBoxIntervals', { sessionId })}
        >
          <Text style={styles.configButtonText}>Configure Intervals</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={boxCounts}
        renderItem={renderBoxItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.boxesContainer}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('AddCard', { sessionId })}
        >
          <Text style={styles.buttonText}>Add New Card</Text>
        </TouchableOpacity>
        
        {dueCards > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.reviewButton]}
            onPress={() => navigation.navigate('Review', { sessionId })}
          >
            <Text style={styles.buttonText}>Start Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 20,
    backgroundColor: '#4ecdc4',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  boxesContainer: {
    paddingHorizontal: 20,
  },
  boxItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  boxCount: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  boxDescription: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  reviewButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  configButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  configButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen; 