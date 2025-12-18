import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type VideoMessageProps = {
  uri: string;
  width?: number;
  height?: number;
  isOwn: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
  caption?: string;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_VIDEO_WIDTH = SCREEN_WIDTH * 0.65;
const MAX_VIDEO_HEIGHT = 300;

/**
 * VideoMessage component - placeholder for video messages
 * Full video playback will be implemented in a future iteration
 */
export const VideoMessage = ({
  uri,
  width: originalWidth,
  height: originalHeight,
  isOwn,
  uploadProgress,
  isUploading = false,
  caption,
}: VideoMessageProps) => {
  // Calculate scaled dimensions
  let displayWidth = MAX_VIDEO_WIDTH;
  let displayHeight = MAX_VIDEO_HEIGHT;

  if (originalWidth && originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    
    if (aspectRatio > 1) {
      displayWidth = Math.min(MAX_VIDEO_WIDTH, originalWidth);
      displayHeight = displayWidth / aspectRatio;
    } else {
      displayHeight = Math.min(MAX_VIDEO_HEIGHT, originalHeight);
      displayWidth = displayHeight * aspectRatio;
    }
  }

  const handlePress = () => {
    if (!isUploading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // TODO: Implement video player or open system video player
    }
  };

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <View
        style={[
          styles.videoPlaceholder,
          {
            width: displayWidth,
            height: displayHeight,
          },
        ]}
      >
        <View style={styles.playIconContainer}>
          <Feather name="play-circle" size={56} color="#FFFFFF" />
        </View>

        {isUploading && (
          <View style={styles.uploadingOverlay}>
            <Text style={styles.uploadProgressText}>
              {uploadProgress ? `${Math.round(uploadProgress)}%` : 'מעלה...'}
            </Text>
          </View>
        )}

        <View style={styles.videoIndicator}>
          <Feather name="video" size={16} color="#FFFFFF" />
        </View>
      </View>

      {caption && (
        <Text style={[styles.caption, isOwn && styles.captionOwn]}>
          {caption}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  videoPlaceholder: {
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  playIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadProgressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
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
});





