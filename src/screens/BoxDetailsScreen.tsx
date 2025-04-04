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
import { Card, LearningSession } from '../models/Card';
import { loadCards, saveCards, getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme } from '../utils/themes';
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
  const [session, setSession] = useState<LearningSession | null>(null);

  const loadCardData = useCallback(async () => {
    const loadedCards = await getCardsForSession(sessionId);
    setAllCards(loadedCards);
    
    const cardsInBox = loadedCards.filter(card => card.boxLevel === boxLevel);
    setBoxCards(cardsInBox);
    
    // Load session data
    const sessions = await loadSessions();
    const currentSession = sessions.find(s => s.id === sessionId);
    setSession(currentSession || null);
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
    const theme = getBoxTheme(boxLevel);
    
    return (
      <View style={[styles.cardItem, { borderLeftColor: theme.border }]}>
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
    if (session && session.boxIntervals) {
      // Use the session's custom box intervals
      switch(boxLevel) {
        case 1: 
          return session.boxIntervals.box1Days === 1 
            ? 'Review daily' 
            : `Review every ${session.boxIntervals.box1Days} days`;
        case 2: 
          return `Review every ${session.boxIntervals.box2Days} days`;
        case 3: 
          return `Review every ${session.boxIntervals.box3Days} days`;
        case 4: 
          return `Review every ${session.boxIntervals.box4Days} days`;
        case 5: 
          return `Review every ${session.boxIntervals.box5Days} days`;
        default: 
          return '';
      }
    } else {
      // Fallback to default descriptions
      switch(boxLevel) {
        case 1: return 'Review daily';
        case 2: return 'Review every 3 days';
        case 3: return 'Review weekly';
        case 4: return 'Review bi-weekly';
        case 5: return 'Review monthly';
        default: return '';
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { backgroundColor: getBoxTheme(boxLevel).header }]}>
        <View style={styles.headerContent}>
          <Text style={styles.boxIcon}>{getBoxTheme(boxLevel).icon}</Text>
          <View>
            <Text style={styles.title}>Box {boxLevel}</Text>
            <Text style={styles.subtitle}>{getBoxDescription()}</Text>
          </View>
        </View>
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
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxIcon: {
    fontSize: 32,
    marginRight: 15,
    color: '#fff',
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
  statsContainer: {
    margin: 20,
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#555',
  },
  listContainer: {
    padding: 20,
  },
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 4,
  },
  cardContent: {
    flex: 1,
  },
  cardFront: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardBack: {
    fontSize: 16,
    color: '#666',
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 10,
    elevation: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  backButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#4ecdc4',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BoxDetailsScreen; 