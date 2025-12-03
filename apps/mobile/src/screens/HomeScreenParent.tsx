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
import { api } from '../api/client';
import { fetchChatGroups, fetchChatMessages, type ChatGroup, type ChatMessage } from '../api/chat';
import { courseAttendanceApi, type CourseAttendance } from '../api/course-attendance';
import { fetchCourses, type Course } from '../api/courses';
import type { Kid } from '../api/kids';

// Card Components
type KidsAttendanceCardProps = {
  onPress?: () => void;
  kids: Kid[];
  attendanceData: Record<string, CourseAttendance[]>;
  isLoading: boolean;
  currentDate: string; // ISO date format
};

const KidsAttendanceCard = ({
  onPress,
  kids,
  attendanceData,
  isLoading,
  currentDate,
}: KidsAttendanceCardProps) => {
  // Process attendance for each kid
  const kidsWithAttendance = useMemo(() => {
    return kids.map((kid) => {
      const kidId = kid._id;
      const attendances = attendanceData[kidId] || [];
      
      // Check if kid has any attendance record for today
      const hasAttendance = attendances.length > 0;
      const attended = attendances.some((att) => att.attended === true);
      
      return {
        kid,
        hasAttendance,
        attended,
        kidId,
      };
    });
  }, [kids, attendanceData]);

  const displayKids = kidsWithAttendance.slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.dashboardCard,
        styles.kidsCard,
        onPress && pressed && styles.dashboardCardPressed,
      ]}
    >
      <Text style={styles.dashboardCardTitle}>נוכחות הילדים היום</Text>
      <View style={styles.kidsAttendanceList}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#64748B" />
          </View>
        ) : displayKids.length === 0 ? (
          <Text style={styles.emptyMessageText}>אין ילדים רשומים</Text>
        ) : (
          displayKids.map((item, index) => {
            const kidName = `${item.kid.firstname || ''} ${item.kid.lastname || ''}`.trim() || 'ללא שם';
            return (
              <View key={item.kidId || index} style={styles.kidAttendanceItem}>
                <Text style={styles.kidAttendanceName}>{kidName}</Text>
                <Text
                  style={[
                    styles.kidAttendanceStatus,
                    item.hasAttendance
                      ? item.attended
                        ? styles.kidAttendanceStatusArrived
                        : styles.kidAttendanceStatusNotArrived
                      : styles.kidAttendanceStatusUnknown,
                  ]}
                >
                  {item.hasAttendance
                    ? item.attended
                      ? 'הגיע'
                      : 'לא הגיע'
                    : 'טרם דווח'}
                </Text>
              </View>
            );
          })
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
    () => groups.filter((group) => !group.isArchived && group.id),
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
      <Text style={styles.dashboardCardTitle}>הודעות</Text>
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

const HomeScreenParent = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const parentNavigation = useNavigation();

  // Navigate to different pages
  const navigateToKids = () => {
    (parentNavigation as any).navigate('KidsTab');
  };

  const navigateToMessages = () => {
    (parentNavigation as any).navigate('MessagesTab');
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

  // Fetch parent's kids (backend filters automatically)
  const { data: kids = [], isLoading: isLoadingKids } = useQuery({
    queryKey: ['kids'],
    queryFn: async () => {
      const response = await api.get<Kid[]>('/kids');
      return response.data ?? [];
    },
  });

  // Fetch attendance for each kid's courses for today
  // First, we need to get all courses, then fetch attendance per course
  // For simplicity, we'll fetch aggregated attendance which should be filtered by backend
  const { data: aggregatedAttendance, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['kids-attendance', currentDayData.isoDate],
    queryFn: () => courseAttendanceApi.fetchAggregatedAttendance(currentDayData.isoDate),
  });

  // Fetch courses to get attendance per kid
  // Backend filters courses by parent's kids automatically
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    enabled: kids.length > 0,
  });

  // Fetch attendance for each course for today
  const attendanceQueries = useQueries({
    queries: courses.map((course) => ({
      queryKey: ['course-attendance', course._id, currentDayData.isoDate],
      queryFn: () => courseAttendanceApi.fetchByCourseAndDate(course._id, currentDayData.isoDate),
      enabled: !!course._id,
    })),
  });

  // Create a mapping of kidId -> attendance records
  const attendanceByKid = useMemo(() => {
    const mapping: Record<string, CourseAttendance[]> = {};
    attendanceQueries.forEach((query) => {
      const attendances = query.data || [];
      attendances.forEach((attendance) => {
        const kidId =
          typeof attendance.kidId === 'string' ? attendance.kidId : attendance.kidId._id;
        if (!mapping[kidId]) {
          mapping[kidId] = [];
        }
        mapping[kidId].push(attendance);
      });
    });
    return mapping;
  }, [attendanceQueries]);

  const isLoadingAllAttendance = attendanceQueries.some((query) => query.isLoading);

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
          <Text style={styles.devLabel}>HomeScreenParent</Text>
          <View style={styles.header}>
            <View style={styles.dateGroup}>
              <Text style={styles.dateTitle}>{currentDayData.dayName}</Text>
              <Text style={styles.dateSubtitle}>{currentDayData.formattedDate}</Text>
            </View>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerBadge}>דף הבית</Text>
              <Text style={styles.headerTitle}>
                ברוך הבא, {user?.name ?? user?.email ?? 'משתמש'}
              </Text>
              {user?.email ? <Text style={styles.headerSubtitle}>{user.email}</Text> : null}
            </View>
          </View>

          <View style={styles.dashboardGrid}>
            <KidsAttendanceCard
              onPress={navigateToKids}
              kids={kids}
              attendanceData={attendanceByKid}
              isLoading={isLoadingKids || isLoadingAllAttendance}
              currentDate={currentDayData.isoDate}
            />
            <ParentMessagesCard onPress={navigateToMessages} />
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
  kidsAttendanceList: {
    gap: 12,
    marginTop: 4,
  },
  kidAttendanceItem: {
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  kidAttendanceName: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  kidAttendanceStatus: {
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '600',
  },
  kidAttendanceStatusArrived: {
    color: '#10B981',
  },
  kidAttendanceStatusNotArrived: {
    color: '#FF6B4D',
  },
  kidAttendanceStatusUnknown: {
    color: '#64748B',
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

export default HomeScreenParent;

