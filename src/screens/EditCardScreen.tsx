import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Card } from '../models/Card';
import { saveCard, getCard } from '../utils/storage';
import { AppStyles } from '../utils/themes';
import { useTheme } from '../utils/ThemeContext';
import BackButton from '../components/BackButton';

type RootStackParamList = {
  Boxes: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  EditCard: { cardId: string };
};

type EditCardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditCard'>;
type EditCardScreenRouteProp = RouteProp<RootStackParamList, 'EditCard'>;

interface EditCardScreenProps {
  navigation: EditCardScreenNavigationProp;
  route: EditCardScreenRouteProp;
}

const EditCardScreen: React.FC<EditCardScreenProps> = ({ navigation, route }) => {
  const { cardId } = route.params;
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    const loadCardData = async () => {
      try {
        const card = await getCard(cardId);
        if (card) {
          setFront(card.front);
          setBack(card.back);
        } else {
          Alert.alert('Error', 'Could not find card data');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Error loading card data:', error);
        Alert.alert('Error', 'Failed to load card data');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadCardData();
  }, [cardId, navigation]);

  const handleUpdate = async () => {
    if (front.trim() === '' || back.trim() === '') {
      Alert.alert(
        'Error',
        'Please enter both front and back text for the card.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the existing card first to preserve other properties
      const existingCard = await getCard(cardId);
      if (!existingCard) {
        throw new Error('Card not found');
      }

      // Update only the front and back
      const updatedCard: Card = {
        ...existingCard,
        front: front.trim(),
        back: back.trim(),
      };

      // Save the updated card
      await saveCard(updatedCard);
      console.log('Card updated successfully:', updatedCard);

      // Show success message
      Alert.alert(
        'Success',
        'Card updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false },
      );
    } catch (error) {
      console.error('Error updating card:', error);
      Alert.alert('Error', 'Failed to update card. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[AppStyles.container.main, { backgroundColor: theme.background }]}>
        <View style={AppStyles.loading.container}>
          <Text style={[AppStyles.loading.text, { color: theme.text.dark }]}>Loading card data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[AppStyles.container.main, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={[styles.header, { backgroundColor: theme.main }]}>
            <BackButton 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            />
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#000' : '#fff' }]}>Edit Card</Text>
          </View>

          <View style={styles.content}>
            <Text style={[styles.subtitle, { color: theme.text.light }]}>
              Update the front and back of this card
            </Text>

            <View style={[AppStyles.container.card, { 
              backgroundColor: theme.white,
              shadowColor: isDarkMode ? '#fff' : '#000',
              shadowOpacity: isDarkMode ? 0.05 : 0.1
            }]}>
              <View style={styles.inputGroup}>
                <Text style={[AppStyles.form.label, { color: theme.text.dark }]}>Front (Question)</Text>
                <TextInput
                  style={[AppStyles.form.textArea, { 
                    backgroundColor: theme.white,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                    color: theme.text.dark
                  }]}
                  value={front}
                  onChangeText={setFront}
                  placeholder="Enter the question or word"
                  placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
                  multiline
                  maxLength={200}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[AppStyles.form.label, { color: theme.text.dark }]}>Back (Answer)</Text>
                <TextInput
                  style={[AppStyles.form.textArea, styles.inputBack, { 
                    backgroundColor: theme.white,
                    borderColor: isDarkMode ? '#444' : '#ddd',
                    color: theme.text.dark
                  }]}
                  value={back}
                  onChangeText={setBack}
                  placeholder="Enter the answer or definition"
                  placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
                  multiline
                  maxLength={500}
                />
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[AppStyles.button.secondary, styles.buttonFlex, {
                backgroundColor: isDarkMode ? '#444' : '#ddd'
              }]}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}>
              <Text style={[AppStyles.button.secondaryText, { color: theme.text.dark }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                AppStyles.button.primary, 
                isSubmitting && AppStyles.button.disabled,
                styles.buttonFlex,
                { backgroundColor: theme.main }
              ]}
              onPress={handleUpdate}
              disabled={isSubmitting}>
              <Text style={[AppStyles.button.primaryText, { color: isDarkMode ? '#000' : '#fff' }]}>
                {isSubmitting ? 'Updating...' : 'Update Card'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    position: 'relative',
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 5,
    left: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputBack: {
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonFlex: {
    flex: 1,
    marginHorizontal: 5,
  }
});

export default EditCardScreen; 