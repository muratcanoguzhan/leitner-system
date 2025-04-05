import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LearningSession, BoxIntervals } from '../models/Card';
import { getSession, DEFAULT_BOX_INTERVALS, saveSession } from '../utils/storage';
import { AppTheme, BOX_THEMES } from '../utils/themes';

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
        Alert.alert('Error', 'Failed to load session data');
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
      Alert.alert('Invalid Values', 'All review intervals must be positive numbers');
      return;
    }
    
    // Validate intervals are in ascending order
    if (boxIntervals.box1Days >= boxIntervals.box2Days || 
        boxIntervals.box2Days >= boxIntervals.box3Days ||
        boxIntervals.box3Days >= boxIntervals.box4Days ||
        boxIntervals.box4Days >= boxIntervals.box5Days) {
      Alert.alert('Invalid Intervals', 'Each box interval should be larger than the previous one');
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
      
      Alert.alert(
        'Success', 
        'Box intervals updated successfully.',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Boxes', { sessionId })
        }]
      );
    } catch (error) {
      console.error('Error saving box intervals:', error);
      Alert.alert('Error', 'Failed to save box intervals');
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
    setBoxIntervals(DEFAULT_BOX_INTERVALS);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session not found</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Configure Review Intervals</Text>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sessionName}>{session.name}</Text>
        <Text style={styles.description}>
          Customize the number of days between reviews for each box. 
          Higher box numbers should have longer intervals.
        </Text>

        <View style={styles.intervalContainer}>
          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: BOX_THEMES[1].header,
            backgroundColor: BOX_THEMES[1].bg + '40'
          }]}>
            <Text style={styles.boxLabel}>
              <Text>{BOX_THEMES[1].icon} </Text>
              Box 1:
            </Text>
            <TextInput
              style={[styles.input, { borderColor: BOX_THEMES[1].border }]}
              keyboardType="numeric"
              value={boxIntervals.box1Days.toString()}
              onChangeText={(value) => handleInputChange('box1Days', value)}
              placeholder="Days"
            />
            <Text style={styles.daysText}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: BOX_THEMES[2].header,
            backgroundColor: BOX_THEMES[2].bg + '40'
          }]}>
            <Text style={styles.boxLabel}>
              <Text>{BOX_THEMES[2].icon} </Text>
              Box 2:
            </Text>
            <TextInput
              style={[styles.input, { borderColor: BOX_THEMES[2].border }]}
              keyboardType="numeric"
              value={boxIntervals.box2Days.toString()}
              onChangeText={(value) => handleInputChange('box2Days', value)}
              placeholder="Days"
            />
            <Text style={styles.daysText}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: BOX_THEMES[3].header,
            backgroundColor: BOX_THEMES[3].bg + '40'
          }]}>
            <Text style={styles.boxLabel}>
              <Text>{BOX_THEMES[3].icon} </Text>
              Box 3:
            </Text>
            <TextInput
              style={[styles.input, { borderColor: BOX_THEMES[3].border }]}
              keyboardType="numeric"
              value={boxIntervals.box3Days.toString()}
              onChangeText={(value) => handleInputChange('box3Days', value)}
              placeholder="Days"
            />
            <Text style={styles.daysText}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: BOX_THEMES[4].header,
            backgroundColor: BOX_THEMES[4].bg + '40'
          }]}>
            <Text style={styles.boxLabel}>
              <Text>{BOX_THEMES[4].icon} </Text>
              Box 4:
            </Text>
            <TextInput
              style={[styles.input, { borderColor: BOX_THEMES[4].border }]}
              keyboardType="numeric"
              value={boxIntervals.box4Days.toString()}
              onChangeText={(value) => handleInputChange('box4Days', value)}
              placeholder="Days"
            />
            <Text style={styles.daysText}>days</Text>
          </View>

          <View style={[styles.intervalRow, { 
            borderLeftWidth: 4, 
            borderLeftColor: BOX_THEMES[5].header,
            backgroundColor: BOX_THEMES[5].bg + '40'
          }]}>
            <Text style={styles.boxLabel}>
              <Text>{BOX_THEMES[5].icon} </Text>
              Box 5:
            </Text>
            <TextInput
              style={[styles.input, { borderColor: BOX_THEMES[5].border }]}
              keyboardType="numeric"
              value={boxIntervals.box5Days.toString()}
              onChangeText={(value) => handleInputChange('box5Days', value)}
              placeholder="Days"
            />
            <Text style={styles.daysText}>days</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetToDefaults}
        >
          <Text style={styles.resetButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={saveIntervals}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTheme.background,
  },
  header: {
    padding: 20,
    backgroundColor: AppTheme.main,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    color: AppTheme.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppTheme.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sessionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: AppTheme.text.light,
    marginBottom: 20,
    lineHeight: 22,
  },
  intervalContainer: {
    backgroundColor: AppTheme.white,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
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
    color: AppTheme.text.dark,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    width: 80,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  daysText: {
    marginLeft: 10,
    fontSize: 16,
    color: AppTheme.text.light,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: AppTheme.white,
  },
  saveButton: {
    backgroundColor: AppTheme.main,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 20,
    marginHorizontal: 30,
  },
  saveButtonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  resetButtonText: {
    color: AppTheme.text.light,
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
    color: AppTheme.text.light,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: AppTheme.danger,
    marginBottom: 20,
  },
  button: {
    backgroundColor: AppTheme.main,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ConfigureBoxIntervalsScreen; 