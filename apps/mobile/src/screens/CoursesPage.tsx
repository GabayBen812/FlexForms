import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { fetchCourses, fetchCourseSessions, fetchCourseEnrollments, type Course, type CourseSession, type CourseEnrollment } from '../api/courses';
import type { HomeStackParamList } from '../navigation/AppNavigator';

type CourseWithTodaySessions = Course & {
  todaySessionsCount: number;
  participantsCount: number;
};

const CoursesPage = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const {
    data: courses = [],
    isLoading: coursesLoading,
    isError: coursesError,
    error: coursesErrorDetails,
  } = useQuery({
    queryKey: ['courses'],
    queryFn: fetchCourses,
    retry: 2,
  });

  const {
    data: sessions = [],
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useQuery({
    queryKey: ['course-sessions'],
    queryFn: () => fetchCourseSessions(),
    retry: 2,
    // Don't fail the whole page if sessions fail - we can still show courses
    retryOnMount: false,
  });

  const {
    data: enrollments = [],
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
  } = useQuery({
    queryKey: ['course-enrollments'],
    queryFn: () => fetchCourseEnrollments(),
    retry: 2,
    // Don't fail the whole page if enrollments fail - we can still show courses
    retryOnMount: false,
  });

  const sortedCourses = useMemo(() => {
    // Calculate participant counts per course
    const participantsCountMap = new Map<string, number>();
    enrollments.forEach((enrollment) => {
      const courseId = typeof enrollment.courseId === 'string' ? enrollment.courseId : enrollment.courseId._id;
      participantsCountMap.set(courseId, (participantsCountMap.get(courseId) || 0) + 1);
    });

    // If no courses or sessions failed/empty, return courses without session count
    if (!courses.length || sessionsError || !sessions.length) {
      return courses.map((course) => ({
        ...course,
        todaySessionsCount: 0,
        participantsCount: participantsCountMap.get(course._id) || 0,
      }));
    }

    // Get today's date (date only, no time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all courseIds that have sessions today
    const coursesWithTodaySessions = new Set<string>();
    const todaySessionsCountMap = new Map<string, number>();

    sessions.forEach((session) => {
      const sessionDate = new Date(session.date);
      sessionDate.setHours(0, 0, 0, 0);

      if (sessionDate.getTime() === today.getTime() && session.status === 'NORMAL') {
        const courseId = typeof session.courseId === 'string' ? session.courseId : session.courseId._id;
        coursesWithTodaySessions.add(courseId);
        todaySessionsCountMap.set(courseId, (todaySessionsCountMap.get(courseId) || 0) + 1);
      }
    });

    // Create courses with today's sessions count and participant count
    const coursesWithCount: CourseWithTodaySessions[] = courses.map((course) => ({
      ...course,
      todaySessionsCount: todaySessionsCountMap.get(course._id) || 0,
      participantsCount: participantsCountMap.get(course._id) || 0,
    }));

    // Sort: courses with today's sessions first, then alphabetically by name
    return coursesWithCount.sort((a, b) => {
      const aHasToday = coursesWithTodaySessions.has(a._id);
      const bHasToday = coursesWithTodaySessions.has(b._id);

      if (aHasToday && !bHasToday) return -1;
      if (!aHasToday && bHasToday) return 1;

      // If both have or both don't have today's sessions, sort alphabetically
      return a.name.localeCompare(b.name, 'he');
    });
  }, [courses, sessions, enrollments]);

  const isLoading = coursesLoading || sessionsLoading || enrollmentsLoading;
  // Only show error if courses query failed (sessions/enrollments errors are non-critical)
  const isError = coursesError;

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Text style={styles.backButtonLabel}>חזרה לדף הבית</Text>
          </Pressable>

          <Text style={styles.headerBadge}>קורסים</Text>
          <Text style={styles.headerTitle}>כל הקורסים</Text>

          {isLoading ? (
            <View style={styles.stateContainer}>
              <ActivityIndicator size="large" color="#457B9D" />
              <Text style={styles.stateText}>טוען את הקורסים...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateContainer}>
              <Text style={[styles.stateText, styles.errorText]}>שגיאה בטעינת הקורסים</Text>
              {coursesErrorDetails && (
                <Text style={[styles.stateText, styles.errorDetails]}>
                  {coursesErrorDetails instanceof Error
                    ? coursesErrorDetails.message
                    : 'נסה שוב מאוחר יותר'}
                </Text>
              )}
              {coursesErrorDetails &&
                typeof coursesErrorDetails === 'object' &&
                'response' in coursesErrorDetails &&
                (coursesErrorDetails as { response?: { status?: number } }).response?.status === 401 && (
                  <Text style={[styles.stateText, styles.errorDetails]}>
                    נדרש להתחבר מחדש
                  </Text>
                )}
            </View>
          ) : sortedCourses.length === 0 ? (
            <View style={styles.stateContainer}>
              <Text style={styles.stateText}>לא נמצאו קורסים</Text>
            </View>
          ) : (
            <FlatList
              data={sortedCourses}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate('CourseAttendancePage', { courseId: item._id })}
                  style={({ pressed }) => [
                    styles.courseCard,
                    item.color && { borderLeftColor: item.color },
                    pressed && styles.courseCardPressed,
                  ]}
                >
                  <View style={styles.courseCardHeader}>
                    <Text style={styles.courseName}>{item.name}</Text>
                    {item.todaySessionsCount > 0 && (
                      <View style={styles.todaySessionsBadge}>
                        <Text style={styles.todaySessionsText}>
                          {item.todaySessionsCount} שיעורים היום
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.courseCardInfo}>
                    <Text style={styles.participantsText}>
                      {item.participantsCount} משתתפים
                    </Text>
                  </View>
                  {item.color && (
                    <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
                  )}
                </Pressable>
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
    fontWeight: '600',
  },
  errorDetails: {
    color: '#E85A3F',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 24,
    gap: 16,
  },
  courseCard: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderLeftWidth: 5,
    borderColor: '#E5E7EB',
    borderLeftColor: '#457B9D',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  courseCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  courseCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseName: {
    flex: 1,
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
  },
  todaySessionsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    marginRight: 12,
  },
  todaySessionsText: {
    color: '#0284C7',
    fontSize: 14,
    fontWeight: '600',
  },
  courseCardInfo: {
    marginTop: 8,
  },
  participantsText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
  },
  colorIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'flex-end',
    marginTop: 8,
  },
});

export default CoursesPage;

