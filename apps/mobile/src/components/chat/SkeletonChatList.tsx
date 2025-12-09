import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type SkeletonItemProps = {
  index: number;
};

const SkeletonItem = ({ index }: SkeletonItemProps) => {
  return (
    <View style={styles.skeletonItem}>
      {/* Avatar skeleton */}
      <View style={styles.skeletonAvatar}>
        <LinearGradient
          colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.skeletonGradient}
        />
      </View>

      {/* Content skeleton */}
      <View style={styles.skeletonContent}>
        {/* Title */}
        <View style={[styles.skeletonLine, { width: index % 2 === 0 ? '60%' : '75%' }]}>
          <LinearGradient
            colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.skeletonGradient}
          />
        </View>

        {/* Subtitle */}
        <View style={[styles.skeletonLine, styles.skeletonSubtitle, { width: index % 3 === 0 ? '80%' : '90%' }]}>
          <LinearGradient
            colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.skeletonGradient}
          />
        </View>
      </View>

      {/* Time skeleton */}
      <View style={[styles.skeletonTime]}>
        <LinearGradient
          colors={['#E5E7EB', '#F3F4F6', '#E5E7EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.skeletonGradient}
        />
      </View>
    </View>
  );
};

export const SkeletonChatList = () => {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <SkeletonItem key={index} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 32,
    gap: 14,
  },
  skeletonItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  skeletonContent: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 8,
  },
  skeletonLine: {
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonSubtitle: {
    height: 14,
  },
  skeletonTime: {
    width: 50,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  skeletonGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});


