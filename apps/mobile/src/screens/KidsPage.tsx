import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { api } from '../api/client';
import type { KidsStackParamList } from '../navigation/AppNavigator';

type Kid = {
  id?: string | number | null;
  _id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
};

const KidsPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<KidsStackParamList>>();
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          <Text style={styles.headerBadge}>רשימת ילדים</Text>
          <Text style={styles.headerTitle}>כל הילדים הפעילים</Text>

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
          ) : (
            <FlatList
              data={kids}
              keyExtractor={(item, index) =>
                String(item.id ?? item._id ?? `${item.firstname ?? item.firstName ?? 'kid'}-${index}`)
              }
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <View style={styles.kidCard}>
                  <Text style={styles.kidName}>{getKidName(item)}</Text>
                </View>
              )}
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
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 20,
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
    gap: 16,
  },
  kidCard: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  kidName: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default KidsPage;


