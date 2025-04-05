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
import { AppTheme } from '../utils/themes';

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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading card data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Card</Text>
            <Text style={styles.subtitle}>
              Update the front and back of this card
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Front (Question)</Text>
              <TextInput
                style={styles.input}
                value={front}
                onChangeText={setFront}
                placeholder="Enter the question or word"
                multiline
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Back (Answer)</Text>
              <TextInput
                style={[styles.input, styles.inputBack]}
                value={back}
                onChangeText={setBack}
                placeholder="Enter the answer or definition"
                multiline
                maxLength={500}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, isSubmitting && styles.disabledButton]}
              onPress={handleUpdate}
              disabled={isSubmitting}>
              <Text style={styles.saveButtonText}>
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
  container: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: AppTheme.text.medium,
  },
  formContainer: {
    backgroundColor: AppTheme.white,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: AppTheme.text.dark,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 15,
    fontSize: 16,
    color: AppTheme.text.dark,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  inputBack: {
    minHeight: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: AppTheme.main,
  },
  cancelButton: {
    backgroundColor: '#f1f1f1',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  saveButtonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelButtonText: {
    color: AppTheme.text.medium,
    fontWeight: '500',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: AppTheme.text.medium,
  },
});

export default EditCardScreen; 