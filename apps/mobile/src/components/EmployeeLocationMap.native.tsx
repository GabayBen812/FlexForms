import { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';

import type { MapRegion } from '../types/location';

type Props = {
  region: MapRegion;
  loading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  overlayText?: string;
};

const EmployeeLocationMap = ({ region, loading = false, containerStyle, overlayText }: Props) => {
  const resolvedRegion: Region = region;

  return (
    <View style={[styles.container, containerStyle]}>
      <MapView style={styles.map} region={resolvedRegion} mapType="standard">
        <Marker coordinate={resolvedRegion} />
      </MapView>
      {loading ? (
        <View style={styles.overlay}>
          <ActivityIndicator color="#f8fafc" />
          {overlayText ? <Text style={styles.overlayText}>{overlayText}</Text> : null}
        </View>
      ) : null}
    </View>
  );
};

export default memo(EmployeeLocationMap);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 209, 0.18)',
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  overlayText: {
    color: '#f8fafc',
    fontSize: 14,
  },
});


