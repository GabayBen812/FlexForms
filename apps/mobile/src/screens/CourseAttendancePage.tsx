import { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Modal,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import dayjs from 'dayjs';
import 'dayjs/locale/he';
import 'dayjs/locale/en';

import { fetchCourseEnrollments, fetchCourseSchedule, type CourseEnrollment, type CourseSchedule } from '../api/courses';
import { courseAttendanceApi, type CourseAttendance, type CreateCourseAttendanceDto } from '../api/course-attendance';
import { getCourseScheduleDates } from '../utils/courseDateUtils';
import { useAuth } from '../providers/AuthProvider';
import type { HomeStackParamList } from '../navigation/AppNavigator';

type RouteParams = {
  courseId: string;
};

type AttendanceState = 'unmarked' | 'attended' | 'absent';

interface AttendanceRow {
  _id?: string;
  kidId: string;
  kidName: string;
  profileImageUrl?: string;
  attendanceState: AttendanceState;
  enrollment: CourseEnrollment;
}

// Helper component for profile image with error handling
const ProfileImage = ({ 
  imageUrl, 
  style 
}: { 
  imageUrl?: string; 
  style?: any;
}) => {
  const [imageError, setImageError] = useState(false);

  if (!imageUrl || imageError) {
    return (
      <View style={[styles.profileImagePlaceholder, style]}>
        <Feather name="user" size={20} color="#94A3B8" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[styles.profileImage, style]}
      resizeMode="cover"
      onError={() => setImageError(true)}
    />
  );
};

const CourseAttendancePage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute();
  const { courseId } = (route.params as RouteParams) || {};
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [localAttendance, setLocalAttendance] = useState<Map<string, AttendanceState>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  // Configure dayjs locale for Hebrew
  useEffect(() => {
    dayjs.locale('he');
  }, []);

  // Fetch course schedule
  const { data: schedulesData, isLoading: isLoadingSchedule } = useQuery({
    queryKey: ['course', courseId, 'schedule'],
    queryFn: () => fetchCourseSchedule(courseId),
    enabled: !!courseId,
  });

  // Calculate available dates
  const availableDates = useMemo(() => {
    if (!schedulesData || schedulesData.length === 0) {
      return [];
    }
    return getCourseScheduleDates(schedulesData);
  }, [schedulesData]);

  // Set default date on mount and when schedules change
  useEffect(() => {
    if (schedulesData && schedulesData.length > 0 && availableDates.length > 0) {
      const today = dayjs().startOf('day');

      // First, check if today exists in available dates - if so, use it
      const todayInAvailable = availableDates.find((date) =>
        dayjs(date).startOf('day').isSame(today, 'day')
      );

      if (todayInAvailable) {
        setSelectedDate(todayInAvailable);
        return;
      }

      // Otherwise, find the next scheduled date after today
      const nextDate = availableDates.find((date) => dayjs(date).startOf('day').isAfter(today));

      if (nextDate) {
        setSelectedDate(nextDate);
        return;
      }

      // If no future date found, use the last available date
      setSelectedDate(availableDates[availableDates.length - 1]);
    }
  }, [schedulesData, availableDates]);

  // Fetch course participants
  const { data: enrollmentsData, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['course-enrollments', courseId],
    queryFn: () => fetchCourseEnrollments(courseId),
    enabled: !!courseId,
  });

  // Fetch attendance for selected date
  const selectedDateISO = selectedDate ? dayjs(selectedDate).format('YYYY-MM-DD') : null;

  const { data: attendanceData, isLoading: isLoadingAttendance } = useQuery({
    queryKey: ['course-attendance', courseId, selectedDateISO],
    queryFn: () => {
      if (!selectedDateISO) {
        return Promise.resolve([]);
      }
      return courseAttendanceApi.fetchByCourseAndDate(courseId, selectedDateISO);
    },
    enabled: !!selectedDateISO && !!courseId,
  });

  // Merge participants with attendance data
  const tableData = useMemo<AttendanceRow[]>(() => {
    if (!enrollmentsData || enrollmentsData.length === 0) {
      return [];
    }

    const attendanceMap = new Map<string, CourseAttendance>();
    if (attendanceData) {
      attendanceData.forEach((attendance) => {
        const kidId =
          typeof attendance.kidId === 'string'
            ? attendance.kidId
            : attendance.kidId && typeof attendance.kidId === 'object' && '_id' in attendance.kidId
              ? (attendance.kidId as { _id?: string })._id || ''
              : '';
        if (kidId) {
          attendanceMap.set(kidId, attendance);
        }
      });
    }

    return enrollmentsData.map((enrollment) => {
      const kidData =
        enrollment.kid ??
        (typeof enrollment.kidId === 'object' && enrollment.kidId !== null ? enrollment.kidId : null);

      const kidId =
        typeof enrollment.kidId === 'string' ? enrollment.kidId : enrollment.kidId?._id || '';
      const kidName =
        kidData && (kidData.firstname || kidData.lastname)
          ? `${kidData.firstname ?? ''} ${kidData.lastname ?? ''}`.trim()
          : 'ללא שם';
      
      const profileImageUrl = kidData && 'profileImageUrl' in kidData ? kidData.profileImageUrl : undefined;

      const attendance = attendanceMap.get(kidId);
      
      // Convert boolean attended to AttendanceState
      let attendanceState: AttendanceState = 'unmarked';
      if (attendance) {
        attendanceState = attendance.attended ? 'attended' : 'absent';
      }

      return {
        _id: attendance?._id,
        kidId,
        kidName,
        profileImageUrl,
        attendanceState,
        enrollment,
      };
    });
  }, [enrollmentsData, attendanceData]);

  // Update local state when attendance data changes
  useEffect(() => {
    if (tableData.length > 0) {
      const newLocalAttendance = new Map<string, AttendanceState>();
      tableData.forEach((row) => {
        newLocalAttendance.set(row.kidId, row.attendanceState);
      });
      setLocalAttendance(newLocalAttendance);
    }
  }, [tableData]);

  // Mutation for saving attendance
  const saveAttendanceMutation = useMutation({
    mutationFn: async (dto: CreateCourseAttendanceDto) => {
      return courseAttendanceApi.createOrUpdate(dto);
    },
    onSuccess: () => {
      // Invalidate query to refresh data
      queryClient.invalidateQueries({
        queryKey: ['course-attendance', courseId, selectedDateISO],
      });
    },
    onError: (error) => {
      console.error('Failed to save attendance:', error);
      // Revert local state on error
      queryClient.invalidateQueries({
        queryKey: ['course-attendance', courseId, selectedDateISO],
      });
    },
  });

  // Handle attendance toggle - cycles through unmarked → attended ↔ absent
  const handleAttendanceToggle = useCallback(
    (kidId: string) => {
      const currentState = localAttendance.get(kidId) || 'unmarked';
      
      // Cycle through states: unmarked → attended, attended ↔ absent
      let nextState: AttendanceState;
      if (currentState === 'unmarked') {
        nextState = 'attended';
      } else if (currentState === 'attended') {
        nextState = 'absent';
      } else {
        // If absent, go back to attended (easy correction)
        nextState = 'attended';
      }

      // Update local state optimistically
      setLocalAttendance((prev) => {
        const newMap = new Map(prev);
        newMap.set(kidId, nextState);
        return newMap;
      });

      // Save to server
      if (!user?.organizationId || !selectedDateISO) {
        return;
      }

      const attendanceDto: CreateCourseAttendanceDto = {
        organizationId: user.organizationId!,
        courseId,
        kidId,
        date: selectedDateISO,
        attended: nextState === 'attended',
        notes: '',
      };
      saveAttendanceMutation.mutate(attendanceDto);
    },
    [user?.organizationId, selectedDateISO, courseId, localAttendance, saveAttendanceMutation]
  );

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
    // Clear local attendance when date changes
    setLocalAttendance(new Map());
  };

  const formatDateForDisplay = (date: Date): string => {
    return dayjs(date).format('DD/MM/YYYY');
  };

  const formatDateWithDayName = (date: Date): string => {
    const dateStr = formatDateForDisplay(date);
    const dayName = dayjs(date).format('dddd');
    return `${dateStr} - ${dayName}`;
  };

  // Filter table data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return tableData;
    }
    const query = searchQuery.toLowerCase().trim();
    return tableData.filter((row) => 
      row.kidName.toLowerCase().includes(query)
    );
  }, [tableData, searchQuery]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const total = tableData.length;
    let attended = 0;
    let absent = 0;
    let unmarked = 0;

    tableData.forEach((row) => {
      const state = localAttendance.get(row.kidId) || row.attendanceState;
      if (state === 'attended') {
        attended++;
      } else if (state === 'absent') {
        absent++;
      } else {
        unmarked++;
      }
    });

    const attendancePercentage = total > 0 ? (attended / total) * 100 : 0;

    return {
      total,
      attended,
      absent,
      unmarked,
      attendancePercentage,
    };
  }, [tableData, localAttendance]);

  const isLoading = isLoadingSchedule || isLoadingEnrollments || isLoadingAttendance;

  if (isLoading) {
    return (
      <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#457B9D" />
              <Text style={styles.stateText}>טוען נתונים...</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!schedulesData || schedulesData.length === 0) {
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
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>לא הוגדר לוח זמנים לקורס זה</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (availableDates.length === 0) {
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
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>אין תאריכים מתוזמנים</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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

          <Text style={styles.headerBadge}>נוכחות</Text>
          <Text style={styles.headerTitle}>סימון נוכחות</Text>

          {/* Date Selector */}
          <View style={styles.dateSelectorContainer}>
            <Text style={styles.dateLabel}>בחר תאריך:</Text>
            <Pressable
              onPress={() => setDatePickerVisible(true)}
              style={({ pressed }) => [
                styles.dateSelectorButton,
                pressed && styles.dateSelectorButtonPressed,
              ]}
            >
              <Text style={styles.dateSelectorText}>
                {selectedDate ? formatDateWithDayName(selectedDate) : 'בחר תאריך'}
              </Text>
            </Pressable>
          </View>

          {/* Date Picker Modal */}
          <Modal
            visible={datePickerVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setDatePickerVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>בחר תאריך</Text>
                <ScrollView style={styles.dateList}>
                  {availableDates.map((date) => {
                    const dateStr = dayjs(date).format('YYYY-MM-DD');
                    return (
                      <Pressable
                        key={dateStr}
                        onPress={() => handleDateChange(date)}
                        style={({ pressed }) => [
                          styles.dateOption,
                          pressed && styles.dateOptionPressed,
                          selectedDate &&
                            dayjs(selectedDate).format('YYYY-MM-DD') === dateStr &&
                            styles.dateOptionSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dateOptionText,
                            selectedDate &&
                              dayjs(selectedDate).format('YYYY-MM-DD') === dateStr &&
                              styles.dateOptionTextSelected,
                          ]}
                        >
                          {formatDateWithDayName(date)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  onPress={() => setDatePickerVisible(false)}
                  style={({ pressed }) => [styles.modalCloseButton, pressed && styles.modalCloseButtonPressed]}
                >
                  <Text style={styles.modalCloseButtonText}>סגור</Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          {/* Search Bar */}
          {selectedDate && (
            <View style={styles.searchContainer}>
              <View style={styles.searchIconContainer}>
                <Feather name="search" size={20} color="#457B9D" />
              </View>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="חיפוש מהיר..."
                placeholderTextColor="#94A3B8"
                textAlign="center"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  style={styles.searchClearButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather name="x-circle" size={18} color="#64748B" />
                </Pressable>
              )}
            </View>
          )}

          {/* Summary Statistics */}
          {selectedDate && (
            <View style={styles.summaryContainer}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryText}>
                  {summaryStats.attended} מתוך {summaryStats.total} הגיעו
                </Text>
                <Text style={styles.summaryPercentage}>
                  {summaryStats.attendancePercentage.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${summaryStats.attendancePercentage}%`,
                      backgroundColor:
                        summaryStats.attendancePercentage >= 80
                          ? '#10B981'
                          : summaryStats.attendancePercentage >= 50
                          ? '#F59E0B'
                          : '#EF4444',
                    },
                  ]}
                />
              </View>
              <View style={styles.summaryStats}>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.statText}>{summaryStats.attended} הגיעו</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.statText}>{summaryStats.absent} לא הגיעו</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={[styles.statDot, { backgroundColor: '#94A3B8' }]} />
                  <Text style={styles.statText}>{summaryStats.unmarked} לא סומנו</Text>
                </View>
              </View>
            </View>
          )}

          {/* Participants Grid */}
          {selectedDate && (
            <FlatList
              data={filteredData}
              keyExtractor={(item) => item.kidId}
              numColumns={3}
              columnWrapperStyle={styles.gridRow}
              contentContainerStyle={styles.gridContent}
              renderItem={({ item }) => {
                const state = localAttendance.get(item.kidId) || item.attendanceState;

                // Determine card style based on state
                let cardStyle = styles.gridCardUnmarked;
                let iconName: 'check-circle' | 'x-circle' | 'circle' = 'circle';
                let iconColor = '#94A3B8';
                let textColor = '#334155';

                if (state === 'attended') {
                  cardStyle = styles.gridCardAttended;
                  iconName = 'check-circle';
                  iconColor = '#FFFFFF';
                  textColor = '#FFFFFF';
                } else if (state === 'absent') {
                  cardStyle = styles.gridCardAbsent;
                  iconName = 'x-circle';
                  iconColor = '#FFFFFF';
                  textColor = '#FFFFFF';
                }

                return (
                  <Pressable
                    style={({ pressed }) => [
                      styles.gridCard,
                      cardStyle,
                      pressed && styles.gridCardPressed,
                    ]}
                    onPress={() => handleAttendanceToggle(item.kidId)}
                    onLongPress={() => navigation.navigate('KidDetails', { kidId: item.kidId })}
                  >
                    <ProfileImage
                      imageUrl={item.profileImageUrl}
                      style={styles.gridProfileImage}
                    />
                    <Text
                      style={[styles.gridKidName, { color: textColor }]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {item.kidName}
                    </Text>
                    <View style={styles.gridIconContainer}>
                      <Feather name={iconName} size={20} color={iconColor} />
                    </View>
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
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  backButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
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
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: 2,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  stateText: {
    color: '#64748B',
    fontSize: 16,
  },
  dateSelectorContainer: {
    gap: 4,
  },
  dateLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  dateSelectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  dateSelectorButtonPressed: {
    opacity: 0.8,
  },
  dateSelectorText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
    marginBottom: 16,
  },
  dateList: {
    maxHeight: 400,
  },
  dateOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  dateOptionPressed: {
    opacity: 0.8,
  },
  dateOptionSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  dateOptionText: {
    fontSize: 20,
    color: '#1e293b',
    textAlign: 'center',
  },
  dateOptionTextSelected: {
    color: '#0284C7',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#457B9D',
    alignItems: 'center',
  },
  modalCloseButtonPressed: {
    opacity: 0.8,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // Search Container
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#457B9D',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    shadowColor: '#457B9D',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchIconContainer: {
    padding: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    paddingVertical: 2,
    textAlign: 'center',
  },
  searchClearButton: {
    padding: 2,
  },
  // Summary Statistics
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'right',
  },
  summaryPercentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#457B9D',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  summaryStats: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  // Grid Layout
  gridContent: {
    paddingBottom: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  gridCard: {
    width: '31.5%',
    aspectRatio: 0.85,
    borderRadius: 12,
    borderWidth: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 120,
  },
  gridCardUnmarked: {
    backgroundColor: '#F8FAFC',
    borderColor: '#D1D5DB',
  },
  gridCardAttended: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  gridCardAbsent: {
    backgroundColor: '#EF4444',
    borderColor: '#DC2626',
  },
  gridCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  gridProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F3F4F6',
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridKidName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  gridIconContainer: {
    marginTop: 4,
  },
});

export default CourseAttendancePage;

