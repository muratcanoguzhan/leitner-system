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
import { LeitnerSystem } from '../models/Card';
import { 
  loadSystems, 
  createLeitnerSystem, 
  deleteLeitnerSystem
} from '../utils/storage';

type RootStackParamList = {
  LeitnerSystems: undefined;
  Home: { systemId: string };
};

type LeitnerSystemsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LeitnerSystems'>;

interface LeitnerSystemsScreenProps {
  navigation: LeitnerSystemsScreenNavigationProp;
}

const LeitnerSystemsScreen: React.FC<LeitnerSystemsScreenProps> = ({ navigation }) => {
  const [systems, setSystems] = useState<LeitnerSystem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadSystemsData();
    });

    // Initial load
    loadSystemsData();

    return unsubscribe;
  }, [navigation]);

  const loadSystemsData = async () => {
    const loadedSystems = await loadSystems();
    setSystems(loadedSystems);
  };

  const handleCreateSystem = async () => {
    if (!newSystemName.trim()) {
      Alert.alert('Error', 'Please enter a name for your Leitner system');
      return;
    }

    setIsCreating(true);
    try {
      const newSystem = await createLeitnerSystem(newSystemName.trim());
      setSystems([...systems, newSystem]);
      setModalVisible(false);
      setNewSystemName('');
      
      // Navigate to the new system
      navigation.navigate('Home', { systemId: newSystem.id });
    } catch (error) {
      console.error('Failed to create Leitner system:', error);
      Alert.alert(
        'Error',
        'Failed to create Leitner system. Please check your internet connection and try again.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteSystem = async (system: LeitnerSystem) => {
    Alert.alert(
      'Delete Leitner System',
      `Are you sure you want to delete "${system.name}"? This will delete all cards in this system.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteLeitnerSystem(system.id);
              setSystems(systems.filter(s => s.id !== system.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete Leitner system');
            }
          }
        }
      ]
    );
  };
  
  const renderSystemItem = ({ item }: { item: LeitnerSystem }) => {
    return (
      <TouchableOpacity 
        style={styles.systemItem}
        onPress={() => navigation.navigate('Home', { systemId: item.id })}
      >
        <View style={styles.systemInfo}>
          <Text style={styles.systemName}>{item.name}</Text>
          <Text style={styles.systemDate}>
            Created: {item.createdAt.toLocaleDateString()}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteSystem(item)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Leitner Systems</Text>
      </View>

      {systems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            You don't have any Leitner systems yet.
          </Text>
          <Text style={styles.emptySubText}>
            Create your first one to get started!
          </Text>
        </View>
      ) : (
        <FlatList
          data={systems}
          renderItem={renderSystemItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.systemsContainer}
        />
      )}

      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>Create New Leitner System</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Leitner System</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Enter a name for your system"
              value={newSystemName}
              onChangeText={setNewSystemName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewSystemName('');
                }}
                disabled={isCreating}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateSystem}
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
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 20,
    backgroundColor: '#4ecdc4',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  systemsContainer: {
    padding: 20,
  },
  systemItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemInfo: {
    flex: 1,
  },
  systemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  systemDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    padding: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4ecdc4',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
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
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    color: '#333',
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
    backgroundColor: '#4ecdc4',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default LeitnerSystemsScreen; 