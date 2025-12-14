import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import {
  takePictureAsync,
  pickImageAsync,
  type MediaAsset,
} from '../../utils/mediaUtils';

type MediaPickerProps = {
  visible: boolean;
  onClose: () => void;
  onMediaSelected: (assets: MediaAsset[]) => void;
};

export const MediaPicker = ({
  visible,
  onClose,
  onMediaSelected,
}: MediaPickerProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);
    
    try {
      const asset = await takePictureAsync();
      if (asset) {
        onMediaSelected([asset]);
        onClose();
      }
    } catch (error) {
      // Handle error
      console.error('Camera error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGallery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsProcessing(true);
    
    try {
      const assets = await pickImageAsync(true);
      if (assets.length > 0) {
        onMediaSelected(assets);
        onClose();
      }
    } catch (error) {
      // Handle error
      console.error('Gallery error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={styles.container}>
          <Pressable
            style={styles.content}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.title}>בחר מדיה</Text>
            </View>

            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#457B9D" />
                <Text style={styles.processingText}>מעבד...</Text>
              </View>
            ) : (
              <View style={styles.options}>
                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={handleCamera}
                >
                  <View style={[styles.iconContainer, styles.iconCamera]}>
                    <Feather name="camera" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionLabel}>צלם תמונה</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.option,
                    pressed && styles.optionPressed,
                  ]}
                  onPress={handleGallery}
                >
                  <View style={[styles.iconContainer, styles.iconGallery]}>
                    <Feather name="image" size={28} color="#FFFFFF" />
                  </View>
                  <Text style={styles.optionLabel}>בחר מהגלריה</Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.cancelButtonPressed,
              ]}
              onPress={handleClose}
              disabled={isProcessing}
            >
              <Text style={styles.cancelButtonText}>ביטול</Text>
            </Pressable>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    paddingBottom: 20,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  processingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  processingText: {
    fontSize: 16,
    color: '#64748B',
  },
  options: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  optionPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCamera: {
    backgroundColor: '#457B9D',
  },
  iconGallery: {
    backgroundColor: '#10B981',
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
  },
  cancelButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
});




