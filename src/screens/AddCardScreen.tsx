import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { Card } from '../models/Card';
import { loadCards, saveCards } from '../utils/storage';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Home: undefined;
  AddCard: undefined;
};

type AddCardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddCard'>;

interface AddCardScreenProps {
  navigation: AddCardScreenNavigationProp;
}

const AddCardScreen: React.FC<AddCardScreenProps> = ({ navigation }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (front.trim() === '' || back.trim() === '') {
      Alert.alert('Error', 'Please enter both front and back text for the card.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Load existing cards
      const existingCards = await loadCards();

      // Create new card - will always start in box 1
      const newCard: Card = {
        id: Date.now().toString(),
        front: front.trim(),
        back: back.trim(),
        boxLevel: 1,
        lastReviewed: null,
        createdAt: new Date()
      };

      // Save the updated cards array
      await saveCards([...existingCards, newCard]);

      // Reset form
      setFront('');
      setBack('');
      
      // Show success message
      Alert.alert(
        'Success',
        'Card added successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setFront('');
              setBack('');
              setIsSubmitting(false);
            },
          },
          {
            text: 'Go to Home',
            onPress: () => navigation.navigate('Home'),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'Failed to save card. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Card</Text>
            <Text style={styles.subtitle}>New cards will be added to Box 1</Text>
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
              style={styles.buttonCancel}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.buttonSave, isSubmitting && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonSaveText}>
                {isSubmitting ? 'Adding...' : 'Add Card'}
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
    backgroundColor: '#f9f9f9',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
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
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputBack: {
    minHeight: 150,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    marginTop: 'auto',
  },
  buttonSave: {
    flex: 3,
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    flex: 2,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonCancelText: {
    color: '#666',
    fontSize: 16,
  },
});

export default AddCardScreen; 