import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView } from 'react-native';
import { LearningSession } from '../models/Card';
import { getCardsForSession, loadSessions } from '../utils/storage';
import { getBoxTheme } from '../utils/themes';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import FloatingAddButton from '../components/FloatingAddButton';
import BackButton from '../components/BackButton';
import { SessionStats, getSessionStats } from '../services/StatisticsService';
import { getSessionStatistics } from '../services/CardActionService';
import { useTheme } from '../utils/ThemeContext';

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
  const [actionStats, setActionStats] = useState<{
    boxStats: Array<{
      boxLevel: number;
      total: number;
      correct: number;
      incorrect: number;
      notAnswered: number;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const { theme, isDarkMode } = useTheme();

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
        
        // Get action-based statistics
        const actionBasedStats = await getSessionStatistics(sessionId);
        setActionStats(actionBasedStats);
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

  // Add a helper function to find box stats
  const getBoxStatData = (boxLevel: number) => {
    if (actionStats && actionStats.boxStats) {
      const boxStat = actionStats.boxStats.find(stat => stat.boxLevel === boxLevel);
      if (boxStat) {
        return boxStat;
      }
    }
    return { total: 0, correct: 0, incorrect: 0, notAnswered: 0 };
  };

  const getReviewText = (boxLevel: number) => {
    if (!session) return '';
    
    let interval = 0;
    if (session.boxIntervals) {
      // Safely access the boxIntervals object using property names
      switch(boxLevel) {
        case 1: interval = session.boxIntervals.box1Days || 0; break;
        case 2: interval = session.boxIntervals.box2Days || 0; break;
        case 3: interval = session.boxIntervals.box3Days || 0; break;
        case 4: interval = session.boxIntervals.box4Days || 0; break;
        case 5: interval = session.boxIntervals.box5Days || 0; break;
        default: interval = 0;
      }
    }
    
    if (boxLevel === 1) return 'New cards';
    else if (interval === 1) return 'Review every day';
    else return `Review every ${interval} days`;
  };

  if (!session || loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.main }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#000' : '#fff' }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.header, isLandscape && styles.headerLandscape, { backgroundColor: theme.main }]}>
          <BackButton 
            onPress={() => navigation.navigate('LearningSessions')}
            style={styles.backButtonIcon}
          />
          <View style={styles.headerContent}>
            <Text style={[styles.title, isLandscape && styles.titleLandscape, { color: isDarkMode ? '#000' : '#fff' }]}>
              {session.name}
            </Text>
            <Text style={[styles.subtitle, isLandscape && styles.subtitleLandscape, { color: isDarkMode ? theme.text.light : '#f0f0f0' }]}>
              Spaced Repetition Flashcards
            </Text>
          </View>
        </View>

        <View style={[styles.statsContainer, isLandscape && styles.statsContainerLandscape, { 
          backgroundColor: theme.white,
          shadowColor: isDarkMode ? '#fff' : '#000',
          shadowOpacity: isDarkMode ? 0.05 : 0.1
        }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isLandscape && styles.statValueLandscape, { color: theme.text.dark }]}>
              {sessionStats ? sessionStats.total : 0}
            </Text>
            <Text style={[styles.statLabel, isLandscape && styles.statLabelLandscape, { color: theme.text.light }]}>
              Total Cards
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, isLandscape && styles.statValueLandscape, { color: theme.text.dark }]}>
              {sessionStats ? sessionStats.due : 0}
            </Text>
            <Text style={[styles.statLabel, isLandscape && styles.statLabelLandscape, { color: theme.text.light }]}>
              Due for Review
            </Text>
          </View>
        </View>

        <View style={[styles.sectionHeader, isLandscape && styles.sectionHeaderLandscape]}>
          <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape, { color: theme.text.dark }]}>
            Your Boxes
          </Text>
          <TouchableOpacity 
            style={[styles.configButton, isLandscape && styles.configButtonLandscape, { backgroundColor: theme.main }]}
            onPress={() => navigation.navigate('ConfigureBoxIntervals', { sessionId })}
          >
            <Text style={[styles.configButtonText, { 
              color: isDarkMode ? '#000' : '#000',
              fontWeight: 'bold'
            }]}>Configure Intervals</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.boxesContainer}>
          {[1, 2, 3, 4, 5].map((boxLevel) => {
            const boxStats = getBoxStatData(boxLevel);
            return (
              <TouchableOpacity 
                key={`box-${boxLevel}`}
                style={[
                  styles.boxItem, 
                  { 
                    backgroundColor: getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').bg,
                    borderColor: getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').border,
                    borderWidth: 1,
                  },
                  isLandscape && styles.boxItemLandscape
                ]}
                onPress={() => navigation.navigate('BoxDetails', { boxLevel, sessionId })}
              >
                <View style={styles.boxHeader}>
                  <Text style={styles.boxIcon}>{getBoxTheme(boxLevel, isDarkMode ? 'dark' : 'light').icon}</Text>
                  <Text style={[
                    styles.boxTitle, 
                    isLandscape && styles.boxTitleLandscape,
                    { color: isDarkMode ? '#fff' : '#333' }
                  ]}>{`Box ${boxLevel}`}</Text>
                </View>
                <Text style={[
                  styles.boxCount, 
                  isLandscape && styles.boxCountLandscape,
                  { color: isDarkMode ? '#fff' : '#555' }
                ]}>
                  {sessionStats ? sessionStats.boxCounts[boxLevel - 1] : 0} cards
                </Text>
                <Text style={[
                  styles.boxDescription, 
                  isLandscape && styles.boxDescriptionLandscape,
                  { color: isDarkMode ? '#ddd' : '#666' }
                ]}>{getReviewText(boxLevel)}</Text>
                
                {boxStats.total > 0 && (
                  <View style={styles.boxStatsContainer}>
                    <View style={styles.boxStatItem}>
                      <Text style={[styles.boxStatValue, { color: theme.success }]}>{boxStats.correct}</Text>
                      <Text style={[styles.boxStatLabel, { color: isDarkMode ? '#ddd' : '#666' }]}>Correct</Text>
                    </View>
                    <View style={styles.boxStatItem}>
                      <Text style={[styles.boxStatValue, { color: theme.danger }]}>{boxStats.incorrect}</Text>
                      <Text style={[styles.boxStatLabel, { color: isDarkMode ? '#ddd' : '#666' }]}>Incorrect</Text>
                    </View>
                    <View style={styles.boxStatItem}>
                      <Text style={[styles.boxStatValue, { color: isDarkMode ? '#ddd' : '#666' }]}>{boxStats.notAnswered}</Text>
                      <Text style={[styles.boxStatLabel, { color: isDarkMode ? '#ddd' : '#666' }]}>Not Answered</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      <FloatingAddButton 
        onPress={() => navigation.navigate('AddCard', { sessionId })}
      />
      
      {sessionStats && sessionStats.due > 0 && (
        <TouchableOpacity 
          style={[styles.reviewFloatingButton, { backgroundColor: theme.danger }]}
          onPress={() => navigation.navigate('Review', { sessionId })}
        >
          <Text style={[styles.reviewFloatingButtonText, { color: '#fff' }]}>Start Review</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 5,
  },
  headerLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  backButtonIcon: {
    position: 'absolute',
    left: 10,
    top: 10,
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleLandscape: {
    fontSize: 24,
    textAlign: 'left',
    marginLeft: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  subtitleLandscape: {
    fontSize: 12,
    textAlign: 'left',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    elevation: 3,
    padding: 15,
    justifyContent: 'space-around',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  statsContainerLandscape: {
    marginTop: 15,
    padding: 10,
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
  },
  statValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  statValueLandscape: {
    fontSize: 22,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: '500',
  },
  statLabelLandscape: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 25,
    marginBottom: 15,
  },
  sectionHeaderLandscape: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionTitleLandscape: {
    fontSize: 18,
  },
  configButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  configButtonLandscape: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  configButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  boxesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  boxItem: {
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    width: '100%',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  boxItemLandscape: {
    padding: 12,
  },
  boxHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  boxIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  boxTitleLandscape: {
    fontSize: 16,
  },
  boxCount: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  boxCountLandscape: {
    fontSize: 14,
  },
  boxDescription: {
    fontSize: 13,
  },
  boxDescriptionLandscape: {
    fontSize: 12,
  },
  reviewFloatingButton: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  reviewFloatingButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boxStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 5,
  },
  boxStatItem: {
    alignItems: 'center',
  },
  boxStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boxStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
});

export default BoxesScreen; 