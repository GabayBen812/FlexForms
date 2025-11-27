import { memo, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import L from 'leaflet';

import type { MapRegion } from '../types/location';

import 'leaflet/dist/leaflet.css';

type Props = {
  region: MapRegion;
  loading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  overlayText?: string;
};

const computeZoomFromDelta = (delta: number) => {
  if (!Number.isFinite(delta) || delta <= 0) {
    return 13;
  }

  const zoomLevel = Math.round(8 - Math.log(delta) / Math.log(2));
  return Math.max(2, Math.min(18, zoomLevel));
};

const markerIcon = L.divIcon({
  className: '',
  html: `<div style="
      width: 18px;
      height: 18px;
      background: #38bdf8;
      border: 3px solid #0f172a;
      border-radius: 12px;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.6);
    "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
});

const EmployeeLocationMap = ({ region, loading = false, containerStyle, overlayText }: Props) => {
  const center: LatLngTuple = useMemo(() => [region.latitude, region.longitude], [region.latitude, region.longitude]);

  const zoom = useMemo(
    () => computeZoomFromDelta(Math.max(region.latitudeDelta, region.longitudeDelta)),
    [region.latitudeDelta, region.longitudeDelta]
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        scrollWheelZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center} icon={markerIcon} />
      </MapContainer>
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
    position: 'relative',
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
