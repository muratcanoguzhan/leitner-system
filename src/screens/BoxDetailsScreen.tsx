import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView
} from 'react-native';
import { Card, LearningSession } from '../models/Card';
import { deleteCard, getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme, AppStyles } from '../utils/themes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { useTheme } from '../utils/ThemeContext';
import { showAlert } from '../utils/alertUtil';

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
  const { theme, isDarkMode } = useTheme();

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
    showAlert(
      'Delete Card',
      'Are you sure you want to delete this card?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(cardId);
              console.log('Card deleted successfully:', cardId);
              
              // Update state
              setAllCards(allCards.filter(card => card.id !== cardId));
              setBoxCards(boxCards.filter(card => card.id !== cardId));
            } catch (error) {
              console.error('Error deleting card:', error);
              showAlert('Error', 'Failed to delete card. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderCardItem = ({ item }: { item: Card }) => {
    const boxTheme = getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light');
    
    return (
      <View style={[
        AppStyles.list.item, 
        styles.rowLayout,
        { 
          borderLeftColor: boxTheme.border,
          backgroundColor: theme.white,
          shadowColor: isDarkMode ? '#fff' : '#000',
          shadowOpacity: isDarkMode ? 0.05 : 0.1
        }
      ]}>
        <View style={styles.textContent}>
          <Text style={[AppStyles.text.title, { color: theme.text.dark }]}>{item.front}</Text>
          <Text style={[AppStyles.text.subtitle, { color: theme.text.light }]}>{item.back}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[AppStyles.button.primary, styles.actionButton, { backgroundColor: theme.main }]}
            onPress={() => navigation.navigate('EditCard', { cardId: item.id })}
          >
            <Text style={[AppStyles.button.primaryText, { color: isDarkMode ? '#000' : '#fff' }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[AppStyles.button.danger, styles.actionButton]}
            onPress={() => handleDeleteCard(item.id)}
          >
            <Text style={[AppStyles.button.primaryText, { color: '#fff' }]}>Delete</Text>
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
    <SafeAreaView style={[AppStyles.container.main, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').header }]}>
        <BackButton 
          onPress={() => navigation.goBack()} 
          style={styles.backButtonIcon}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerInner}>
            <Text style={[styles.boxIcon, { color: isDarkMode ? '#fff' : '#fff' }]}>{getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').icon}</Text>
            <View>
              <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#fff' }]}>Box {boxLevel}</Text>
              <Text style={[styles.subtitle, { color: isDarkMode ? '#eee' : '#f0f0f0' }]}>{getBoxDescription()}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[AppStyles.stats.container, {
        backgroundColor: theme.white,
        shadowColor: isDarkMode ? '#fff' : '#000',
        shadowOpacity: isDarkMode ? 0.05 : 0.1
      }]}>
        <Text style={[AppStyles.text.regular, { color: theme.text.dark }]}>
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
          <Text style={[AppStyles.text.title, { marginBottom: 12, color: theme.text.dark }]}>No cards in this box yet.</Text>
          <Text style={[AppStyles.text.subtitle, { textAlign: 'center', lineHeight: 24, color: theme.text.light }]}>
            Add cards from the home screen and they'll appear here as they move through the session.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingVertical: 25,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    position: 'relative',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },
  boxIcon: {
    fontSize: 26,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 8,
  },
  rowLayout: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    marginRight: 10,
  },
});

export default BoxDetailsScreen; 