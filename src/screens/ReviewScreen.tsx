import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView
} from 'react-native';
import { Card } from '../models/Card';
import { loadCards, saveCards, isDueForReview } from '../utils/storage';
import FlashCard from '../components/FlashCard';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  Review: undefined;
};

type ReviewScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Review'>;

interface ReviewScreenProps {
  navigation: ReviewScreenNavigationProp;
}

const ReviewScreen: React.FC<ReviewScreenProps> = ({ navigation }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCards, setDueCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    promoted: 0,
    demoted: 0
  });

  useEffect(() => {
    loadCardData();
  }, []);

  const loadCardData = async () => {
    const loadedCards = await loadCards();
    setCards(loadedCards);
    
    // Filter cards that are due for review
    const due = loadedCards.filter(card => isDueForReview(card));
    setDueCards(due);
    
    setReviewStats({
      total: due.length,
      correct: 0,
      incorrect: 0,
      promoted: 0,
      demoted: 0
    });
  };

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
    
    // Save changes
    await saveCards(updatedCards);
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
    
    // Save changes
    await saveCards(updatedCards);
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
    navigation.navigate('Home');
  };

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
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.buttonText}>Back to Home</Text>
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
            <Text style={styles.buttonText}>Back to Home</Text>
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
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 20,
    backgroundColor: '#4ecdc4',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  progress: {
    fontSize: 16,
    color: '#fff',
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
    color: '#666',
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
    color: '#333',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
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
    color: '#333',
  },
  statsContainer: {
    backgroundColor: '#fff',
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
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  correctText: {
    color: '#4ecdc4',
  },
  incorrectText: {
    color: '#ff6b6b',
  },
  button: {
    backgroundColor: '#4ecdc4',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ReviewScreen; 