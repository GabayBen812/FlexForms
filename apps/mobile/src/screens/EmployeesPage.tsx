import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';

import { api } from '../api/client';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Employee = {
  id: string;
  name?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  email?: string | null;
};

const EmployeesPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<Employee[]>('/employees');
        if (isMounted) {
          setEmployees(response.data ?? []);
        }
      } catch (err) {
        if (isMounted) {
          setError('שגיאה בטעינת רשימת העובדים');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const getEmployeeName = (employee: Employee) => {
    const primaryFirst = (employee.firstName ?? employee.firstname)?.toString().trim();
    const primaryLast = (employee.lastName ?? employee.lastname)?.toString().trim();
    const fallbackFirst = employee.firstname?.toString().trim();
    const fallbackLast = employee.lastname?.toString().trim();

    const fullNameFromPrimary = [primaryFirst, primaryLast].filter(Boolean).join(' ');
    const fullNameFromFallback = [fallbackFirst, fallbackLast].filter(Boolean).join(' ');

    const candidates = [
      fullNameFromPrimary,
      employee.name,
      employee.fullName,
      fullNameFromFallback,
      employee.email,
    ]
      .map((value) => value?.toString().trim())
      .filter((value) => value);

    return candidates[0] ?? 'ללא שם';
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Text style={styles.backButtonLabel}>חזרה</Text>
          </Pressable>
          <Text style={styles.headerBadge}>רשימת עובדים</Text>
          <Text style={styles.headerTitle}>עובדים פעילים</Text>

          {loading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#457B9D" />
              <Text style={styles.stateText}>טוען את העובדים...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateContainer}>
              <Text style={[styles.stateText, styles.errorText]}>{error}</Text>
            </View>
          ) : employees.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>לא נמצאו עובדים</Text>
            </View>
          ) : (
            <FlatList
              data={employees}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const name = getEmployeeName(item);
                return (
                  <View style={styles.employeeCard}>
                    <Text style={styles.employeeName}>{name}</Text>
                  </View>
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
    color: '#457B9D',
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
  employeeCard: {
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
  employeeName: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'right',
  },
});

export default EmployeesPage;


