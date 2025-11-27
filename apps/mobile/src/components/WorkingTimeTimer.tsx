import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

type WorkingTimeTimerProps = {
  milliseconds: number;
  isActive: boolean;
};

type FlipDigitProps = {
  value: string;
  isActive: boolean;
  shouldAnimate?: boolean;
};

function formatTime(ms: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0'),
  };
}

function FlipDigit({ value, isActive, shouldAnimate = false }: FlipDigitProps) {
  const rotation = useSharedValue(0);
  const prevValue = useRef(value);
  const [displayValue, setDisplayValue] = useState(value);

  // Sync initial value
  useEffect(() => {
    if (prevValue.current === value && displayValue !== value) {
      setDisplayValue(value);
    }
  }, [value, displayValue]);

  useEffect(() => {
    if (prevValue.current !== value) {
      if (isActive && shouldAnimate) {
        // Start flip animation only if shouldAnimate is true
        rotation.value = withTiming(0.5, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        }, () => {
          // Update value at midpoint (when card is at 90 degrees)
          setDisplayValue(value);
          // Complete flip to show new value
          rotation.value = withTiming(0, {
            duration: 300,
            easing: Easing.in(Easing.cubic),
          });
        });
      } else {
        // When paused or should not animate, just update without animation
        setDisplayValue(value);
        rotation.value = 0;
      }
      prevValue.current = value;
    }
  }, [value, isActive, shouldAnimate, rotation]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(rotation.value, [0, 0.5], [0, 90]);
    const opacity = interpolate(rotation.value, [0, 0.5], [1, 0]);

    return {
      transform: [{ perspective: 1000 }, { rotateX: `${rotateX}deg` }],
      opacity,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateX = interpolate(rotation.value, [0, 0.5], [90, 0]);
    const opacity = interpolate(rotation.value, [0, 0.5], [0, 1]);

    return {
      transform: [{ perspective: 1000 }, { rotateX: `${rotateX}deg` }],
      opacity,
    };
  });

  return (
    <View style={styles.flipContainer}>
      <View style={styles.flipCardWrapper}>
        <Animated.View style={[styles.flipCard, styles.flipCardFront, frontAnimatedStyle]}>
          <Text style={styles.timeValue}>{prevValue.current}</Text>
        </Animated.View>
        <Animated.View style={[styles.flipCard, styles.flipCardBack, backAnimatedStyle]}>
          <Text style={styles.timeValue}>{displayValue}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export default function WorkingTimeTimer({ milliseconds, isActive }: WorkingTimeTimerProps) {
  const { hours, minutes, seconds } = formatTime(milliseconds);

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>זמן עבודה היום</Text>
      </View>
      <View style={styles.timeContainer}>
        <FlipDigit value={hours} isActive={isActive} shouldAnimate={false} />
        <Text style={styles.timeSeparator}>:</Text>
        <FlipDigit value={minutes} isActive={isActive} shouldAnimate={false} />
        <Text style={styles.timeSeparator}>:</Text>
        <FlipDigit value={seconds} isActive={isActive} shouldAnimate={true} />
      </View>
      <View style={styles.unitContainer}>
        <Text style={styles.unit}>שעות</Text>
        <Text style={styles.unit}>דקות</Text>
        <Text style={styles.unit}>שניות</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 209, 0.25)',
    backgroundColor: 'rgba(12, 16, 34, 0.95)',
    shadowColor: '#01000f',
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 20 },
    elevation: 16,
    alignItems: 'center',
    gap: 16,
  },
  labelContainer: {
    alignItems: 'center',
  },
  label: {
    color: 'rgba(226, 232, 240, 0.85)',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  flipContainer: {
    position: 'relative',
    minWidth: 56,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  flipCardWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  flipCard: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipCardFront: {
    transform: [{ rotateX: '0deg' }],
  },
  flipCardBack: {
    transform: [{ rotateX: '180deg' }],
  },
  timeValue: {
    color: '#38bdf8',
    fontSize: 48,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    textAlign: 'center',
  },
  timeSeparator: {
    color: 'rgba(56, 189, 248, 0.5)',
    fontSize: 48,
    fontWeight: '700',
  },
  unitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 4,
  },
  unit: {
    color: 'rgba(226, 232, 240, 0.6)',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
  },
});

