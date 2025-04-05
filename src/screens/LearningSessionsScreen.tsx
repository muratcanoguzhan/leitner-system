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
  Modal,
  ActivityIndicator
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LearningSession } from '../models/Card';
import { 
  loadSessions, 
  createLearningSession, 
  deleteLearningSession,
  DEFAULT_BOX_INTERVALS,
  updateLearningSession
} from '../utils/storage';
import { AppTheme } from '../utils/themes';
import FloatingAddButton from '../components/FloatingAddButton';
import { SessionStats, getSessionStats } from '../services/StatisticsService';

type RootStackParamList = {
  LearningSessions: undefined;
  Boxes: { sessionId: string };
};

type LearningSessionsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LearningSessions'>;

interface LearningSessionsScreenProps {
  navigation: LearningSessionsScreenNavigationProp;
}

interface SessionWithStats extends LearningSession {
  stats?: SessionStats;
}

const LearningSessionsScreen: React.FC<LearningSessionsScreenProps> = ({ navigation }) => {
  const [sessions, setSessions] = useState<SessionWithStats[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<SessionWithStats | null>(null);
  const [editedName, setEditedName] = useState('');
  const [loadingStats, setLoadingStats] = useState(false);

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
    setLoadingStats(true);
    
    // Load stats for each session
    const sessionsWithStats: SessionWithStats[] = [];
    
    for (const session of loadedSessions) {
      const stats = await getSessionStats(session.id);
      sessionsWithStats.push({
        ...session,
        stats
      });
    }
    
    setSessions(sessionsWithStats);
    setLoadingStats(false);
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
      const newSessionWithStats = {
        ...newSession,
        stats: {
          total: 0,
          correct: 0,
          incorrect: 0,
          due: 0,
          promoted: 0,
          demoted: 0,
          boxCounts: [0, 0, 0, 0, 0]
        }
      };
      setSessions([...sessions, newSessionWithStats]);
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

  const handleEditSession = (session: SessionWithStats) => {
    setEditingSession(session);
    setEditedName(session.name);
    setEditModalVisible(true);
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;
    
    if (!editedName.trim()) {
      Alert.alert('Error', 'Please enter a name for your learning session');
      return;
    }

    try {
      await updateLearningSession(editingSession.id, editedName.trim());
      
      // Update the session in state
      setSessions(sessions.map(s => 
        s.id === editingSession.id 
          ? { ...s, name: editedName.trim() } 
          : s
      ));
      
      setEditModalVisible(false);
      setEditingSession(null);
    } catch (error) {
      console.error('Failed to update learning session:', error);
      Alert.alert(
        'Error',
        'Failed to update learning session. Please check your internet connection and try again.'
      );
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
  
  const renderSessionItem = ({ item }: { item: SessionWithStats }) => {    
    return (
      <TouchableOpacity 
        style={styles.sessionCard}
        onPress={() => navigation.navigate('Boxes', { sessionId: item.id })}
      >
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle}>{item.name}</Text>
          <Text style={styles.sessionSubtitle}>
            Created: {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          
          {item.stats && (
            <>
              <Text style={styles.cardsTotalText}>
                Cards: {item.stats.total} total
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.correctText}>
                  {item.stats.correct} correct
                </Text>
                <Text style={styles.incorrectText}>
                  {item.stats.incorrect} incorrect
                </Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditSession(item)}
          >
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteSession(item)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>My Learning Sessions</Text>
        </View>
      </View>

      {loadingStats ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={AppTheme.main} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
        </View>
      ) : sessions.length === 0 ? (
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

      <FloatingAddButton onPress={() => setModalVisible(true)} />

      {/* Create Session Modal */}
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

      {/* Edit Session Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Learning Session</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter a new name for your session"
              value={editedName}
              onChangeText={setEditedName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingSession(null);
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleUpdateSession}
              >
                <Text style={styles.modalButtonText}>Update</Text>
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
    backgroundColor: AppTheme.yellow,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
    paddingTop: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: AppTheme.white,
    textAlign: 'center',
  },
  sessionsContainer: {
    padding: 20,
  },
  sessionCard: {
    backgroundColor: AppTheme.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 15,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 4,
    borderLeftColor: AppTheme.yellow,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionInfo: {
    flex: 1,
    paddingRight: 12,
  },
  actionsContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    gap: 8,
    minWidth: 80,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 0,
    alignItems: 'center',
    width: 80,
  },
  actionButtonText: {
    color: AppTheme.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  editButton: {
    backgroundColor: AppTheme.yellow,
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
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
    marginBottom: 3,
  },
  sessionSubtitle: {
    fontSize: 13,
    color: AppTheme.text.light,
    marginBottom: 12,
  },
  cardsTotalText: {
    fontSize: 14,
    fontWeight: '500',
    color: AppTheme.text.dark,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  correctText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
    marginRight: 16,
  },
  incorrectText: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: AppTheme.text.light,
  },
});

export default LearningSessionsScreen; 