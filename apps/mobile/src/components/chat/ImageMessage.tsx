import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type ImageMessageProps = {
  uri: string;
  width?: number;
  height?: number;
  isOwn: boolean;
  uploadProgress?: number; // 0-100
  isUploading?: boolean;
  caption?: string;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_IMAGE_WIDTH = SCREEN_WIDTH * 0.65;
const MAX_IMAGE_HEIGHT = 300;

export const ImageMessage = ({
  uri,
  width: originalWidth,
  height: originalHeight,
  isOwn,
  uploadProgress,
  isUploading = false,
  caption,
}: ImageMessageProps) => {
  const [isLightboxVisible, setIsLightboxVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Calculate scaled dimensions
  let displayWidth = MAX_IMAGE_WIDTH;
  let displayHeight = MAX_IMAGE_HEIGHT;

  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    if (aspectRatio > 1) {
      // Landscape
      displayWidth = Math.min(MAX_IMAGE_WIDTH, originalWidth);
      displayHeight = displayWidth / aspectRatio;
    } else {
      // Portrait or square
      displayHeight = Math.min(MAX_IMAGE_HEIGHT, originalHeight);
      displayWidth = displayHeight * aspectRatio;
    }
  }

  const handlePress = () => {
    if (!isUploading && !imageError) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsLightboxVisible(true);
    }
  };

  const handleCloseLightbox = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLightboxVisible(false);
  };

  if (imageError) {
    return (
      <View
        style={[
          styles.errorContainer,
          { width: displayWidth, height: displayHeight },
        ]}
      >
        <Feather name="image" size={48} color="#94A3B8" />
        <Text style={styles.errorText}>שגיאה בטעינת תמונה</Text>
      </View>
    );
  }

  return (
    <>
      <Pressable onPress={handlePress} style={styles.container}>
        <View
          style={[
            styles.imageWrapper,
            {
              width: displayWidth,
              height: displayHeight,
            },
          ]}
        >
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />

          {!imageLoaded && !isUploading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <View style={styles.uploadProgressContainer}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.uploadProgressText}>
                  {uploadProgress ? `${Math.round(uploadProgress)}%` : 'מעלה...'}
                </Text>
              </View>
              {typeof uploadProgress === 'number' && (
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
              )}
            </View>
          )}

          {!isUploading && imageLoaded && (
            <View style={styles.zoomIndicator}>
              <Feather name="maximize-2" size={16} color="#FFFFFF" />
            </View>
          )}
        </View>

        {caption && (
          <Text style={[styles.caption, isOwn && styles.captionOwn]}>
            {caption}
          </Text>
        )}
      </Pressable>

      {/* Lightbox Modal */}
      <Modal
        visible={isLightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseLightbox}
      >
        <Pressable style={styles.lightboxOverlay} onPress={handleCloseLightbox}>
          <View style={styles.lightboxContainer}>
            <Pressable
              style={styles.lightboxCloseButton}
              onPress={handleCloseLightbox}
            >
              <Feather name="x" size={28} color="#FFFFFF" />
            </Pressable>

            <Image
              source={{ uri }}
              style={styles.lightboxImage}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  imageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  uploadProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadProgressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    width: '70%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  zoomIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    padding: 6,
  },
  caption: {
    marginTop: 6,
    color: '#0f172a',
    fontSize: 14,
    textAlign: 'right',
  },
  captionOwn: {
    color: '#0f172a',
  },
  errorContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  lightboxOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
});

