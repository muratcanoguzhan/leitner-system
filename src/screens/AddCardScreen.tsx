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
import { AppTheme, AppStyles } from '../utils/themes';
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
    <SafeAreaView style={AppStyles.container.main}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={AppStyles.header.main}>
            <BackButton 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            />
            <View style={AppStyles.header.content}>
              <Text style={AppStyles.text.header}>Add New Card</Text>
              <Text style={[AppStyles.text.subtitle, { color: AppTheme.white, opacity: 0.8 }]}>
                New cards will be added to Box 1
              </Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={AppStyles.form.label}>Front (Question)</Text>
              <TextInput
                style={AppStyles.form.textArea}
                value={front}
                onChangeText={setFront}
                placeholder="Enter the question or word"
                multiline
                maxLength={200}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={AppStyles.form.label}>Back (Answer)</Text>
              <TextInput
                style={[AppStyles.form.textArea, styles.inputBack]}
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
              style={[
                AppStyles.button.primary, 
                isSubmitting && AppStyles.button.disabled, 
                styles.singleButton
              ]}
              onPress={handleSave}
              disabled={isSubmitting}>
              <Text style={AppStyles.button.primaryText}>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputBack: {
    minHeight: 150,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    marginTop: 'auto',
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
