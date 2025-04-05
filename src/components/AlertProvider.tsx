import React, { useState, useImperativeHandle } from 'react';
import { AlertButton } from 'react-native';
import { alertRef } from '../utils/alertUtil';
import CustomAlert from './CustomAlert';

// Define our internal alert button type that's compatible with both CustomAlert and React Native
interface AlertButtonProps {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertProviderProps {
  children: React.ReactNode;
}

const AlertProvider: React.FC<AlertProviderProps> = ({ children }) => {
  const [alertVisible, setAlertVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [buttons, setButtons] = useState<AlertButtonProps[]>([{ text: 'OK' }]);

  // Set up the imperative handle to allow external components to trigger alerts
  useImperativeHandle(alertRef, () => ({
    showAlert: (
      alertTitle: string,
      alertMessage?: string,
      alertButtons?: AlertButton[]
    ) => {
      setTitle(alertTitle);
      setMessage(alertMessage);
      
      // Convert React Native AlertButtons to our internal type
      const convertedButtons: AlertButtonProps[] = alertButtons?.map(button => ({
        text: button.text || 'OK', // Provide default if text is undefined
        onPress: button.onPress,
        style: button.style
      })) || [{ text: 'OK' }];
      
      setButtons(convertedButtons);
      setAlertVisible(true);
    }
  }));

  const handleClose = () => {
    setAlertVisible(false);
  };

  return (
    <>
      {children}
      <CustomAlert
        visible={alertVisible}
        title={title}
        message={message}
        buttons={buttons}
        onClose={handleClose}
      />
    </>
  );
};

export default AlertProvider; 