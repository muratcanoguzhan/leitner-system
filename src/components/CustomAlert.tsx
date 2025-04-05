import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../utils/ThemeContext';

// Type definitions
interface AlertButtonProps {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

type CustomAlertProps = {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButtonProps[];
  onClose: () => void;
};

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onClose,
}) => {
  const { theme, isDarkMode } = useTheme();
  const [modalVisible, setModalVisible] = useState(visible);

  useEffect(() => {
    setModalVisible(visible);
  }, [visible]);

  const handleButtonPress = (button: AlertButtonProps) => {
    setModalVisible(false);
    onClose();
    
    if (button.onPress) {
      button.onPress();
    }
  };

  // Get button style based on button type and theme
  const getButtonTextStyle = (buttonStyle?: string) => {
    if (buttonStyle === 'destructive') {
      return { color: theme.danger };
    } else if (buttonStyle === 'cancel') {
      return { 
        fontWeight: 'bold' as const,
        color: isDarkMode ? theme.text.medium : theme.text.dark 
      };
    }
    return { 
      color: theme.main, 
      fontWeight: 'bold' as const
    };
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        setModalVisible(false);
        onClose();
      }}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.centeredView}>
          <TouchableWithoutFeedback>
            <View style={[
              styles.modalView, 
              { 
                backgroundColor: isDarkMode ? theme.white : '#FFFFFF',
                shadowColor: isDarkMode ? '#FFFFFF' : '#000000',
                shadowOpacity: isDarkMode ? 0.1 : 0.25,
              }
            ]}>
              <Text style={[
                styles.modalTitle, 
                { color: theme.text.dark }
              ]}>
                {title}
              </Text>
              
              {message && (
                <Text style={[
                  styles.modalText, 
                  { color: theme.text.medium }
                ]}>
                  {message}
                </Text>
              )}
              
              <View style={[
                styles.buttonContainer, 
                { 
                  borderTopColor: isDarkMode ? '#444444' : '#E0E0E0' 
                }
              ]}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      index > 0 ? { 
                        borderLeftColor: isDarkMode ? '#444444' : '#E0E0E0',
                        borderLeftWidth: 1 
                      } : null
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text style={[
                      styles.buttonText,
                      getButtonTextStyle(button.style)
                    ]}>
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: width * 0.8,
    maxWidth: 320,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CustomAlert; 