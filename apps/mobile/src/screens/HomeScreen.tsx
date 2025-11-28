import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import GradientButton from '../components/ui/GradientButton';
import { useAuth } from '../providers/AuthProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { fetchKidsCount } from '../api/kids';
import { fetchEmployeesCount } from '../api/employees';

type DashboardCardProps = {
  title: string;
  value: string;
  subtitle: string;
  onPress?: () => void;
};

const DashboardCard = ({ title, value, subtitle, onPress }: DashboardCardProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.dashboardCard,
      onPress && pressed && styles.dashboardCardPressed,
    ]}
  >
    <Text style={styles.dashboardCardTitle}>{title}</Text>
    <Text style={styles.dashboardCardValue}>{value}</Text>
    <Text style={styles.dashboardCardSubtitle}>{subtitle}</Text>
  </Pressable>
);

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { data: kidsCount, isLoading: isLoadingKidsCount } = useQuery({
    queryKey: ['kids', 'count'],
    queryFn: fetchKidsCount,
  });

  const { data: employeesCount, isLoading: isLoadingEmployeesCount } = useQuery({
    queryKey: ['employees', 'count'],
    queryFn: fetchEmployeesCount,
  });

  const currentDayData = useMemo(() => {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(now);
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);

    return {
      dayName,
      formattedDate: `${day}/${month}/${year}`,
    };
  }, []);

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.container}>
          <Text style={styles.devLabel}>HomeScreen</Text>
          <View style={styles.header}>
            <Pressable
              onPress={() => navigation.navigate('HomeVer2')}
              style={({ pressed }) => [styles.dateGroup, pressed && styles.dateGroupPressed]}
            >
              <Text style={styles.dateTitle}>{currentDayData.dayName}</Text>
              <Text style={styles.dateSubtitle}>{currentDayData.formattedDate}</Text>
            </Pressable>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerBadge}>דף הבית</Text>
              <Text style={styles.headerTitle}>
                ברוך הבא, {user?.name ?? user?.email ?? 'משתמש'}
              </Text>
              {user?.email ? <Text style={styles.headerSubtitle}>{user.email}</Text> : null}
            </View>
          </View>

          <View style={styles.dashboardGrid}>
            <DashboardCard
              title="ילדים"
              value={isLoadingKidsCount ? '...' : String(kidsCount ?? 0)}
              subtitle="כמות הילדים הפעילים"
              onPress={() => navigation.navigate('KidsPage')}
            />
            <DashboardCard
              title="צ׳אט"
              value="5"
              subtitle="הודעות חדשות ממתינות"
              onPress={() => navigation.navigate('ChatPage')}
            />
            <DashboardCard
              title="עובדים"
              value={isLoadingEmployeesCount ? '...' : String(employeesCount ?? 0)}
              subtitle="כמות העובדים הפעילים"
              onPress={() => navigation.navigate('EmployeesPage')}
            />
            <DashboardCard
              title="משימות"
              value="8"
              subtitle="משימות פתוחות לסגירה"
              onPress={() => navigation.navigate('MyTasks')}
            />
          </View>

          <View style={styles.financeCard}>
            <Text style={styles.financeCardTitle}>המצב הפיננסי</Text>
            <View style={styles.financeItemsRow}>
              <View style={styles.financeItem}>
                <Text style={styles.financeItemLabel}>תשלומים שהתקבלו</Text>
                <Text style={styles.financeItemValue}>₪18,200</Text>
              </View>
              <View style={styles.financeItem}>
                <Text style={styles.financeItemLabel}>הכנסות החודש</Text>
                <Text style={styles.financeItemValue}>₪24,650</Text>
              </View>
              <View style={styles.financeItem}>
                <Text style={[styles.financeItemLabel, styles.financeItemLabelWarning]}>
                  תשלומים שלא עברו
                </Text>
                <Text style={[styles.financeItemValue, styles.financeItemValueWarning]}>₪3,400</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsCard}>
            <Text style={styles.actionsCardTitle}>פעולות מהירות</Text>
            <View style={styles.actionsButtonsRow}>
              <GradientButton
                label="רישום הוצאה"
                onPress={() => {}}
                colors={['#FF6B4D', '#E85A3F']}
                containerStyle={styles.actionButtonContainer}
                buttonStyle={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              />
              <GradientButton
                label="איתור קבלה"
                onPress={() => {}}
                colors={['#457B9D', '#0284C7']}
                containerStyle={styles.actionButtonContainer}
                buttonStyle={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              />
            </View>
          </View>

          <View style={styles.logoutSection}>
            <GradientButton
              label="התנתקות"
              onPress={logout}
              colors={['#FF6B4D', '#E85A3F']}
              containerStyle={styles.logoutContainer}
              buttonStyle={styles.logoutButton}
              labelStyle={styles.logoutLabel}
            />
          </View>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
  },
  dateGroup: {
    alignItems: 'flex-start',
    gap: 4,
  },
  dateGroupPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  devLabel: {
    alignSelf: 'flex-end',
    color: '#94A3B8',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  dateTitle: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '600',
  },
  dateSubtitle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  headerTextGroup: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 6,
  },
  headerBadge: {
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
  headerSubtitle: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 14,
  },
  logoutContainer: {
    borderRadius: 14,
    shadowOpacity: 0.25,
  },
  logoutButton: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  logoutLabel: {
    fontSize: 14,
  },
  logoutSection: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 24,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dashboardCard: {
    width: '48%',
    minWidth: 150,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
    marginBottom: 18,
  },
  dashboardCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  dashboardCardTitle: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  dashboardCardValue: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 12,
  },
  dashboardCardSubtitle: {
    textAlign: 'right',
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 10,
  },
  financeCard: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 20 },
    elevation: 14,
    marginBottom: 20,
  },
  financeCardTitle: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  financeItemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  financeItem: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: 12,
  },
  financeItemLabel: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'right',
  },
  financeItemValue: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  financeItemLabelWarning: {
    color: '#E85A3F',
  },
  financeItemValueWarning: {
    color: '#FF6B4D',
  },
  actionsCard: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 26,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 20 },
    elevation: 14,
  },
  actionsCardTitle: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 18,
  },
  actionsButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButtonContainer: {
    flex: 1,
    borderRadius: 18,
    shadowOpacity: 0.3,
    shadowRadius: 18,
  },
  actionButton: {
    borderRadius: 18,
    paddingVertical: 14,
  },
  actionButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(69, 123, 157, 0.08)',
    top: -100,
    right: -90,
  },
  glowBottom: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(255, 107, 77, 0.08)',
    bottom: -160,
    left: -140,
  },
});

export default HomeScreen;


