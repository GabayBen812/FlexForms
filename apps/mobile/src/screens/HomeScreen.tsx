import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueries } from '@tanstack/react-query';

import GradientButton from '../components/ui/GradientButton';
import { useAuth } from '../providers/AuthProvider';
import type { HomeStackParamList } from '../navigation/AppNavigator';
import { courseAttendanceApi } from '../api/course-attendance';
import { fetchChatGroups, fetchChatMessages, type ChatGroup, type ChatMessage } from '../api/chat';
import { fetchAttendanceByOrganization, type AttendanceShift } from '../api/attendance';

const mockFinanceData = {
  income: 24650,
  expenses: 18200,
  profit: 6450,
};

// Card Components
type TodayInKindergartenCardProps = {
  onPress?: () => void;
  arrived: number;
  notArrived: number;
};

const TodayInKindergartenCard = ({ onPress, arrived, notArrived }: TodayInKindergartenCardProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [
      styles.dashboardCard,
      styles.kidsCard,
      onPress && pressed && styles.dashboardCardPressed,
    ]}
  >
    <Text style={styles.dashboardCardTitle}>היום בגן</Text>
    <View style={styles.kidsAttendanceRow}>
      <View style={styles.kidsAttendanceItem}>
        <Text style={styles.kidsAttendanceValue}>{arrived}</Text>
        <Text style={styles.kidsAttendanceLabel}>הגיעו</Text>
      </View>
      <View style={styles.kidsAttendanceItem}>
        <Text style={[styles.kidsAttendanceValue, styles.kidsAttendanceValueWarning]}>
          {notArrived}
        </Text>
        <Text style={[styles.kidsAttendanceLabel, styles.kidsAttendanceLabelWarning]}>
          טרם הגיעו
        </Text>
      </View>
    </View>
  </Pressable>
);

type EmployeeReportsCardProps = {
  onPress?: () => void;
  currentDate: string; // DD/MM/YYYY format
  organizationId?: string;
};

