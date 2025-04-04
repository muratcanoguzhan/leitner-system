import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Card, LearningSession } from '../models/Card';
import { isDueForReview, getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme, AppTheme } from '../utils/themes';
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
    
    // Get theme from shared utility
    const theme = getBoxTheme(boxLevel);
    
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
        style={[
          styles.boxItem, 
          { 
            backgroundColor: theme.bg,
            borderColor: theme.border,
            borderWidth: 1,
          }
        ]}
        onPress={() => navigation.navigate('BoxDetails', { boxLevel, sessionId })}
      >
        <View style={styles.boxHeader}>
          <Text style={styles.boxIcon}>{theme.icon}</Text>
          <Text style={styles.boxTitle}>Box {boxLevel}</Text>
        </View>
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
    backgroundColor: AppTheme.background,
  },
  header: {
    padding: 20,
    backgroundColor: AppTheme.main,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: AppTheme.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    padding: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  boxesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  boxItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  boxIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  boxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  boxCount: {
    fontSize: 16,
    color: '#555',
    marginTop: 6,
    marginBottom: 2,
  },
  boxDescription: {
    fontSize: 14,
    color: '#777',
    marginTop: 5,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    backgroundColor: AppTheme.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    backgroundColor: AppTheme.main,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  reviewButton: {
    backgroundColor: AppTheme.danger,
  },
  buttonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  configButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  configButtonText: {
    color: AppTheme.text.medium,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default HomeScreen; 