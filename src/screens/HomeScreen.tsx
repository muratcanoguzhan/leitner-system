import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Card } from '../models/Card';
import { loadCards, isDueForReview } from '../utils/storage';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  BoxDetails: { boxLevel: number };
  AddCard: undefined;
  Review: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [boxCounts, setBoxCounts] = useState([0, 0, 0, 0, 0]);
  const [dueCards, setDueCards] = useState(0);

  useEffect(() => {
    // Update card data when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadCardData();
    });

    // Initial load
    loadCardData();

    return unsubscribe;
  }, [navigation]);

  const loadCardData = async () => {
    const loadedCards = await loadCards();
    setCards(loadedCards);
    
    // Count cards in each box
    const counts = [0, 0, 0, 0, 0];
    let dueCount = 0;
    
    loadedCards.forEach(card => {
      // Adjust for 0-based array and 1-based boxLevel
      counts[card.boxLevel - 1]++;
      
      if (isDueForReview(card)) {
        dueCount++;
      }
    });
    
    setBoxCounts(counts);
    setDueCards(dueCount);
  };

  const renderBoxItem = ({ item, index }: { item: number; index: number }) => {
    const boxLevel = index + 1;
    return (
      <TouchableOpacity 
        style={[styles.boxItem, { backgroundColor: boxLevel === 5 ? '#e6ffe6' : '#fff' }]}
        onPress={() => navigation.navigate('BoxDetails', { boxLevel })}
      >
        <Text style={styles.boxTitle}>Box {boxLevel}</Text>
        <Text style={styles.boxCount}>{item} cards</Text>
        <Text style={styles.boxDescription}>
          {boxLevel === 1 && 'Review daily'}
          {boxLevel === 2 && 'Review every 3 days'}
          {boxLevel === 3 && 'Review weekly'}
          {boxLevel === 4 && 'Review bi-weekly'}
          {boxLevel === 5 && 'Review monthly'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leitner System</Text>
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

      <Text style={styles.sectionTitle}>Your Boxes</Text>
      
      <FlatList
        data={boxCounts}
        renderItem={renderBoxItem}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.boxesContainer}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('AddCard')}
        >
          <Text style={styles.buttonText}>Add New Card</Text>
        </TouchableOpacity>
        
        {dueCards > 0 && (
          <TouchableOpacity 
            style={[styles.button, styles.reviewButton]}
            onPress={() => navigation.navigate('Review')}
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
});

export default HomeScreen; 