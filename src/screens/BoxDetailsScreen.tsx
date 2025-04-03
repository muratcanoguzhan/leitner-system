import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert 
} from 'react-native';
import { Card } from '../models/Card';
import { loadCards, saveCards, getCardsForSession } from '../utils/storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  Home: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
};

type BoxDetailsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BoxDetails'>;
type BoxDetailsScreenRouteProp = RouteProp<RootStackParamList, 'BoxDetails'>;

interface BoxDetailsScreenProps {
  navigation: BoxDetailsScreenNavigationProp;
  route: BoxDetailsScreenRouteProp;
}

const BoxDetailsScreen: React.FC<BoxDetailsScreenProps> = ({ navigation, route }) => {
  const { boxLevel, sessionId } = route.params;
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [boxCards, setBoxCards] = useState<Card[]>([]);

  const loadCardData = useCallback(async () => {
    // Load all cards for the specific session
    const loadedCards = await getCardsForSession(sessionId);
    setAllCards(loadedCards);
    
    // Filter cards that belong to this box
    const cardsInBox = loadedCards.filter(card => card.boxLevel === boxLevel);
    setBoxCards(cardsInBox);
  }, [boxLevel, sessionId]);

  useEffect(() => {
    loadCardData();
  }, [loadCardData]);

  const handleDeleteCard = (cardId: string) => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Get all cards first
            const allStoredCards = await loadCards();
            
            // Remove the card from the array
            const updatedAllCards = allStoredCards.filter(card => card.id !== cardId);
            
            // Save the updated array
            await saveCards(updatedAllCards);
            
            // Update state
            setAllCards(allCards.filter(card => card.id !== cardId));
            setBoxCards(boxCards.filter(card => card.id !== cardId));
          },
        },
      ]
    );
  };

  const renderCardItem = ({ item }: { item: Card }) => {
    return (
      <View style={styles.cardItem}>
        <View style={styles.cardContent}>
          <Text style={styles.cardFront}>{item.front}</Text>
          <Text style={styles.cardBack}>{item.back}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCard(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getBoxDescription = () => {
    switch(boxLevel) {
      case 1: return 'Review daily';
      case 2: return 'Review every 3 days';
      case 3: return 'Review weekly';
      case 4: return 'Review bi-weekly';
      case 5: return 'Review monthly';
      default: return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Box {boxLevel}</Text>
        <Text style={styles.subtitle}>{getBoxDescription()}</Text>
      </View>

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {boxCards.length} {boxCards.length === 1 ? 'card' : 'cards'} in this box
        </Text>
      </View>

      {boxCards.length > 0 ? (
        <FlatList
          data={boxCards}
          renderItem={renderCardItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No cards in this box yet.</Text>
          <Text style={styles.emptySubtext}>
            Add cards from the home screen and they'll appear here as they move through the session.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('Home', { sessionId })}
      >
        <Text style={styles.backButtonText}>Back to Session</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  statsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  statsText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardFront: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  cardBack: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  backButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#4ecdc4',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BoxDetailsScreen; 