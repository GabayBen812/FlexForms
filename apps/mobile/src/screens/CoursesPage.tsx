import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

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
    refetch: refetchCourses,
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
            <ScrollView style={styles.errorScrollView} contentContainerStyle={styles.errorScrollContent}>
              <View style={styles.errorContainer}>
                <Text style={styles.errorMainTitle}>❌ שגיאה בטעינת הקורסים</Text>
                <Text style={styles.errorTimestamp}>זמן: {new Date().toLocaleString('he-IL')}</Text>

                {coursesErrorDetails && (() => {
                  const axiosError = coursesErrorDetails as AxiosError;
                  const isAxiosError = axiosError.isAxiosError === true;

                  return (
                    <>
                      {/* Error Type */}
                      <View style={styles.errorSection}>
                        <Text style={styles.errorSectionTitle}>🔍 סוג שגיאה:</Text>
                        <Text style={styles.errorSectionContent}>
                          {isAxiosError ? 'Axios Network Error' : 'JavaScript Error'}
                        </Text>
                      </View>

                      {/* Error Message */}
                      <View style={styles.errorSection}>
                        <Text style={styles.errorSectionTitle}>📝 הודעת שגיאה:</Text>
                        <Text style={styles.errorSectionContent}>
                          {axiosError.message || 'אין הודעת שגיאה'}
                        </Text>
                      </View>

                      {/* HTTP Status */}
                      {isAxiosError && axiosError.response && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>🌐 HTTP Status:</Text>
                          <Text style={styles.errorSectionContent}>
                            {axiosError.response.status} - {axiosError.response.statusText || 'No Status Text'}
                          </Text>
                          {axiosError.response.status === 401 && (
                            <Text style={styles.errorWarning}>⚠️ נדרש להתחבר מחדש</Text>
                          )}
                          {axiosError.response.status === 403 && (
                            <Text style={styles.errorWarning}>⚠️ אין הרשאות</Text>
                          )}
                          {axiosError.response.status === 404 && (
                            <Text style={styles.errorWarning}>⚠️ הנתיב לא נמצא</Text>
                          )}
                          {axiosError.response.status === 500 && (
                            <Text style={styles.errorWarning}>⚠️ שגיאת שרת</Text>
                          )}
                        </View>
                      )}

                      {/* Request Details */}
                      {isAxiosError && axiosError.config && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>🔗 פרטי בקשה:</Text>
                          <Text style={styles.errorSectionContent}>
                            Method: {axiosError.config.method?.toUpperCase() || 'GET'}
                          </Text>
                          <Text style={styles.errorSectionContent}>
                            URL: {axiosError.config.baseURL || ''}{axiosError.config.url || ''}
                          </Text>
                          {axiosError.config.headers?.Authorization && (
                            <Text style={styles.errorSectionContent}>
                              Auth: Bearer Token Present
                            </Text>
                          )}
                        </View>
                      )}

                      {/* Response Data */}
                      {isAxiosError && axiosError.response?.data && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>📦 תשובת השרת:</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <Text style={styles.errorSectionContentMono}>
                              {JSON.stringify(axiosError.response.data, null, 2)}
                            </Text>
                          </ScrollView>
                        </View>
                      )}

                      {/* Network Error */}
                      {isAxiosError && !axiosError.response && axiosError.request && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>🚨 שגיאת רשת:</Text>
                          <Text style={styles.errorSectionContent}>
                            הבקשה נשלחה אך לא התקבלה תשובה מהשרת
                          </Text>
                          <Text style={styles.errorSectionContent}>
                            • בדוק את חיבור האינטרנט
                          </Text>
                          <Text style={styles.errorSectionContent}>
                            • וודא שהשרת פועל
                          </Text>
                          <Text style={styles.errorSectionContent}>
                            • בדוק את כתובת ה-API: {axiosError.config?.baseURL}
                          </Text>
                        </View>
                      )}

                      {/* Error Code */}
                      {isAxiosError && axiosError.code && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>🏷️ קוד שגיאה:</Text>
                          <Text style={styles.errorSectionContent}>{axiosError.code}</Text>
                          {axiosError.code === 'ECONNABORTED' && (
                            <Text style={styles.errorWarning}>⚠️ הבקשה בוטלה (timeout)</Text>
                          )}
                          {axiosError.code === 'ERR_NETWORK' && (
                            <Text style={styles.errorWarning}>⚠️ בעיית רשת</Text>
                          )}
                          {axiosError.code === 'ERR_BAD_REQUEST' && (
                            <Text style={styles.errorWarning}>⚠️ בקשה שגויה</Text>
                          )}
                        </View>
                      )}

                      {/* Stack Trace (for development) */}
                      {axiosError.stack && __DEV__ && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>📚 Stack Trace (Dev Only):</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <Text style={styles.errorSectionContentMono}>
                              {axiosError.stack}
                            </Text>
                          </ScrollView>
                        </View>
                      )}

                      {/* Full Error Object (for extreme debugging) */}
                      {__DEV__ && (
                        <View style={styles.errorSection}>
                          <Text style={styles.errorSectionTitle}>🔬 Full Error Object (Dev Only):</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                            <Text style={styles.errorSectionContentMono}>
                              {JSON.stringify(
                                {
                                  message: axiosError.message,
                                  code: axiosError.code,
                                  isAxiosError: axiosError.isAxiosError,
                                  config: {
                                    url: axiosError.config?.url,
                                    method: axiosError.config?.method,
                                    baseURL: axiosError.config?.baseURL,
                                    headers: axiosError.config?.headers,
                                  },
                                  response: axiosError.response ? {
                                    status: axiosError.response.status,
                                    statusText: axiosError.response.statusText,
                                    data: axiosError.response.data,
                                    headers: axiosError.response.headers,
                                  } : undefined,
                                },
                                null,
                                2
                              )}
                            </Text>
                          </ScrollView>
                        </View>
                      )}
                    </>
                  );
                })()}

                <Pressable
                  style={styles.retryButton}
                  onPress={() => refetchCourses()}
                >
                  <Text style={styles.retryButtonText}>🔄 נסה שוב</Text>
                </Pressable>
              </View>
            </ScrollView>
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
  errorScrollView: {
    flex: 1,
  },
  errorScrollContent: {
    paddingVertical: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FCA5A5',
    gap: 16,
  },
  errorMainTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#991B1B',
    textAlign: 'right',
  },
  errorTimestamp: {
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'right',
    fontStyle: 'italic',
  },
  errorSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  errorSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#B91C1C',
    textAlign: 'right',
    marginBottom: 4,
  },
  errorSectionContent: {
    fontSize: 13,
    color: '#374151',
    textAlign: 'right',
    lineHeight: 20,
  },
  errorSectionContentMono: {
    fontSize: 11,
    color: '#374151',
    textAlign: 'left',
    fontFamily: 'monospace',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    lineHeight: 18,
  },
  errorWarning: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EA580C',
    textAlign: 'right',
    marginTop: 4,
  },
  retryButton: {
    backgroundColor: '#457B9D',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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

