import { Alert, Platform } from 'react-native';
import { strings } from '@/constants/strings';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/** Simple "Are you sure?" popup used before every delete / remove / logout. */
export function confirm({ title, message, confirmText, destructive, onConfirm }: ConfirmOptions) {
  // React Native's Alert does nothing in a web browser, so use the browser's own box there.
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: strings.common.cancel, style: 'cancel' },
    { text: confirmText, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
