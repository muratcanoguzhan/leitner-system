import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LearningSession } from '../models/Card';
import { 
  loadSessions, 
  createLearningSession, 
  deleteLearningSession,
  DEFAULT_BOX_INTERVALS
} from '../utils/storage';
import { AppTheme } from '../utils/themes';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
};

type LearningSessionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LearningSessions'>;

interface LearningSessionsScreenProps {
  navigation: LearningSessionsScreenNavigationProp;
}

const LearningSessionsScreen: React.FC<LearningSessionsScreenProps> = ({ navigation }) => {
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSessionsData();
    });

    // Initial load
    loadSessionsData();

    return unsubscribe;
  }, [navigation]);

  const loadSessionsData = async () => {
    const loadedSessions = await loadSessions();
    setSessions(loadedSessions);
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      Alert.alert('Error', 'Please enter a name for your learning session');
      return;
    }

    setIsCreating(true);
    try {
      // Create a new session with default box intervals
      const newSession = await createLearningSession(newSessionName.trim(), DEFAULT_BOX_INTERVALS);
      setSessions([...sessions, newSession]);
      setModalVisible(false);
      setNewSessionName('');
      
      // Navigate to the new session
      navigation.navigate('Boxes', { sessionId: newSession.id });
    } catch (error) {
      console.error('Failed to create learning session:', error);
      Alert.alert(
        'Error',
        'Failed to create learning session. Please check your internet connection and try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSession = async (session: LearningSession) => {
    Alert.alert(
      'Delete Learning Session',
      `Are you sure you want to delete "${session.name}"? This will delete all cards in this session.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLearningSession(session.id);
              setSessions(sessions.filter(s => s.id !== session.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete learning session');
            }
          }
        }
      ]
    );
  };
  
  const renderSessionItem = ({ item }: { item: LearningSession }) => {    
    return (
      <TouchableOpacity 
        style={styles.sessionCard}
        onPress={() => navigation.navigate('Boxes', { sessionId: item.id })}
      >
        <View>
          <Text style={styles.sessionTitle}>{item.name}</Text>
          <Text style={styles.sessionSubtitle}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteSession(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Learning Sessions</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You don't have any learning sessions yet.
          </Text>
          <Text style={styles.emptySubText}>
            Create your first one to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.sessionsContainer}
        />
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Create New Learning Session</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Learning Session</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter a name for your session"
              value={newSessionName}
              onChangeText={setNewSessionName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewSessionName('');
                }}
                disabled={isCreating}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateSession}
                disabled={isCreating}
              >
                <Text style={styles.modalButtonText}>
                  {isCreating ? 'Creating...' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppTheme.white,
  },
  sessionsContainer: {
    padding: 20,
  },
  sessionCard: {
    backgroundColor: AppTheme.white,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 3,
    borderLeftColor: AppTheme.main,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sessionDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: AppTheme.danger,
    borderRadius: 8,
    padding: 8,
  },
  deleteButtonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: AppTheme.main,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  addButtonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: AppTheme.text.dark,
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: AppTheme.text.light,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: AppTheme.white,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: AppTheme.text.dark,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  createButton: {
    backgroundColor: AppTheme.main,
  },
  modalButtonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppTheme.text.dark,
  },
  sessionSubtitle: {
    fontSize: 14,
    color: AppTheme.text.light,
    marginTop: 5,
  },
});

export default LearningSessionsScreen; 