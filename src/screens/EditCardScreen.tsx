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
      <SafeAreaView style={AppStyles.container.main}>
        <View style={AppStyles.loading.container}>
          <Text style={AppStyles.loading.text}>Loading card data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={AppStyles.container.main}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <Text style={AppStyles.text.title}>Edit Card</Text>
            <Text style={AppStyles.text.subtitle}>
              Update the front and back of this card
            </Text>
          </View>

          <View style={AppStyles.container.card}>
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
              style={[AppStyles.button.secondary, styles.buttonFlex]}
              onPress={() => navigation.goBack()}
              disabled={isSubmitting}>
              <Text style={AppStyles.button.secondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                AppStyles.button.primary, 
                isSubmitting && AppStyles.button.disabled,
                styles.buttonFlex
              ]}
              onPress={handleUpdate}
              disabled={isSubmitting}>
              <Text style={AppStyles.button.primaryText}>
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
    marginBottom: 30,
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