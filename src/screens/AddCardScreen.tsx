import React, {useState} from 'react';
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
  Alert,
} from 'react-native';
import {Card} from '../models/Card';
import {saveCard} from '../utils/storage';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import uuid from 'react-native-uuid';
import { AppTheme } from '../utils/themes';
import BackButton from '../components/BackButton';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  AddCard: { sessionId: string };
};

type AddCardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddCard'
>;

interface AddCardScreenProps {
  navigation: AddCardScreenNavigationProp;
  route: RouteProp<RootStackParamList, 'AddCard'>;
}

const AddCardScreen: React.FC<AddCardScreenProps> = ({navigation, route}) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (front.trim() === '' || back.trim() === '') {
      Alert.alert(
        'Error',
        'Please enter both front and back text for the card.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new card - will always start in box 1
      const newCard: Card = {
        id: uuid.v4().toString(),
        front: front.trim(),
        back: back.trim(),
        boxLevel: 1,
        lastReviewed: null,
        createdAt: new Date(),
        learningSessionId: route.params.sessionId,
      };

      // Save the card directly using saveCard
      await saveCard(newCard);
      console.log('Card saved successfully:', newCard);

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
            onPress: () => navigation.navigate('Boxes', {sessionId: route.params.sessionId}),
          },
        ],
        {cancelable: false},
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
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <BackButton 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            />
            <View style={styles.headerContent}>
              <Text style={styles.title}>Add New Card</Text>
              <Text style={styles.subtitle}>
                New cards will be added to Box 1
              </Text>
            </View>
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
              style={[styles.buttonSave, isSubmitting && styles.buttonDisabled, styles.singleButton]}
              onPress={handleSave}
              disabled={isSubmitting}>
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
    backgroundColor: AppTheme.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    backgroundColor: AppTheme.main,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.white,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: AppTheme.white,
    opacity: 0.8,
    textAlign: 'center',
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
    color: AppTheme.text.dark,
  },
  input: {
    backgroundColor: AppTheme.white,
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
    backgroundColor: AppTheme.main,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonSaveText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 10,
    zIndex: 10,
  },
  singleButton: {
    flex: 1,
  },
});

export default AddCardScreen;
