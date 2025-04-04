import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Card } from '../models/Card';
import { AppTheme } from '../utils/themes';

interface FlashCardProps {
  card: Card;
  onCorrect: () => void;
  onIncorrect: () => void;
}

const FlashCard: React.FC<FlashCardProps> = ({ card, onCorrect, onIncorrect }) => {
  const [showAnswer, setShowAnswer] = useState(false);

  const toggleCard = () => {
    setShowAnswer(!showAnswer);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: card.boxLevel === 5 ? '#e6ffe6' : '#fff' }]} 
        onPress={toggleCard}
        activeOpacity={0.9}
      >
        <Text style={styles.boxLabel}>Box {card.boxLevel}</Text>
        <View style={styles.contentContainer}>
          <Text style={styles.contentText}>
            {showAnswer ? card.back : card.front}
          </Text>
          <Text style={styles.flipPrompt}>Tap to {showAnswer ? 'see question' : 'see answer'}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.wrongButton]}
          onPress={onIncorrect}
        >
          <Text style={styles.buttonText}>Incorrect</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.correctButton]}
          onPress={onCorrect}
        >
          <Text style={styles.buttonText}>Correct</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  card: {
    width: width - 40,
    height: 200,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    padding: 15,
    position: 'relative',
  },
  boxLabel: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    fontSize: 12,
    color: '#555',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  flipPrompt: {
    position: 'absolute',
    bottom: 5,
    fontSize: 12,
    color: '#999',
  },
  buttonsContainer: {
    flexDirection: 'row',
    marginTop: 15,
    width: width - 40,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctButton: {
    backgroundColor: AppTheme.main,
  },
  wrongButton: {
    backgroundColor: AppTheme.danger,
  },
  buttonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
  },
});

export default FlashCard; 