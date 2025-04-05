import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView
} from 'react-native';
import { Card } from '../models/Card';
import { saveCard, isDueForReview, getCardsForSession, loadSessions } from '../utils/storage';
import FlashCard from '../components/FlashCard';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AppTheme } from '../utils/themes';
import { CardStats } from '../services/StatisticsService';
import { useTheme } from '../utils/ThemeContext';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  Review: { sessionId: string };
};

type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;
type ReviewScreenRouteProp = RouteProp<RootStackParamList, 'Review'>;

interface ReviewScreenProps {
  navigation: ReviewScreenNavigationProp;
  route: ReviewScreenRouteProp;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [answeredCardIds, setAnsweredCardIds] = useState<string[]>([]);
  const [reviewStats, setReviewStats] = useState<CardStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    promoted: 0,
    demoted: 0,
    due: 0
  });
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    const loadCardData = async () => {
      try {
        setLoading(true);
        // Load cards only for this specific session
        const loadedCards = await getCardsForSession(sessionId);
        setCards(loadedCards);
        
        // Get all sessions to pass to isDueForReview
        const allSessions = await loadSessions();
        
        // Filter cards that are due for review - using async/await with isDueForReview
        const dueCardsArray = [];
        for (const card of loadedCards) {
          const isDue = await isDueForReview(card, allSessions);
          if (isDue) {
            dueCardsArray.push(card);
          }
        }
        
        setDueCards(dueCardsArray);
        
        // Instead of calculating stats here, we can use the stats service
        // but just set the total due cards
        setReviewStats({
          total: dueCardsArray.length,
          correct: 0,
          incorrect: 0,
          promoted: 0,
          demoted: 0,
          due: dueCardsArray.length
        });
      } catch (error) {
        console.error('Error loading cards for review:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial load
    loadCardData();
  }, [sessionId]);

  const handleCorrect = async () => {
    if (currentCardIndex >= dueCards.length) return;
    
    const currentCard = dueCards[currentCardIndex];
    
    // Skip if this card has already been answered
    if (answeredCardIds.includes(currentCard.id)) return;
    
    // Mark this card as answered
    setAnsweredCardIds(prev => [...prev, currentCard.id]);
    
    const updatedCard = { ...currentCard };
    
    // Move to next box if not already in the last box
    if (updatedCard.boxLevel < 5) {
      updatedCard.boxLevel += 1;
      setReviewStats(prev => ({
        ...prev,
        correct: prev.correct + 1,
        promoted: prev.promoted + 1
      }));
    } else {
      setReviewStats(prev => ({
        ...prev,
        correct: prev.correct + 1
      }));
    }
    
    // Update last reviewed date
    updatedCard.lastReviewed = new Date();
    
    // Update the card in the main cards array
    const updatedCards = cards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    );
    
    // Save changes to the individual card
    await saveCard(updatedCard);
    console.log('Card updated successfully:', updatedCard);
    
    setCards(updatedCards);
    
    // Move to next card
    moveToNextCard();
  };

  const handleIncorrect = async () => {
    if (currentCardIndex >= dueCards.length) return;
    
    const currentCard = dueCards[currentCardIndex];
    
    // Skip if this card has already been answered
    if (answeredCardIds.includes(currentCard.id)) return;
    
    // Mark this card as answered
    setAnsweredCardIds(prev => [...prev, currentCard.id]);
    
    const updatedCard = { ...currentCard };
    
    // Always move back to box 1 if incorrect
    if (updatedCard.boxLevel > 1) {
      updatedCard.boxLevel = 1;
      setReviewStats(prev => ({
        ...prev,
        incorrect: prev.incorrect + 1,
        demoted: prev.demoted + 1
      }));
    } else {
      setReviewStats(prev => ({
        ...prev,
        incorrect: prev.incorrect + 1
      }));
    }
    
    // Update last reviewed date
    updatedCard.lastReviewed = new Date();
    
    // Update the card in the main cards array
    const updatedCards = cards.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    );
    
    // Save changes to the individual card
    await saveCard(updatedCard);
    console.log('Card updated successfully:', updatedCard);
    
    setCards(updatedCards);
    
    // Move to next card
    moveToNextCard();
  };

  const moveToNextCard = () => {
    if (currentCardIndex < dueCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    } else {
      setReviewComplete(true);
    }
  };

  const moveToPrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };

  const handleFinish = () => {
    navigation.navigate('Boxes', { sessionId });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.main }]}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#000' : '#fff' }]}>Card Review</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text.dark }]}>Loading...</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.light }]}>
            Checking for cards due for review.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dueCards.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.main }]}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#000' : '#fff' }]}>Card Review</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: theme.text.dark }]}>No Cards Due</Text>
          <Text style={[styles.emptySubtitle, { color: theme.text.light }]}>
            All caught up! There are no cards due for review.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.main }]}
            onPress={() => navigation.navigate('Boxes', { sessionId })}
          >
            <Text style={[styles.buttonText, { color: isDarkMode ? '#000' : '#fff' }]}>Back to Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (reviewComplete) {
    const { total, correct, incorrect, promoted, demoted } = reviewStats;
    
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.main }]}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#000' : '#fff' }]}>Review Complete</Text>
        </View>
        <View style={styles.completeContainer}>
          <Text style={[styles.completeTitle, { color: theme.text.dark }]}>Review Complete!</Text>
          
          <View style={[styles.statsContainer, { 
            backgroundColor: theme.white,
            shadowColor: isDarkMode ? '#fff' : '#000',
            shadowOpacity: isDarkMode ? 0.05 : 0.1,
            borderBottomColor: isDarkMode ? '#333' : '#f0f0f0'
          }]}>
            <View style={[styles.statRow, { borderBottomColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.statLabel, { color: theme.text.light }]}>Total Cards Reviewed:</Text>
              <Text style={[styles.statValue, { color: theme.text.dark }]}>{total}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.statLabel, { color: theme.text.light }]}>Correct Answers:</Text>
              <Text style={[styles.statValue, styles.correctText, { color: theme.success }]}>{correct}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.statLabel, { color: theme.text.light }]}>Incorrect Answers:</Text>
              <Text style={[styles.statValue, styles.incorrectText, { color: theme.danger }]}>{incorrect}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.statLabel, { color: theme.text.light }]}>Cards Promoted:</Text>
              <Text style={[styles.statValue, { color: theme.text.dark }]}>{promoted}</Text>
            </View>
            <View style={[styles.statRow, { borderBottomColor: isDarkMode ? '#333' : '#f0f0f0' }]}>
              <Text style={[styles.statLabel, { color: theme.text.light }]}>Cards Demoted:</Text>
              <Text style={[styles.statValue, { color: theme.text.dark }]}>{demoted}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.button, { 
              backgroundColor: theme.main,
              shadowColor: isDarkMode ? '#fff' : '#000',
              shadowOpacity: isDarkMode ? 0.05 : 0.2
            }]}
            onPress={handleFinish}
          >
            <Text style={[styles.buttonText, { color: isDarkMode ? '#000' : '#fff' }]}>Back to Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.main }]}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#000' : '#fff' }]}>Card Review</Text>
      </View>
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: theme.text.light }]}>
          Card {currentCardIndex + 1} of {dueCards.length}
        </Text>
      </View>
      
      <View style={styles.cardContainer}>
        <TouchableOpacity
          style={[styles.arrowButton, styles.leftArrow, { 
            backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.85)' : 'rgba(240, 240, 240, 0.85)',
            opacity: currentCardIndex === 0 ? 0.4 : 1,
            borderColor: isDarkMode ? '#444' : '#ddd',
          }]}
          onPress={moveToPrevCard}
          disabled={currentCardIndex === 0}
        >
          <Text style={[styles.arrowText, { 
            color: currentCardIndex === 0 
              ? (isDarkMode ? '#555' : '#bbb') 
              : (isDarkMode ? '#fff' : theme.main)
          }]}>◀</Text>
        </TouchableOpacity>
        
        <FlashCard 
          card={dueCards[currentCardIndex]} 
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
          isAnswered={answeredCardIds.includes(dueCards[currentCardIndex]?.id)}
        />
        
        <TouchableOpacity
          style={[styles.arrowButton, styles.rightArrow, { 
            backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.85)' : 'rgba(240, 240, 240, 0.85)',
            opacity: currentCardIndex === dueCards.length - 1 ? 0.4 : 1,
            borderColor: isDarkMode ? '#444' : '#ddd',
          }]}
          onPress={moveToNextCard}
          disabled={currentCardIndex === dueCards.length - 1}
        >
          <Text style={[styles.arrowText, { 
            color: currentCardIndex === dueCards.length - 1 
              ? (isDarkMode ? '#555' : '#bbb') 
              : (isDarkMode ? '#fff' : theme.main)
          }]}>▶</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.skipButton, { 
          backgroundColor: isDarkMode ? '#333' : '#f0f0f0' 
        }]}
        onPress={handleFinish}
      >
        <Text style={[styles.skipButtonText, { color: theme.text.light }]}>End Review</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: AppTheme.main,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsContainer: {
    backgroundColor: AppTheme.white,
    borderRadius: 10,
    padding: 20,
    width: '100%',
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  correctText: {
    color: AppTheme.main,
  },
  incorrectText: {
    color: AppTheme.danger,
  },
  button: {
    backgroundColor: AppTheme.main,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  buttonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressContainer: {
    padding: 20,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  skipButton: {
    padding: 15,
    margin: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  skipButtonText: {
    fontWeight: '500',
    fontSize: 16,
  },
  cardContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  arrowButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.5,
    borderWidth: 1,
  },
  leftArrow: {
    left: 5,
  },
  rightArrow: {
    right: 5,
  },
  arrowText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});

export default ReviewScreen; 