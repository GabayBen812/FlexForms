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
import { fetchParentById, fetchKidById, Parent, Kid } from '../api/kids';

type ParentDetailsRouteProp = RouteProp<KidsStackParamList, 'ParentDetails'>;

const ParentDetailsPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<KidsStackParamList>>();
  const route = useRoute<ParentDetailsRouteProp>();
  const { parentId } = route.params;

  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [loadingKids, setLoadingKids] = useState(false);

  // Fetch parent details
  const {
    data: parent,
    isLoading: isLoadingParent,
    error: parentError,
  } = useQuery<Parent>({
    queryKey: ['parent', parentId],
    queryFn: () => fetchParentById(parentId),
    enabled: !!parentId,
  });

  // Fetch kids when parent data is available
  useEffect(() => {
    if (parent?.linked_kids && parent.linked_kids.length > 0) {
      setLoadingKids(true);
      Promise.all(
        parent.linked_kids.map((kidId) =>
          fetchKidById(kidId).catch((err) => {
            console.error(`Failed to fetch kid ${kidId}:`, err);
            return null;
          })
        )
      )
        .then((kidResults) => {
          setKids(kidResults.filter((k): k is Kid => k !== null));
        })
        .finally(() => {
          setLoadingKids(false);
        });
    }
  }, [parent?.linked_kids]);

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

  const handleKidPress = (kidId: string) => {
    navigation.navigate('KidDetails', { kidId });
  };

  if (isLoadingParent) {
    return (
      <LinearGradient colors={['#FFFFFF', '#F0FDFC', '#FFFFFF']} style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={styles.stateText}>טוען פרטי הורה...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (parentError || !parent) {
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
              <Text style={[styles.stateText, styles.errorText]}>שגיאה בטעינת פרטי ההורה</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const shouldShowFallback = !parent.profileImageUrl || imageLoadFailed;
  const dynamicFieldsEntries = parent.dynamicFields ? Object.entries(parent.dynamicFields) : [];

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
                source={{ uri: parent.profileImageUrl }}
                style={styles.profileImage}
                onError={() => setImageLoadFailed(true)}
              />
            )}
          </View>

          {/* Parent Name */}
          <Text style={styles.parentName}>{getFullName(parent.firstname, parent.lastname)}</Text>

          {/* Parent Type Badge */}
          <View style={styles.typeBadgeContainer}>
            <View style={styles.typeBadge}>
              <Feather name="user" size={16} color="#14B8A6" />
              <Text style={styles.typeBadgeText}>הורה</Text>
            </View>
          </View>

          {/* Basic Information Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color="#14B8A6" />
              <Text style={styles.sectionTitle}>מידע בסיסי</Text>
            </View>
            <View style={styles.card}>
              {parent.idNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>מספר זהות:</Text>
                  <Text style={styles.infoValue}>{parent.idNumber}</Text>
                </View>
              )}
              {!parent.idNumber && (
                <Text style={styles.emptyText}>אין מידע בסיסי נוסף</Text>
              )}
            </View>
          </View>

          {/* Linked Kids Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="users" size={20} color="#14B8A6" />
              <Text style={styles.sectionTitle}>ילדים מקושרים</Text>
            </View>
            {loadingKids ? (
              <View style={styles.card}>
                <ActivityIndicator size="small" color="#14B8A6" />
                <Text style={styles.emptyText}>טוען פרטי ילדים...</Text>
              </View>
            ) : kids.length > 0 ? (
              <View style={styles.kidsContainer}>
                {kids.map((kid) => (
                  <Pressable
                    key={kid._id}
                    onPress={() => handleKidPress(kid._id)}
                    style={({ pressed }) => [
                      styles.kidCard,
                      pressed && styles.kidCardPressed,
                    ]}
                  >
                    <View style={styles.kidIcon}>
                      <Feather name="user" size={20} color="#14B8A6" />
                    </View>
                    <View style={styles.kidInfo}>
                      <Text style={styles.kidName}>
                        {getFullName(kid.firstname, kid.lastname)}
                      </Text>
                      {kid.idNumber && (
                        <Text style={styles.kidDetail}>ת.ז: {kid.idNumber}</Text>
                      )}
                    </View>
                    <Feather name="chevron-left" size={20} color="#94A3B8" />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.emptyText}>אין ילדים מקושרים</Text>
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
  parentName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 12,
  },
  typeBadgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  typeBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0FDFC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#14B8A6',
  },
  typeBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14B8A6',
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
  kidsContainer: {
    gap: 12,
  },
  kidCard: {
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
  kidCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  kidIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kidInfo: {
    flex: 1,
    gap: 4,
  },
  kidName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'right',
  },
  kidDetail: {
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

export default ParentDetailsPage;

