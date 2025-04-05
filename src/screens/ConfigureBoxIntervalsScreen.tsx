import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  TextInput,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LearningSession, BoxIntervals } from '../models/Card';
import { getSession, DEFAULT_BOX_INTERVALS, saveSession } from '../utils/storage';
import { BOX_THEMES, DARK_BOX_THEMES, AppTheme } from '../utils/themes';
import BackButton from '../components/BackButton';
import { useTheme } from '../utils/ThemeContext';
import { showAlert } from '../utils/alertUtil';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
  ConfigureBoxIntervals: { sessionId: string };
};

type ConfigureBoxIntervalsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ConfigureBoxIntervals'>;
type ConfigureBoxIntervalsScreenRouteProp = RouteProp<RootStackParamList, 'ConfigureBoxIntervals'>;

interface ConfigureBoxIntervalsScreenProps {
  navigation: ConfigureBoxIntervalsScreenNavigationProp;
  route: ConfigureBoxIntervalsScreenRouteProp;
}

const ConfigureBoxIntervalsScreen: React.FC<ConfigureBoxIntervalsScreenProps> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState<LearningSession | null>(null);
  const [boxIntervals, setBoxIntervals] = useState<BoxIntervals>(DEFAULT_BOX_INTERVALS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { theme, isDarkMode } = useTheme();

  useEffect(() => {
    const loadSessionData = async () => {
      try {
        // Use getSession instead of loading all sessions
        const currentSession = await getSession(sessionId);
        if (currentSession) {
          setSession(currentSession);
          setBoxIntervals(currentSession.boxIntervals);
        }
      } catch (error) {
        console.error('Error loading session data:', error);
        showAlert('Error', 'Failed to load session data');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId]);

  const saveIntervals = async () => {
    // Validate all values are positive numbers
    const values = Object.values(boxIntervals);
    if (values.some(value => isNaN(value) || value <= 0)) {
      showAlert('Invalid Values', 'All review intervals must be positive numbers');
      return;
    }
    
    // Validate intervals are in ascending order
    if (boxIntervals.box1Days >= boxIntervals.box2Days || 
        boxIntervals.box2Days >= boxIntervals.box3Days ||
        boxIntervals.box3Days >= boxIntervals.box4Days ||
        boxIntervals.box4Days >= boxIntervals.box5Days) {
      showAlert('Invalid Intervals', 'Each box interval should be larger than the previous one');
      return;
    }

    setIsSaving(true);
    try {
      // We already have the session in state, no need to fetch it again
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Update with new box intervals
      const updatedSession = {
        ...session,
        boxIntervals
      };
      
      await saveSession(updatedSession);
      setIsSaving(false);
      
      showAlert(
        'Success', 
        'Box intervals updated successfully.',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Boxes', { sessionId })
        }]
      );
    } catch (error) {
      console.error('Error saving box intervals:', error);
      showAlert('Error', 'Failed to save box intervals');
      setIsSaving(false);
    }
  };

  const handleInputChange = (key: keyof BoxIntervals, value: string) => {
    const numValue = parseInt(value);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setBoxIntervals(prev => ({
        ...prev,
        [key]: numValue
      }));
    } else if (value === '') {
      setBoxIntervals(prev => ({
        ...prev,
        [key]: 0
      }));
    }
  };

  const resetToDefaults = () => {
    showAlert(
      'Reset to Defaults',
      'Are you sure you want to reset to default intervals?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            setBoxIntervals(DEFAULT_BOX_INTERVALS);
            
            // Save the default intervals
            setIsSaving(true);
            try {
              if (!session) {
                throw new Error('Session not found');
              }
              
              // Update session with default box intervals
              const updatedSession = {
                ...session,
                boxIntervals: DEFAULT_BOX_INTERVALS
              };
              
              await saveSession(updatedSession);
              
              showAlert(
                'Success', 
                'Box intervals reset to defaults successfully.',
                [{ 
                  text: 'OK', 
                  onPress: () => navigation.navigate('Boxes', { sessionId })
                }]
              );
            } catch (error) {
              console.error('Error resetting box intervals:', error);
              showAlert('Error', 'Failed to reset box intervals');
            } finally {
              setIsSaving(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.main }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#000' : '#fff' }]}>Configure Review Intervals</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text.dark }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.main }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#000' : '#fff' }]}>Configure Review Intervals</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text.dark }]}>Session not found</Text>
          <TouchableOpacity 
            style={[styles.floatingSaveButton, { backgroundColor: theme.main }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.floatingSaveButtonText, { color: isDarkMode ? '#000' : '#fff' }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Get the appropriate box themes based on current theme mode
  const boxThemes = isDarkMode ? DARK_BOX_THEMES : BOX_THEMES;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.main }]}>
        <BackButton 
          onPress={() => navigation.goBack()}
          style={styles.backButtonIcon}
        />
        <Text style={[styles.title, { color: isDarkMode ? '#000' : '#fff' }]}>Configure Review Intervals</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sessionName, { color: theme.text.dark }]}>{session.name}</Text>
        <Text style={[styles.description, { color: theme.text.light }]}>
          Customize the number of days between reviews for each box. 
          Higher box numbers should have longer intervals.
        </Text>

        <View style={[styles.intervalContainer, { 
          backgroundColor: theme.white,
          shadowColor: isDarkMode ? '#fff' : '#000',
          shadowOpacity: isDarkMode ? 0.05 : 0.1
        }]}>
          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: boxThemes[1].header,
            backgroundColor: boxThemes[1].bg + (isDarkMode ? '80' : '40')
          }]}>
            <Text style={[styles.boxLabel, { color: theme.text.dark }]}>
              <Text>{boxThemes[1].icon} </Text>
              Box 1:
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: boxThemes[1].border,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: theme.text.dark
              }]}
              keyboardType="numeric"
              value={boxIntervals.box1Days.toString()}
              onChangeText={(value) => handleInputChange('box1Days', value)}
              placeholder="Days"
              placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
            />
            <Text style={[styles.daysText, { color: theme.text.light }]}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: boxThemes[2].header,
            backgroundColor: boxThemes[2].bg + (isDarkMode ? '80' : '40')
          }]}>
            <Text style={[styles.boxLabel, { color: theme.text.dark }]}>
              <Text>{boxThemes[2].icon} </Text>
              Box 2:
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: boxThemes[2].border,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: theme.text.dark
              }]}
              keyboardType="numeric"
              value={boxIntervals.box2Days.toString()}
              onChangeText={(value) => handleInputChange('box2Days', value)}
              placeholder="Days"
              placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
            />
            <Text style={[styles.daysText, { color: theme.text.light }]}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: boxThemes[3].header,
            backgroundColor: boxThemes[3].bg + (isDarkMode ? '80' : '40')
          }]}>
            <Text style={[styles.boxLabel, { color: theme.text.dark }]}>
              <Text>{boxThemes[3].icon} </Text>
              Box 3:
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: boxThemes[3].border,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: theme.text.dark
              }]}
              keyboardType="numeric"
              value={boxIntervals.box3Days.toString()}
              onChangeText={(value) => handleInputChange('box3Days', value)}
              placeholder="Days"
              placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
            />
            <Text style={[styles.daysText, { color: theme.text.light }]}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: boxThemes[4].header,
            backgroundColor: boxThemes[4].bg + (isDarkMode ? '80' : '40')
          }]}>
            <Text style={[styles.boxLabel, { color: theme.text.dark }]}>
              <Text>{boxThemes[4].icon} </Text>
              Box 4:
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: boxThemes[4].border,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: theme.text.dark
              }]}
              keyboardType="numeric"
              value={boxIntervals.box4Days.toString()}
              onChangeText={(value) => handleInputChange('box4Days', value)}
              placeholder="Days"
              placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
            />
            <Text style={[styles.daysText, { color: theme.text.light }]}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: boxThemes[5].header,
            backgroundColor: boxThemes[5].bg + (isDarkMode ? '80' : '40')
          }]}>
            <Text style={[styles.boxLabel, { color: theme.text.dark }]}>
              <Text>{boxThemes[5].icon} </Text>
              Box 5:
            </Text>
            <TextInput
              style={[styles.input, { 
                borderColor: boxThemes[5].border,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)',
                color: theme.text.dark
              }]}
              keyboardType="numeric"
              value={boxIntervals.box5Days.toString()}
              onChangeText={(value) => handleInputChange('box5Days', value)}
              placeholder="Days"
              placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
            />
            <Text style={[styles.daysText, { color: theme.text.light }]}>days</Text>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity 
        style={[styles.resetButton, { 
          backgroundColor: isDarkMode ? '#333' : '#f0f0f0',
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          shadowColor: isDarkMode ? '#fff' : '#000',
          shadowOpacity: isDarkMode ? 0.1 : 0.25,
        }]}
        onPress={resetToDefaults}
      >
        <Text style={[styles.resetButtonText, { color: isDarkMode ? '#bbb' : AppTheme.text.light }]}>Reset</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.floatingSaveButton, { 
          backgroundColor: theme.main,
          borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          shadowColor: isDarkMode ? '#fff' : '#000',
          shadowOpacity: isDarkMode ? 0.1 : 0.25,
        }]}
        onPress={saveIntervals}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        <Text style={[styles.floatingSaveButtonText, { color: isDarkMode ? '#000' : AppTheme.text.dark }]}>
          {isSaving ? '...' : '✓'}
        </Text>
      </TouchableOpacity>
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
    alignItems: 'center',
  },
  backButtonIcon: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sessionName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  intervalContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  boxLabel: {
    width: 100,
    fontSize: 16,
    fontWeight: 'bold',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  daysText: {
    marginLeft: 10,
    fontSize: 16,
  },
  resetButton: {
    position: 'absolute',
    bottom: 25,
    right: 90,
    backgroundColor: '#f0f0f0',
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
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  resetButtonText: {
    color: AppTheme.text.light,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  floatingSaveButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: AppTheme.main,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingSaveButtonText: {
    color: AppTheme.text.dark,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 46,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
});

export default ConfigureBoxIntervalsScreen; 