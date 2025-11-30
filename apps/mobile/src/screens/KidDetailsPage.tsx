import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import type { KidsStackParamList } from '../navigation/AppNavigator';
import { fetchKidById, fetchParentById, Kid, Parent } from '../api/kids';

type KidDetailsRouteProp = RouteProp<KidsStackParamList, 'KidDetails'>;

const KidDetailsPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<KidsStackParamList>>();
  const route = useRoute<KidDetailsRouteProp>();
  const { kidId } = route.params;

  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // Fetch kid details
  const {
    data: kid,
    isLoading: isLoadingKid,
    error: kidError,
  } = useQuery<Kid>({
    queryKey: ['kid', kidId],
    queryFn: () => fetchKidById(kidId),
    enabled: !!kidId,
  });

  // Fetch parents when kid data is available
  useEffect(() => {
    if (kid?.linked_parents && kid.linked_parents.length > 0) {
      setLoadingParents(true);
      Promise.all(
        kid.linked_parents.map((parentId) =>
          fetchParentById(parentId).catch((err) => {
            console.error(`Failed to fetch parent ${parentId}:`, err);
            return null;
          })
        )
      )
        .then((parentResults) => {
          setParents(parentResults.filter((p): p is Parent => p !== null));
        })
        .finally(() => {
          setLoadingParents(false);
        });
    }
  }, [kid?.linked_parents]);

  const getFullName = (firstName?: string, lastName?: string) => {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    return name || 'ללא שם';
  };

  const formatDynamicFieldValue = (value: any): string => {
    if (value === null || value === undefined) return 'לא צוין';
    if (typeof value === 'boolean') return value ? 'כן' : 'לא';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (isLoadingKid) {
    return (
      <LinearGradient colors={['#FFFFFF', '#F0FDFC', '#FFFFFF']} style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={styles.stateText}>טוען פרטי ילד...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (kidError || !kid) {
    return (
      <LinearGradient colors={['#FFFFFF', '#F0FDFC', '#FFFFFF']} style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Text style={styles.backButtonLabel}>חזרה</Text>
            </Pressable>
            <View style={styles.centerContainer}>
              <Feather name="alert-circle" size={48} color="#E85A3F" />
              <Text style={[styles.stateText, styles.errorText]}>שגיאה בטעינת פרטי הילד</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const shouldShowFallback = !kid.profileImageUrl || imageLoadFailed;
  const dynamicFieldsEntries = kid.dynamicFields ? Object.entries(kid.dynamicFields) : [];

  return (
    <LinearGradient colors={['#FFFFFF', '#F0FDFC', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Feather name="arrow-right" size={20} color="#334155" />
            <Text style={styles.backButtonLabel}>חזרה</Text>
          </Pressable>

          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
            {shouldShowFallback ? (
              <View style={styles.profileImageFallback}>
                <Feather name="user" size={64} color="#94A3B8" />
              </View>
            ) : (
              <Image
                source={{ uri: kid.profileImageUrl }}
                style={styles.profileImage}
                onError={() => setImageLoadFailed(true)}
              />
            )}
          </View>

          {/* Kid Name */}
          <Text style={styles.kidName}>{getFullName(kid.firstname, kid.lastname)}</Text>

          {/* Basic Information Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color="#14B8A6" />
              <Text style={styles.sectionTitle}>מידע בסיסי</Text>
            </View>
            <View style={styles.card}>
              {kid.idNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>מספר זהות:</Text>
                  <Text style={styles.infoValue}>{kid.idNumber}</Text>
                </View>
              )}
              {kid.address && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>כתובת:</Text>
                  <Text style={styles.infoValue}>{kid.address}</Text>
                </View>
              )}
              {!kid.idNumber && !kid.address && (
                <Text style={styles.emptyText}>אין מידע בסיסי נוסף</Text>
              )}
            </View>
          </View>

          {/* Linked Parents Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="users" size={20} color="#14B8A6" />
              <Text style={styles.sectionTitle}>הורים מקושרים</Text>
            </View>
            {loadingParents ? (
              <View style={styles.card}>
                <ActivityIndicator size="small" color="#14B8A6" />
                <Text style={styles.emptyText}>טוען פרטי הורים...</Text>
              </View>
            ) : parents.length > 0 ? (
              <View style={styles.parentsContainer}>
                {parents.map((parent) => (
                  <View key={parent._id} style={styles.parentCard}>
                    <View style={styles.parentIcon}>
                      <Feather name="user" size={20} color="#14B8A6" />
                    </View>
                    <View style={styles.parentInfo}>
                      <Text style={styles.parentName}>
                        {getFullName(parent.firstname, parent.lastname)}
                      </Text>
                      {parent.idNumber && (
                        <Text style={styles.parentDetail}>ת.ז: {parent.idNumber}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>אין הורים מקושרים</Text>
              </View>
            )}
          </View>

          {/* Dynamic Fields Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={20} color="#14B8A6" />
              <Text style={styles.sectionTitle}>שדות מותאמים אישית</Text>
            </View>
            <View style={styles.card}>
              {dynamicFieldsEntries.length > 0 ? (
                dynamicFieldsEntries.map(([key, value]) => (
                  <View key={key} style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{key}:</Text>
                    <Text style={styles.infoValue}>{formatDynamicFieldValue(value)}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>אין שדות מותאמים אישית</Text>
              )}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  backButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    marginBottom: 24,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  backButtonLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  profileImageFallback: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  kidName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 18,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 14,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
    textAlign: 'right',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
    flex: 2,
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  parentsContainer: {
    gap: 12,
  },
  parentCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  parentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentInfo: {
    flex: 1,
    gap: 4,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  parentDetail: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'right',
  },
  stateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  errorText: {
    color: '#E85A3F',
  },
  bottomSpacer: {
    height: 24,
  },
});

export default KidDetailsPage;

