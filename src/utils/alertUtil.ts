import { AlertButton } from 'react-native';
import { createRef } from 'react';

// Alert manager interface
interface AlertRef {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => void;
}

// Create a ref that components can call to show alerts
export const alertRef = createRef<AlertRef>();

// Function to show an alert via the ref
export const showAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[]
) => {
  if (alertRef.current) {
    alertRef.current.showAlert(title, message, buttons);
  } else {
    console.warn('Alert reference not set. Make sure AlertProvider is rendered.');
  }
}; 