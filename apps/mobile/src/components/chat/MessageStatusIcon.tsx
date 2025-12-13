import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

type MessageStatusIconProps = {
  status: MessageStatus;
  size?: number;
};

/**
 * WhatsApp-style message status indicators
 * - Sending: Clock icon
 * - Sent: Single checkmark (grey)
 * - Delivered: Double checkmark (grey)
 * - Read: Double checkmark (blue)
 * - Failed: Alert icon (red)
 */
export const MessageStatusIcon = ({ status, size = 16 }: MessageStatusIconProps) => {
  if (status === 'sending') {
    return <Feather name="clock" size={size} color="#94A3B8" />;
  }

  if (status === 'failed') {
    return <Feather name="alert-circle" size={size} color="#EF4444" />;
  }

  if (status === 'sent') {
    return <Feather name="check" size={size} color="#94A3B8" />;
  }

  if (status === 'delivered') {
    return (
      <View style={styles.doubleCheck}>
        <Feather name="check" size={size} color="#94A3B8" style={styles.check1} />
        <Feather name="check" size={size} color="#94A3B8" style={styles.check2} />
      </View>
    );
  }

  if (status === 'read') {
    return (
      <View style={styles.doubleCheck}>
        <Feather name="check" size={size} color="#457B9D" style={styles.check1} />
        <Feather name="check" size={size} color="#457B9D" style={styles.check2} />
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  doubleCheck: {
    flexDirection: 'row',
    position: 'relative',
    width: 18,
    height: 16,
  },
  check1: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  check2: {
    position: 'absolute',
    left: 6,
    top: 0,
  },
});



