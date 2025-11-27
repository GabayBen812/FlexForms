import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { APP_VERSION } from '../constants/version';

type VersionBadgeProps = {
  version?: string;
};

const TOP_OFFSET = 8;

const VersionBadge: React.FC<VersionBadgeProps> = ({ version = APP_VERSION }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { top: insets.top + TOP_OFFSET }]}
    >
      <Text style={styles.text}>{`v${version}`}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 1000,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: '#F8FAFC',
  },
});

export default VersionBadge;


