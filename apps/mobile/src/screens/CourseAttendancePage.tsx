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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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

interface AttendanceRow {
  _id?: string;
  kidId: string;
  kidName: string;
  attended: boolean;
  notes?: string;
  enrollment: CourseEnrollment;
}

const CourseAttendancePage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute();
  const { courseId } = (route.params as RouteParams) || {};
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [localAttendance, setLocalAttendance] = useState<Map<string, { attended: boolean; notes: string }>>(new Map());

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

      const attendance = attendanceMap.get(kidId);

      return {
        _id: attendance?._id,
        kidId,
        kidName,
        attended: attendance?.attended ?? false,
        notes: attendance?.notes ?? '',
        enrollment,
      };
    });
  }, [enrollmentsData, attendanceData]);

  // Update local state when attendance data changes
  useEffect(() => {
    if (tableData.length > 0) {
      const newLocalAttendance = new Map<string, { attended: boolean; notes: string }>();
      tableData.forEach((row) => {
        newLocalAttendance.set(row.kidId, {
          attended: row.attended,
          notes: row.notes || '',
        });
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

  // Handle attendance checkbox change
  const handleAttendanceChange = useCallback(
    (kidId: string, attended: boolean) => {
      // Update local state optimistically
      setLocalAttendance((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(kidId) || { attended: false, notes: '' };
        newMap.set(kidId, { ...current, attended });
        return newMap;
      });

      // Save to server
      if (!user?.organizationId || !selectedDateISO) {
        return;
      }

      const row = tableData.find((r) => r.kidId === kidId);
      if (!row) {
        return;
      }

      const current = localAttendance.get(kidId) || { attended: false, notes: '' };

      const attendanceDto: CreateCourseAttendanceDto = {
        organizationId: user.organizationId!,
        courseId,
        kidId,
        date: selectedDateISO,
        attended,
        notes: current.notes,
      };

      saveAttendanceMutation.mutate(attendanceDto);
    },
    [user?.organizationId, selectedDateISO, courseId, tableData, localAttendance, saveAttendanceMutation]
  );

  // Handle notes change
  const handleNotesChange = useCallback(
    (kidId: string, notes: string) => {
      // Update local state optimistically
      setLocalAttendance((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(kidId) || { attended: false, notes: '' };
        newMap.set(kidId, { ...current, notes });
        return newMap;
      });

      // Save to server
      if (!user?.organizationId || !selectedDateISO) {
        return;
      }

      const row = tableData.find((r) => r.kidId === kidId);
      if (!row) {
        return;
      }

      const current = localAttendance.get(kidId) || { attended: false, notes: '' };

      const attendanceDto: CreateCourseAttendanceDto = {
        organizationId: user.organizationId!,
        courseId,
        kidId,
        date: selectedDateISO,
        attended: current.attended,
        notes,
      };

      saveAttendanceMutation.mutate(attendanceDto);
    },
    [user?.organizationId, selectedDateISO, courseId, tableData, localAttendance, saveAttendanceMutation]
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

          {/* Participants List */}
          {selectedDate && (
            <FlatList
              data={tableData}
              keyExtractor={(item) => item.kidId}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const localData = localAttendance.get(item.kidId) || {
                  attended: item.attended,
                  notes: item.notes || '',
                };

                return (
                  <View style={styles.participantCard}>
                    <View style={styles.participantHeader}>
                      <View
                        style={[
                          styles.nameBadge,
                          { backgroundColor: '#E0F2FE', borderColor: '#0284C7' },
                        ]}
                      >
                        <Text style={styles.participantName}>{item.kidName}</Text>
                      </View>
                    </View>

                    <View style={styles.participantControls}>
                      <Pressable
                        onPress={() => handleAttendanceChange(item.kidId, !localData.attended)}
                        style={({ pressed }) => [
                          styles.checkboxContainer,
                          pressed && styles.checkboxContainerPressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            localData.attended && styles.checkboxChecked,
                          ]}
                        >
                          {localData.attended && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>נוכח</Text>
                      </Pressable>

                      <View style={styles.notesContainer}>
                        <Text style={styles.notesLabel}>הערות:</Text>
                        <TextInput
                          style={styles.notesInput}
                          value={localData.notes}
                          onChangeText={(text) => handleNotesChange(item.kidId, text)}
                          placeholder="הזן הערות..."
                          placeholderTextColor="#94A3B8"
                          multiline
                          textAlign="right"
                        />
                      </View>
                    </View>
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
  dateSelectorContainer: {
    gap: 8,
  },
  dateLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  dateSelectorButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  dateSelectorButtonPressed: {
    opacity: 0.8,
  },
  dateSelectorText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
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
  },
  dateOptionPressed: {
    opacity: 0.8,
  },
  dateOptionSelected: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  dateOptionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'right',
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
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  participantCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 16,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  nameBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  participantName: {
    color: '#0284C7',
    fontSize: 16,
    fontWeight: '600',
  },
  participantControls: {
    gap: 12,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxContainerPressed: {
    opacity: 0.8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '500',
  },
  notesContainer: {
    gap: 8,
  },
  notesLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  notesInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    color: '#1e293b',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default CourseAttendancePage;