const EmployeeReportsCard = ({ onPress, currentDate, organizationId }: EmployeeReportsCardProps) => {
  const { data: attendanceData = [], isLoading } = useQuery({
    queryKey: ['employee-attendance', organizationId],
    queryFn: () => {
      if (!organizationId) {
        return Promise.resolve([]);
      }
      return fetchAttendanceByOrganization(organizationId);
    },
    enabled: !!organizationId,
  });

  // Filter to today's records and transform data
  const todayEmployeeReports = useMemo(() => {
    if (!attendanceData || attendanceData.length === 0) {
      return [];
    }

    // Filter to today's records (reportedDate is in DD/MM/YYYY format)
    const todayRecords = attendanceData.filter((shift) => shift.reportedDate === currentDate);

    // Transform to display format
    const transformed = todayRecords.map((shift) => {
      const hasCheckedIn = !!shift.startTime;
      // Extract HH:MM from HH:MM:SS format
      const checkInTime = shift.startTime ? shift.startTime.substring(0, 5) : null;

      return {
        name: shift.employeeName,
        checkInTime,
        hasCheckedIn,
      };
    });

    // Sort by check-in time (earliest first), then by name
    transformed.sort((a, b) => {
      if (a.hasCheckedIn && !b.hasCheckedIn) return -1;
      if (!a.hasCheckedIn && b.hasCheckedIn) return 1;
      if (a.hasCheckedIn && b.hasCheckedIn && a.checkInTime && b.checkInTime) {
        return a.checkInTime.localeCompare(b.checkInTime);
      }
      return a.name.localeCompare(b.name);
    });

    return transformed;
  }, [attendanceData, currentDate]);

  const displayReports = todayEmployeeReports.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.dashboardCard,
        styles.employeesCard,
        onPress && pressed && styles.dashboardCardPressed,
      ]}
    >
      <Text style={styles.dashboardCardTitle}>דיווחי עובדים היום</Text>
      <View style={styles.employeeReportsList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#64748B" />
          </View>
        ) : displayReports.length === 0 ? (
          <Text style={styles.emptyMessageText}>אין דיווחים היום</Text>
        ) : (
          displayReports.map((employee, index) => (
            <View key={`employee-${employee.name}-${index}`} style={styles.employeeReportItem}>
              <Text style={styles.employeeReportName}>{employee.name}</Text>
              <Text style={styles.employeeReportStatus}>
                {employee.hasCheckedIn
                  ? `הגיעה ${employee.checkInTime}`
                  : 'טרם דווח'}
              </Text>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
};

type ParentMessagesCardProps = {
  onPress?: () => void;
};

const ParentMessagesCard = ({ onPress }: ParentMessagesCardProps) => {
  const { data: groups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['chat-groups'],
    queryFn: fetchChatGroups,
  });

  // Fetch latest message for each non-archived group using useQueries
  // Only fetch if lastMessagePreview is not available
  const activeGroups = useMemo(
    () => Array.isArray(groups) ? groups.filter((group) => !group.isArchived && group.id) : [],
    [groups]
  );

  const groupMessagesQueries = useQueries({
    queries: activeGroups.map((group) => ({
      queryKey: ['chat-messages', group.id, 'latest'],
      queryFn: () => fetchChatMessages(group.id, { limit: 1 }),
      enabled: !!group.id && !group.lastMessagePreview, // Only fetch if preview is missing
    })),
  });

  // Combine groups with their latest messages
  const messagesWithGroups = useMemo(() => {
    const combined: Array<{ group: ChatGroup; message: ChatMessage | null }> = [];

    activeGroups.forEach((group, index) => {
      const messagesQuery = groupMessagesQueries[index];
      const latestMessage = messagesQuery?.data?.messages?.[0] || null;
      const lastPreview = group.lastMessagePreview;

      // Prefer actual message, fallback to preview
      const messageContent = latestMessage?.content || lastPreview;

      if (messageContent) {
        combined.push({
          group,
          message: latestMessage || {
            id: '',
            groupId: group.id,
            senderId: '',
            content: lastPreview || '',
            createdAt: group.updatedAt,
            updatedAt: group.updatedAt,
            readBy: [],
          },
        });
      }
    });

    // Sort by most recent (by updatedAt or createdAt)
    return combined.sort((a, b) => {
      const dateA = new Date(a.message?.createdAt || a.group.updatedAt).getTime();
      const dateB = new Date(b.message?.createdAt || b.group.updatedAt).getTime();
      return dateB - dateA; // Most recent first
    });
  }, [activeGroups, groupMessagesQueries]);

  const isLoadingMessages = groupMessagesQueries.some((query) => query.isLoading);
  const isLoading = isGroupsLoading || isLoadingMessages;
  const displayMessages = messagesWithGroups.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.dashboardCard,
        styles.messagesCard,
        onPress && pressed && styles.dashboardCardPressed,
      ]}
    >
      <Text style={styles.dashboardCardTitle}>הודעות מההורים</Text>
      <View style={styles.parentMessagesList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#64748B" />
          </View>
        ) : displayMessages.length === 0 ? (
          <Text style={styles.emptyMessageText}>אין הודעות</Text>
        ) : (
          displayMessages.map((item, index) => (
            <View key={item.group.id || index} style={styles.parentMessageItem}>
              <Text style={styles.parentMessageText}>
                {item.group.name}: {item.message?.content || ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </Pressable>
  );
};

type MonthlyFinanceCardProps = {
  onPress?: () => void;
};

const MonthlyFinanceCard = ({ onPress }: MonthlyFinanceCardProps) => {
  const formatCurrency = (amount: number) => {
    return `₪${amount.toLocaleString('he-IL')}`;
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.dashboardCard,
        styles.monthlyFinanceCard,
        onPress && pressed && styles.dashboardCardPressed,
      ]}
    >
      <Text style={styles.dashboardCardTitle}>כספים – החודש</Text>
      <View style={styles.financeSummaryList}>
        <View style={styles.financeSummaryItem}>
          <Text style={styles.financeSummaryLabel}>הכנסות</Text>
          <Text style={styles.financeSummaryValue}>{formatCurrency(mockFinanceData.income)}</Text>
        </View>
        <View style={styles.financeSummaryItem}>
          <Text style={styles.financeSummaryLabel}>הוצאות</Text>
          <Text style={[styles.financeSummaryValue, styles.financeSummaryValueExpense]}>
            {formatCurrency(mockFinanceData.expenses)}
          </Text>
        </View>
        <View style={styles.financeSummaryItem}>
          <Text style={styles.financeSummaryLabel}>רווח חודשי משוער</Text>
          <Text style={[styles.financeSummaryValue, styles.financeSummaryValueProfit]}>
            {formatCurrency(mockFinanceData.profit)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const HomeScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const parentNavigation = useNavigation();
  
  // Navigate to different pages
  const navigateToKids = () => {
    (parentNavigation as any).navigate('KidsTab');
  };

  const navigateToEmployees = () => {
    navigation.navigate('EmployeesPage');
  };

  const navigateToMessages = () => {
    (parentNavigation as any).navigate('MessagesTab');
  };

  const navigateToFinance = () => {
    (parentNavigation as any).navigate('FinanceTab');
  };

  const navigateToCourses = () => {
    navigation.navigate('CoursesPage');
  };

  const currentDayData = useMemo(() => {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(now);
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);

    // Format date as ISO string (YYYY-MM-DD) for API
    const isoDate = `${now.getFullYear()}-${month}-${day}`;

    return {
      dayName,
      formattedDate: `${day}/${month}/${year}`,
      isoDate,
    };
  }, []);

  // Fetch kids attendance for today
  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['kids-attendance', currentDayData.isoDate],
    queryFn: () => courseAttendanceApi.fetchAggregatedAttendance(currentDayData.isoDate),
  });

  const kidsAttendance = useMemo(() => {
    if (isLoadingAttendance || !attendanceData) {
      return { arrived: 0, notArrived: 0 };
    }
    return attendanceData;
  }, [attendanceData, isLoadingAttendance]);

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
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
            <TodayInKindergartenCard 
              onPress={navigateToCourses} 
              arrived={kidsAttendance.arrived}
              notArrived={kidsAttendance.notArrived}
            />
            <EmployeeReportsCard 
              onPress={navigateToEmployees} 
              currentDate={currentDayData.formattedDate}
              organizationId={user?.organizationId}
            />
            <ParentMessagesCard onPress={navigateToMessages} />
            <MonthlyFinanceCard onPress={navigateToFinance} />
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
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    paddingBottom: 24,
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
    marginTop: 20,
    alignItems: 'center',
    paddingBottom: 24,
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    marginBottom: 16,
  },
  dashboardCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  dashboardCardTitle: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  // Kids Card Styles
  kidsCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#457B9D',
  },
  kidsAttendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 4,
  },
  kidsAttendanceItem: {
    flex: 1,
    alignItems: 'flex-end',
  },
  kidsAttendanceValue: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 6,
  },
  kidsAttendanceValueWarning: {
    color: '#FF6B4D',
  },
  kidsAttendanceLabel: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  kidsAttendanceLabelWarning: {
    color: '#E85A3F',
  },
  // Employees Card Styles
  employeesCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#10B981',
  },
  employeeReportsList: {
    gap: 12,
    marginTop: 4,
  },
  employeeReportItem: {
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  employeeReportName: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  employeeReportStatus: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  // Messages Card Styles
  messagesCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
  },
  parentMessagesList: {
    gap: 12,
    marginTop: 4,
  },
  parentMessageItem: {
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  parentMessageText: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  emptyMessageText: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 8,
  },
  // Monthly Finance Card Styles (dashboard card)
  monthlyFinanceCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#8B5CF6',
  },
  financeSummaryList: {
    gap: 14,
    marginTop: 4,
  },
  financeSummaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  financeSummaryLabel: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  financeSummaryValue: {
    textAlign: 'left',
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '700',
  },
  financeSummaryValueExpense: {
    color: '#E85A3F',
  },
  financeSummaryValueProfit: {
    color: '#10B981',
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


