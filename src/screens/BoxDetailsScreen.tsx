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
import { deleteCard, getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme, AppStyles } from '../utils/themes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  EditCard: { cardId: string };
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

  // Reload data when screen comes into focus (e.g., when returning from EditCardScreen)
  useFocusEffect(
    useCallback(() => {
      loadCardData();
    }, [loadCardData])
  );

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
            try {
              // Delete the card directly
              await deleteCard(cardId);
              console.log('Card deleted successfully:', cardId);
              
              // Update state
              setAllCards(allCards.filter(card => card.id !== cardId));
              setBoxCards(boxCards.filter(card => card.id !== cardId));
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to delete card. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderCardItem = ({ item }: { item: Card }) => {
    const theme = getBoxTheme(boxLevel);
    
    return (
      <View style={[AppStyles.list.item, { borderLeftColor: theme.border }]}>
        <View style={styles.cardContent}>
          <Text style={AppStyles.text.title}>{item.front}</Text>
          <Text style={AppStyles.text.subtitle}>{item.back}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[AppStyles.button.primary, styles.actionButton]}
            onPress={() => navigation.navigate('EditCard', { cardId: item.id })}
          >
            <Text style={AppStyles.button.primaryText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[AppStyles.button.danger, styles.actionButton]}
            onPress={() => handleDeleteCard(item.id)}
          >
            <Text style={AppStyles.button.primaryText}>Delete</Text>
          </TouchableOpacity>
        </View>
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
    <SafeAreaView style={AppStyles.container.main}>
      <View style={[styles.header, { backgroundColor: getBoxTheme(boxLevel).header }]}>
        <BackButton 
          onPress={() => navigation.goBack()} 
          style={styles.backButtonIcon}
        />
        <View style={styles.headerContent}>
          <Text style={styles.boxIcon}>{getBoxTheme(boxLevel).icon}</Text>
          <View>
            <Text style={styles.title}>Box {boxLevel}</Text>
            <Text style={styles.subtitle}>{getBoxDescription()}</Text>
          </View>
        </View>
      </View>

      <View style={AppStyles.stats.container}>
        <Text style={AppStyles.text.regular}>
          {boxCards.length} {boxCards.length === 1 ? 'card' : 'cards'} in this box
        </Text>
      </View>

      {boxCards.length > 0 ? (
        <FlatList
          data={boxCards}
          renderItem={renderCardItem}
          keyExtractor={item => item.id}
          contentContainerStyle={AppStyles.list.container}
        />
      ) : (
        <View style={AppStyles.loading.container}>
          <Text style={[AppStyles.text.title, { marginBottom: 12 }]}>No cards in this box yet.</Text>
          <Text style={[AppStyles.text.subtitle, { textAlign: 'center', lineHeight: 24 }]}>
            Add cards from the home screen and they'll appear here as they move through the session.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  cardContent: {
    flex: 1,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 10,
    marginLeft: 5,
  },
  backButtonIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },
});

export default BoxDetailsScreen; 