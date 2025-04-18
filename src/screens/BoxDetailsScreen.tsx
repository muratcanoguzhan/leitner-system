import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Modal,
} from 'react-native';
import { Card, LearningSession, CardActionType } from '../models/Card';
import { deleteCard, getCardsForSession, loadSessions, saveCard } from '../utils/storage';
import { getBoxTheme, AppStyles } from '../utils/themes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/BackButton';
import { useTheme } from '../utils/ThemeContext';
import { showAlert } from '../utils/alertUtil';
import { logCardAction, getBoxStatistics } from '../services/CardActionService';

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
  const [boxCards, setBoxCards] = useState<Card[]>([]);
  const [session, setSession] = useState<LearningSession | null>(null);
  const { theme, isDarkMode } = useTheme();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [moveBoxModalVisible, setMoveBoxModalVisible] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [multiMoveModalVisible, setMultiMoveModalVisible] = useState(false);
  const [boxStats, setBoxStats] = useState<{ 
    total: number;
    correct: number;
    incorrect: number;
    notAnswered: number;
  } | null>(null);

  // Helper function to close the card move modal
  const closeCardMoveModal = () => {
    setMoveBoxModalVisible(false);
    setSelectedCard(null);
  };

  // Helper function to close the multi-card move modal
  const closeMultiMoveModal = () => {
    setMultiMoveModalVisible(false);
  };

  const loadCardData = useCallback(async () => {
    const loadedCards = await getCardsForSession(sessionId);
    const cardsInBox = loadedCards.filter(card => card.boxLevel === boxLevel);
    setBoxCards(cardsInBox);
    
    // Load session data
    const sessions = await loadSessions();
    const currentSession = sessions.find(s => s.id === sessionId);
    setSession(currentSession || null);
    
    // Load box statistics
    try {
      const stats = await getBoxStatistics(sessionId, boxLevel);
      setBoxStats(stats);
    } catch (error) {
      console.error('Error loading box statistics:', error);
      setBoxStats(null);
    }
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

  // Helper method to get the lastReviewed date based on the target box level
  const getLastReviewedDate = (targetBoxLevel: number): Date | null => {
    if (targetBoxLevel === 1) {
      // For box 1, always set lastReviewed to null for immediate review
      return null;
    } else {
      // For all other boxes, set to current date
      return new Date();
    }
  };

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
              
              // Log the DELETE action
              await logCardAction(
                cardId,
                CardActionType.DELETED,
                sessionId,
                boxLevel
              );
              
              setBoxCards(boxCards.filter(card => card.id !== cardId));
              
              // Reload card data to update stats
              loadCardData();
            } catch (error) {
              console.error('Error deleting card:', error);
              showAlert('Error', 'Failed to delete card. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleMoveCard = async (card: Card, newBoxLevel: number) => {
    try {
      // Skip if trying to move to the same box
      if (card.boxLevel === newBoxLevel) {
        closeCardMoveModal();
        return;
      }

      const originalBoxLevel = card.boxLevel;
      
      // Get the appropriate lastReviewed date
      const lastReviewedDate = getLastReviewedDate(newBoxLevel);

      // Create an updated card with the new box level and lastReviewed date
      const updatedCard: Card = {
        ...card,
        boxLevel: newBoxLevel,
        lastReviewed: lastReviewedDate
      };

      // Save the card to the database
      await saveCard(updatedCard);
      console.log(`Card moved from Box ${card.boxLevel} to Box ${newBoxLevel}`);
      
      // Log the MOVED action
      await logCardAction(
        card.id,
        CardActionType.MOVED,
        sessionId,
        originalBoxLevel,
        newBoxLevel
      );
      
      // Remove the card from boxCards since it's no longer in this box
      setBoxCards(boxCards.filter(c => c.id !== card.id));

      // Close the modal
      closeCardMoveModal();

      // Reload card data to update stats
      loadCardData();

      // Show success message
      showAlert(
        'Card Moved',
        `Card moved successfully to Box ${newBoxLevel}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error moving card:', error);
      showAlert('Error', 'Failed to move card. Please try again.');
    }
  };

  // Toggle card selection for multi-select mode
  const toggleCardSelection = (card: Card) => {
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  // Handle moving multiple cards at once
  const handleMultiMoveCards = async (newBoxLevel: number) => {
    try {
      // No need to check for empty selection - the button to open modal is disabled in this case
      // and we're enforcing selection in the UI
      
      // Skip if trying to move to the current box (which should be prevented by UI anyway)
      if (boxLevel === newBoxLevel) {
        closeMultiMoveModal();
        return;
      }

      // Get the appropriate lastReviewed date once
      const lastReviewedDate = getLastReviewedDate(newBoxLevel);

      // Update each card in the database
      const updatePromises = selectedCards.map(async (card) => {
        const originalBoxLevel = card.boxLevel;
        const updatedCard: Card = {
          ...card,
          boxLevel: newBoxLevel,
          lastReviewed: lastReviewedDate
        };

        // Save the updated card to database
        await saveCard(updatedCard);
        
        // Log the MOVED action
        await logCardAction(
          card.id,
          CardActionType.MOVED,
          sessionId,
          originalBoxLevel,
          newBoxLevel
        );
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      
      // Remove the selected cards from boxCards
      setBoxCards(boxCards.filter(card => !selectedCards.some(c => c.id === card.id)));

      // Reset state
      closeMultiMoveModal();
      setSelectedCards([]);
      setIsMultiSelectMode(false);

      // Reload card data to update stats
      loadCardData();

      // Show success message
      showAlert(
        'Cards Moved',
        `${selectedCards.length} card${selectedCards.length === 1 ? '' : 's'} moved successfully to Box ${newBoxLevel}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error moving multiple cards:', error);
      showAlert('Error', 'Failed to move cards. Please try again.');
    }
  };

  // Helper function to render a box button
  const renderBoxButton = (level: number, isMultiSelect: boolean, targetBoxLevel: number | undefined, onPress: (level: number) => void) => {
    const isCurrentBox = isMultiSelect 
      ? boxLevel === level 
      : targetBoxLevel === level;
    
    return (
      <TouchableOpacity
        key={isMultiSelect ? `multi-box-${level}` : `box-${level}`}
        style={[
          styles.boxButton,
          { 
            backgroundColor: isCurrentBox
              ? isDarkMode ? '#333' : '#f0f0f0' 
              : getBoxTheme(level, isDarkMode ? 'dark' : 'light').header
          }
        ]}
        onPress={() => onPress(level)}
        disabled={isCurrentBox}
      >
        <Text style={[
          styles.boxButtonIcon, 
          { color: isCurrentBox ? (isDarkMode ? '#fff' : '#555') : '#fff' }
        ]}>
          {getBoxTheme(level, isDarkMode ? 'dark' : 'light').icon}
        </Text>
        <Text style={[
          styles.boxButtonText, 
          { 
            color: isCurrentBox ? (isDarkMode ? '#fff' : '#555') : '#fff',
            opacity: isCurrentBox ? 0.8 : 1
          }
        ]}>
          Box {level}
          {isCurrentBox ? ' (current)' : ''}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCardItem = ({ item }: { item: Card }) => {
    const boxTheme = getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light');
    const isSelected = selectedCards.some(card => card.id === item.id);
    
    return (
      <TouchableOpacity
        activeOpacity={isMultiSelectMode ? 0.6 : 1}
        onPress={() => isMultiSelectMode ? toggleCardSelection(item) : null}
        onLongPress={() => {
          if (!isMultiSelectMode) {
            setIsMultiSelectMode(true);
            setSelectedCards([item]);
          }
        }}
      >
        <View style={[
          AppStyles.list.item, 
          styles.rowLayout,
          { 
            borderLeftColor: boxTheme.border,
            backgroundColor: isSelected ? (isDarkMode ? '#2a3858' : '#e6efff') : theme.white,
            shadowColor: isDarkMode ? '#fff' : '#000',
            shadowOpacity: isDarkMode ? 0.05 : 0.1
          }
        ]}>
          <View style={styles.textContent}>
            <Text style={[AppStyles.text.title, { color: theme.text.dark }]}>{item.front}</Text>
            <Text style={[AppStyles.text.subtitle, { color: theme.text.light }]}>{item.back}</Text>
          </View>
          {isMultiSelectMode ? (
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.checkbox, 
                { 
                  borderColor: theme.main,
                  backgroundColor: isSelected ? theme.main : 'transparent'
                }
              ]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
          ) : (
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.success }]}
                onPress={() => {
                  setSelectedCard(item);
                  setMoveBoxModalVisible(true);
                }}
              >
                <Text style={[AppStyles.button.primaryText, { color: '#fff' }]}>Move</Text>
              </TouchableOpacity>
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
          )}
        </View>
      </TouchableOpacity>
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
      {/* Box movement modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={moveBoxModalVisible}
        onRequestClose={closeCardMoveModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.text.dark }]}>Move Card to Box</Text>
            <Text style={[styles.modalSubtitle, { color: theme.text.light }]}>
              Select a box to move this card to
            </Text>
            
            <View style={styles.boxButtonsContainer}>
              {[1, 2, 3, 4, 5].map(level => 
                renderBoxButton(
                  level, 
                  false, 
                  selectedCard?.boxLevel, 
                  (boxLevel) => handleMoveCard(selectedCard as Card, boxLevel)
                )
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
              onPress={closeCardMoveModal}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text.light }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* Multi-move modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={multiMoveModalVisible}
        onRequestClose={closeMultiMoveModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.white }]}>
            <Text style={[styles.modalTitle, { color: theme.text.dark }]}>Move Cards to Box</Text>
            <Text style={[styles.modalSubtitle, { color: theme.text.light }]}>
              Move {selectedCards.length} selected card{selectedCards.length === 1 ? '' : 's'} to:
            </Text>
            
            <View style={styles.boxButtonsContainer}>
              {[1, 2, 3, 4, 5].map(level => 
                renderBoxButton(
                  level, 
                  true, 
                  undefined, 
                  handleMultiMoveCards
                )
              )}
            </View>
            
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: isDarkMode ? '#333' : '#f0f0f0' }]}
              onPress={closeMultiMoveModal}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text.light }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      <View style={[styles.header, { backgroundColor: getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').header }]}>
        <BackButton 
          onPress={() => {
            if (isMultiSelectMode) {
              setIsMultiSelectMode(false);
              setSelectedCards([]);
            } else {
              navigation.goBack();
            }
          }} 
          style={styles.backButtonIcon}
        />
        <View style={styles.headerContent}>
          <View style={styles.headerInner}>
            <Text style={[styles.boxIcon, { color: isDarkMode ? '#fff' : '#fff' }]}>{getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').icon}</Text>
            <View>
              <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#fff' }]}>
                {isMultiSelectMode 
                  ? `${selectedCards.length} Selected` 
                  : `Box ${boxLevel}`}
              </Text>
              <Text style={[styles.subtitle, { color: isDarkMode ? '#eee' : '#f0f0f0' }]}>
                {isMultiSelectMode 
                  ? 'Tap to select more cards' 
                  : getBoxDescription()}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={[AppStyles.stats.container, {
        backgroundColor: theme.white,
        shadowColor: isDarkMode ? '#fff' : '#000',
        shadowOpacity: isDarkMode ? 0.05 : 0.1
      }]}>
        {isMultiSelectMode ? (
          <View style={styles.multiSelectControls}>
            <TouchableOpacity
              style={[styles.multiSelectButton, { backgroundColor: theme.success }]}
              onPress={() => {
                if (selectedCards.length > 0) {
                  setMultiMoveModalVisible(true);
                } else {
                  showAlert('No Cards Selected', 'Please select at least one card to move.', [{ text: 'OK' }]);
                }
              }}
              disabled={selectedCards.length === 0}
            >
              <Text style={styles.multiSelectButtonText}>Move Selected</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.multiSelectButton, { backgroundColor: isDarkMode ? '#333' : '#e0e0e0' }]}
              onPress={() => {
                setIsMultiSelectMode(false);
                setSelectedCards([]);
              }}
            >
              <Text style={[styles.multiSelectButtonText, { color: theme.text.light }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsOverview}>
            <Text style={[AppStyles.text.regular, { color: theme.text.dark }]}>
              {boxCards.length} {boxCards.length === 1 ? 'card' : 'cards'} in this box
            </Text>
            
            {boxStats && (
              <View style={styles.boxStatsContainer}>
                <View style={styles.boxStatItem}>
                  <Text style={[styles.boxStatValue, { color: theme.success }]}>{boxStats.correct}</Text>
                  <Text style={[styles.boxStatLabel, { color: theme.text.light }]}>Correct</Text>
                </View>
                
                <View style={styles.boxStatItem}>
                  <Text style={[styles.boxStatValue, { color: theme.danger }]}>{boxStats.incorrect}</Text>
                  <Text style={[styles.boxStatLabel, { color: theme.text.light }]}>Incorrect</Text>
                </View>
                
                <View style={styles.boxStatItem}>
                  <Text style={[styles.boxStatValue, { color: theme.text.light }]}>{boxStats.notAnswered}</Text>
                  <Text style={[styles.boxStatLabel, { color: theme.text.light }]}>Not Answered</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.hintContainer}>
        <Text style={[styles.hintText, { color: theme.text.light }]}>
          Tip: Long press on a card to enter multi-select mode
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
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 6,
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  boxButtonsContainer: {
    marginBottom: 20,
  },
  boxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  boxButtonIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  boxButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxContainer: {
    paddingRight: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  multiSelectControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  multiSelectButton: {
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  multiSelectButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  hintContainer: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 5,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statsOverview: {
    width: '100%',
  },
  boxStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  boxStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  boxStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  boxStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default BoxDetailsScreen; 