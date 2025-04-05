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
  const [reviewStats, setReviewStats] = useState<CardStats>({
    total: 0,
    correct: 0,
    incorrect: 0,
    promoted: 0,
    demoted: 0,
    due: 0
  });

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

  const handleFinish = () => {
    navigation.navigate('Boxes', { sessionId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Loading...</Text>
          <Text style={styles.emptySubtitle}>
            Checking for cards due for review.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (dueCards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Cards Due</Text>
          <Text style={styles.emptySubtitle}>
            All caught up! There are no cards due for review.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Boxes', { sessionId })}
          >
            <Text style={styles.buttonText}>Back to Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (reviewComplete) {
    const { total, correct, incorrect, promoted, demoted } = reviewStats;
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeTitle}>Review Complete!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Cards Reviewed:</Text>
              <Text style={styles.statValue}>{total}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Correct Answers:</Text>
              <Text style={[styles.statValue, styles.correctText]}>{correct}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Incorrect Answers:</Text>
              <Text style={[styles.statValue, styles.incorrectText]}>{incorrect}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cards Promoted:</Text>
              <Text style={styles.statValue}>{promoted}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cards Demoted:</Text>
              <Text style={styles.statValue}>{demoted}</Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleFinish}
          >
            <Text style={styles.buttonText}>Back to Session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = dueCards[currentCardIndex];
  const progress = `${currentCardIndex + 1} / ${dueCards.length}`;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Cards</Text>
        <Text style={styles.progress}>{progress}</Text>
      </View>
      
      <View style={styles.cardContainer}>
        <FlashCard
          card={currentCard}
          onCorrect={handleCorrect}
          onIncorrect={handleIncorrect}
        />
      </View>
      
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleFinish}
      >
        <Text style={styles.skipButtonText}>End Review</Text>
      </TouchableOpacity>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.white,
  },
  progress: {
    fontSize: 16,
    color: AppTheme.white,
    opacity: 0.9,
    fontWeight: '500',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 15,
    margin: 20,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  skipButtonText: {
    color: AppTheme.text.light,
    fontWeight: '500',
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
    color: AppTheme.text.dark,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: AppTheme.text.light,
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
    color: AppTheme.text.dark,
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
    color: AppTheme.text.light,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
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
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppTheme.main,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default ReviewScreen; 