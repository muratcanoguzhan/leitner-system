import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, Dimensions } from 'react-native';
import { Card, LearningSession } from '../models/Card';
import { isDueForReview, getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme, AppTheme } from '../utils/themes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  AddCard: { sessionId: string };
  Review: { sessionId: string };
  ConfigureBoxIntervals: { sessionId: string };
};

type BoxesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Boxes'>;
type BoxesScreenRouteProp = RouteProp<RootStackParamList, 'Boxes'>;

interface BoxesScreenProps {
  navigation: BoxesScreenNavigationProp;
  route: BoxesScreenRouteProp;
}

const BoxesScreen: React.FC<BoxesScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState<LearningSession | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [boxCounts, setBoxCounts] = useState([0, 0, 0, 0, 0]);
  const [dueCards, setDueCards] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);

  // Check orientation
  const checkOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);
  };

  useEffect(() => {
    checkOrientation();
    // Add event listener for orientation changes
    Dimensions.addEventListener('change', checkOrientation);
    
    // Return cleanup function
    return () => {
      // Remove event listener
      // Note: In newer React Native versions, this is handled automatically
    };
  }, []);

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
          const boxIndex = Math.max(0, Math.min(card.boxLevel - 1, 4)); // Ensure we stay within bounds (0-4)
          counts[boxIndex]++;
          
          // Use the async version with await
          const isDue = await isDueForReview(card, allSessions);
          if (isDue) {
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
          },
          isLandscape && styles.boxItemLandscape
        ]}
        onPress={() => navigation.navigate('BoxDetails', { boxLevel, sessionId })}
      >
        <View style={styles.boxHeader}>
          <Text style={styles.boxIcon}>{theme.icon}</Text>
          <Text style={[styles.boxTitle, isLandscape && styles.boxTitleLandscape]}>{`Box ${boxLevel}`}</Text>
        </View>
        <Text style={[styles.boxCount, isLandscape && styles.boxCountLandscape]}>{item} cards</Text>
        <Text style={[styles.boxDescription, isLandscape && styles.boxDescriptionLandscape]}>{reviewText}</Text>
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
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('LearningSessions')}
        >
          <Text style={[styles.backButtonText, isLandscape && styles.backButtonTextLandscape]}>← All Sessions</Text>
        </TouchableOpacity>
        <Text style={[styles.title, isLandscape && styles.titleLandscape]}>{session.name}</Text>
        <Text style={[styles.subtitle, isLandscape && styles.subtitleLandscape]}>Spaced Repetition Flashcards</Text>
      </View>

      <View style={[styles.statsContainer, isLandscape && styles.statsContainerLandscape]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>{cards.length}</Text>
          <Text style={[styles.statLabel, isLandscape && styles.statLabelLandscape]}>Total Cards</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>{dueCards}</Text>
          <Text style={[styles.statLabel, isLandscape && styles.statLabelLandscape]}>Due for Review</Text>
        </View>
      </View>

      <View style={[styles.sectionHeader, isLandscape && styles.sectionHeaderLandscape]}>
        <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape]}>Your Boxes</Text>
        <TouchableOpacity 
          style={[styles.configButton, isLandscape && styles.configButtonLandscape]}
          onPress={() => navigation.navigate('ConfigureBoxIntervals', { sessionId })}
        >
          <Text style={[styles.configButtonText, isLandscape && styles.configButtonTextLandscape]}>Configure Intervals</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={boxCounts}
        renderItem={renderBoxItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.boxesContainer}
      />

      <View style={[styles.buttonContainer, isLandscape && styles.buttonContainerLandscape]}>
        <TouchableOpacity 
          style={[styles.button, isLandscape && styles.buttonLandscape]}
          onPress={() => navigation.navigate('AddCard', { sessionId })}
        >
          <Text style={[styles.buttonText, isLandscape && styles.buttonTextLandscape]}>Add New Card</Text>
        </TouchableOpacity>
        
        {dueCards > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.reviewButton, isLandscape && styles.buttonLandscape]}
            onPress={() => navigation.navigate('Review', { sessionId })}
          >
            <Text style={[styles.buttonText, isLandscape && styles.buttonTextLandscape]}>Start Review</Text>
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
  headerLandscape: {
    padding: 10,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppTheme.white,
  },
  titleLandscape: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 16,
    color: AppTheme.white,
    opacity: 0.9,
  },
  subtitleLandscape: {
    fontSize: 14,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: AppTheme.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonTextLandscape: {
    fontSize: 14,
    marginBottom: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: AppTheme.white,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    padding: 5,
  },
  statsContainerLandscape: {
    marginTop: 10,
    marginHorizontal: 15,
    padding: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
  },
  statValueLandscape: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 14,
    color: AppTheme.text.light,
    marginTop: 5,
    fontWeight: '500',
  },
  statLabelLandscape: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  sectionHeaderLandscape: {
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
  },
  sectionTitleLandscape: {
    fontSize: 18,
  },
  boxesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  boxItem: {
    backgroundColor: AppTheme.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  boxItemLandscape: {
    padding: 12,
    marginBottom: 8,
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
    color: AppTheme.text.dark,
  },
  boxTitleLandscape: {
    fontSize: 16,
  },
  boxCount: {
    fontSize: 16,
    color: AppTheme.text.medium,
    marginTop: 6,
    marginBottom: 2,
  },
  boxCountLandscape: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 1,
  },
  boxDescription: {
    fontSize: 14,
    color: AppTheme.text.light,
    marginTop: 5,
  },
  boxDescriptionLandscape: {
    fontSize: 12,
    marginTop: 3,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    backgroundColor: AppTheme.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  buttonContainerLandscape: {
    padding: 10,
    paddingHorizontal: 15,
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
  buttonLandscape: {
    padding: 12,
    borderRadius: 10,
  },
  reviewButton: {
    backgroundColor: AppTheme.danger,
  },
  buttonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextLandscape: {
    fontSize: 14,
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
  configButtonLandscape: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  configButtonText: {
    color: AppTheme.text.medium,
    fontSize: 14,
    fontWeight: '500',
  },
  configButtonTextLandscape: {
    fontSize: 12,
  },
});

export default BoxesScreen; 