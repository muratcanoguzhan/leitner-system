import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { LearningSession } from '../models/Card';
import { getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme, AppTheme } from '../utils/themes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import FloatingAddButton from '../components/FloatingAddButton';
import BackButton from '../components/BackButton';
import { SessionStats, getSessionStats } from '../services/StatisticsService';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  BoxDetails: { boxLevel: number; sessionId: string };
  AddCard: { sessionId: string };
  Review: { sessionId: string };
  ConfigureBoxIntervals: { sessionId: string };
};

type BoxesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Boxes'>;
type BoxesScreenRouteProp = RouteProp<RootStackParamList, 'Boxes'>;

interface BoxesScreenProps {
  navigation: BoxesScreenNavigationProp;
  route: BoxesScreenRouteProp;
}

const BoxesScreen: React.FC<BoxesScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState<LearningSession | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);

  // Check orientation
  const checkOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setIsLandscape(width > height);
  };

  useEffect(() => {
    checkOrientation();
    // Add event listener for orientation changes
    Dimensions.addEventListener('change', checkOrientation);
    
    // Return cleanup function
    return () => {
      // Remove event listener
      // Note: In newer React Native versions, this is handled automatically
    };
  }, []);

  useEffect(() => {
    const loadSessionData = async () => {
      const sessions = await loadSessions();
      const currentSession = sessions.find(s => s.id === sessionId);
      setSession(currentSession || null);
    };

    const loadCardData = async () => {
      try {
        setLoading(true);
        await getCardsForSession(sessionId); // Still fetch cards for side effects but don't store
        
        // Use the statistics service to get all stats
        const stats = await getSessionStats(sessionId);
        setSessionStats(stats);
      } catch (error) {
        console.error('Error loading card data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Update card data when the screen is focused
    const unsubscribe = navigation.addListener('focus', () => {
      loadSessionData();
      loadCardData();
    });

    // Initial load
    loadSessionData();
    loadCardData();

    return unsubscribe;
  }, [navigation, sessionId]);

  const renderBoxItem = ({ index }: { item: number; index: number }) => {
    const boxLevel = index + 1;
    let reviewText = '';
    
    // Get theme from shared utility
    const theme = getBoxTheme(boxLevel);
    
    // Use the session's custom box intervals if available
    if (session && session.boxIntervals) {
      switch(boxLevel) {
        case 1: 
          reviewText = session.boxIntervals.box1Days === 1 
            ? 'Review daily' 
            : `Review every ${session.boxIntervals.box1Days} days`;
          break;
        case 2: 
          reviewText = `Review every ${session.boxIntervals.box2Days} days`;
          break;
        case 3: 
          reviewText = `Review every ${session.boxIntervals.box3Days} days`;
          break;
        case 4: 
          reviewText = `Review every ${session.boxIntervals.box4Days} days`;
          break;
        case 5: 
          reviewText = `Review every ${session.boxIntervals.box5Days} days`;
          break;
        default:
          reviewText = 'Custom review interval';
      }
    } else {
      // Fallback to default text if session or intervals are not available
      switch(boxLevel) {
        case 1: reviewText = 'Review daily'; break;
        case 2: reviewText = 'Review every 3 days'; break;
        case 3: reviewText = 'Review weekly'; break;
        case 4: reviewText = 'Review bi-weekly'; break;
        case 5: reviewText = 'Review monthly'; break;
        default: reviewText = 'Custom review interval';
      }
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.boxItem, 
          { 
            backgroundColor: theme.bg,
            borderColor: theme.border,
            borderWidth: 1,
          },
          isLandscape && styles.boxItemLandscape
        ]}
        onPress={() => navigation.navigate('BoxDetails', { boxLevel, sessionId })}
      >
        <View style={styles.boxHeader}>
          <Text style={styles.boxIcon}>{theme.icon}</Text>
          <Text style={[styles.boxTitle, isLandscape && styles.boxTitleLandscape]}>{`Box ${boxLevel}`}</Text>
        </View>
        <Text style={[styles.boxCount, isLandscape && styles.boxCountLandscape]}>
          {sessionStats ? sessionStats.boxCounts[index] : 0} cards
        </Text>
        <Text style={[styles.boxDescription, isLandscape && styles.boxDescriptionLandscape]}>{reviewText}</Text>
      </TouchableOpacity>
    );
  };

  if (!session || loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, isLandscape && styles.headerLandscape]}>
          <BackButton 
            onPress={() => navigation.navigate('LearningSessions')}
            style={styles.backButtonIcon}
          />
          <View style={styles.headerContent}>
            <Text style={[styles.title, isLandscape && styles.titleLandscape]}>{session.name}</Text>
            <Text style={[styles.subtitle, isLandscape && styles.subtitleLandscape]}>Spaced Repetition Flashcards</Text>
          </View>
        </View>

        <View style={[styles.statsContainer, isLandscape && styles.statsContainerLandscape]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>
              {sessionStats ? sessionStats.total : 0}
            </Text>
            <Text style={[styles.statLabel, isLandscape && styles.statLabelLandscape]}>Total Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isLandscape && styles.statValueLandscape]}>
              {sessionStats ? sessionStats.due : 0}
            </Text>
            <Text style={[styles.statLabel, isLandscape && styles.statLabelLandscape]}>Due for Review</Text>
          </View>
        </View>

        <View style={[styles.sectionHeader, isLandscape && styles.sectionHeaderLandscape]}>
          <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape]}>Your Boxes</Text>
          <TouchableOpacity 
            style={[styles.configButton, isLandscape && styles.configButtonLandscape]}
            onPress={() => navigation.navigate('ConfigureBoxIntervals', { sessionId })}
          >
            <Text style={[styles.configButtonText, isLandscape && styles.configButtonTextLandscape]}>Configure Intervals</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.boxesGrid}>
          {sessionStats && sessionStats.boxCounts.map((count, index) => (
            <React.Fragment key={`box-${index + 1}`}>
              {renderBoxItem({ item: count, index })}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.spacer} />
      </ScrollView>
      
      <FloatingAddButton 
        onPress={() => navigation.navigate('AddCard', { sessionId })}
      />
      
      {sessionStats && sessionStats.due > 0 && (
        <TouchableOpacity 
          style={[styles.reviewFloatingButton]}
          onPress={() => navigation.navigate('Review', { sessionId })}
        >
          <Text style={styles.reviewFloatingButtonText}>Start Review</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingVertical: 25,
    backgroundColor: AppTheme.main,
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
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLandscape: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  backButtonIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  titleLandscape: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  subtitleLandscape: {
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: AppTheme.white,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    padding: 5,
  },
  statsContainerLandscape: {
    marginTop: 10,
    marginHorizontal: 15,
    padding: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
  },
  statValueLandscape: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 14,
    color: AppTheme.text.light,
    marginTop: 5,
    fontWeight: '500',
  },
  statLabelLandscape: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 10,
  },
  sectionHeaderLandscape: {
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
  },
  sectionTitleLandscape: {
    fontSize: 18,
  },
  boxesGrid: {
    paddingHorizontal: 20,
  },
  boxItem: {
    backgroundColor: AppTheme.white,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  boxItemLandscape: {
    padding: 12,
    marginBottom: 8,
  },
  boxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  boxIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  boxTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
  },
  boxTitleLandscape: {
    fontSize: 16,
  },
  boxCount: {
    fontSize: 16,
    color: AppTheme.text.medium,
    marginTop: 6,
    marginBottom: 2,
  },
  boxCountLandscape: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 1,
  },
  boxDescription: {
    fontSize: 14,
    color: AppTheme.text.light,
    marginTop: 5,
  },
  boxDescriptionLandscape: {
    fontSize: 12,
    marginTop: 3,
  },
  buttonContainer: {
    padding: 20,
    flexDirection: 'row',
    backgroundColor: AppTheme.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  buttonContainerLandscape: {
    padding: 10,
    paddingHorizontal: 15,
  },
  button: {
    flex: 1,
    backgroundColor: AppTheme.main,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonLandscape: {
    padding: 12,
    borderRadius: 10,
  },
  reviewButton: {
    backgroundColor: AppTheme.danger,
  },
  buttonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonTextLandscape: {
    fontSize: 14,
  },
  configButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  configButtonLandscape: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  configButtonText: {
    color: AppTheme.text.medium,
    fontSize: 14,
    fontWeight: '500',
  },
  configButtonTextLandscape: {
    fontSize: 12,
  },
  spacer: {
    height: 100, // This adds space between boxes and buttons
  },
  reviewFloatingButton: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    backgroundColor: AppTheme.danger,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  reviewFloatingButtonText: {
    color: AppTheme.white,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
});

export default BoxesScreen; 