import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { api } from '../api/client';
import type { KidsStackParamList } from '../navigation/AppNavigator';

type Kid = {
  id?: string | number | null;
  _id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  profileImageUrl?: string;
};

const KidsPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<KidsStackParamList>>();
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchKids = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<Kid[]>('/kids');
        if (isMounted) {
          setKids(response.data ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError('שגיאה בטעינת רשימת הילדים');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchKids();

    return () => {
      isMounted = false;
    };
  }, []);

  const getKidName = (kid: Kid) => {
    const first = (kid.firstName ?? kid.firstname)?.toString().trim();
    const last = (kid.lastName ?? kid.lastname)?.toString().trim();
    const fullName = [first, last].filter(Boolean).join(' ');

    return fullName || 'ללא שם';
  };

  const handleImageError = (imageUrl: string) => {
    setFailedImages((prev) => new Set(prev).add(imageUrl));
  };

  const filteredKids = useMemo(() => {
    if (!searchQuery.trim()) {
      return kids;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    return kids.filter((kid) => {
      const firstName = (kid.firstName ?? kid.firstname)?.toString().toLowerCase() || '';
      const lastName = (kid.lastName ?? kid.lastname)?.toString().toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`.trim();
      
      return fullName.includes(lowerQuery) || firstName.includes(lowerQuery) || lastName.includes(lowerQuery);
    });
  }, [kids, searchQuery]);

  return (
    <LinearGradient colors={['#FFFFFF', '#F0FDFC', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Text style={styles.backButtonLabel}>חזרה לדף הבית</Text>
          </Pressable>

          <View style={styles.headerRow}>
            <Pressable
              onPress={() => {
                setIsSearchVisible(!isSearchVisible);
                if (isSearchVisible) {
                  setSearchQuery('');
                }
              }}
              style={({ pressed }) => [styles.searchIconButton, pressed && styles.searchIconPressed]}
            >
              <Feather name={isSearchVisible ? "x" : "search"} size={20} color="#14B8A6" />
            </Pressable>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerBadge}>רשימת ילדים</Text>
              <Text style={styles.headerTitle}>כל הילדים הפעילים</Text>
            </View>
          </View>

          {isSearchVisible && (
            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color="#94A3B8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="חיפוש ילד..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
                textAlign="right"
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Feather name="x" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>
          )}

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#14B8A6" />
              <Text style={styles.stateText}>טוען את הילדים...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Text style={[styles.stateText, styles.errorText]}>{error}</Text>
            </View>
          ) : kids.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>לא נמצאו ילדים</Text>
            </View>
          ) : filteredKids.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>לא נמצאו תוצאות</Text>
            </View>
          ) : (
            <FlatList
              data={filteredKids}
              numColumns={3}
              keyExtractor={(item, index) =>
                String(item.id ?? item._id ?? `${item.firstname ?? item.firstName ?? 'kid'}-${index}`)
              }
              contentContainerStyle={styles.listContent}
              columnWrapperStyle={styles.columnWrapper}
              renderItem={({ item }) => {
                const shouldShowFallback = !item.profileImageUrl || failedImages.has(item.profileImageUrl);
                const kidId = String(item._id ?? item.id ?? '');
                
                return (
                  <Pressable
                    onPress={() => {
                      if (kidId) {
                        navigation.navigate('KidDetails', { kidId });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.kidCard,
                      pressed && styles.kidCardPressed,
                    ]}
                  >
                    {shouldShowFallback ? (
                      <View style={styles.kidImageFallback}>
                        <Feather name="user" size={36} color="#94A3B8" />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: item.profileImageUrl }}
                        style={styles.kidImage}
                        onError={() => item.profileImageUrl && handleImageError(item.profileImageUrl)}
                      />
                    )}
                    <Text style={styles.kidName} numberOfLines={2} ellipsizeMode="tail">
                      {getKidName(item)}
                    </Text>
                  </Pressable>
                );
              }}
            />
          )}
        </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  backButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  backButtonLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
    gap: 4,
  },
  headerBadge: {
    alignSelf: 'flex-end',
    color: '#14B8A6',
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'right',
  },
  searchIconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  searchContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  searchIcon: {
    marginLeft: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'right',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stateText: {
    color: '#64748B',
    fontSize: 16,
  },
  errorText: {
    color: '#E85A3F',
  },
  listContent: {
    paddingBottom: 24,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  kidCard: {
    width: '31%',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kidCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  kidImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F3F4F6',
  },
  kidImageFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kidName: {
    width: '100%',
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default KidsPage;


