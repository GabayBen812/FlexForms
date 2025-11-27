import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import GradientButton from '../components/ui/GradientButton';
import EmployeeLocationMap from '../components/EmployeeLocationMap';
import WorkingTimeTimer from '../components/WorkingTimeTimer';
import { useAuth } from '../providers/AuthProvider';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { MapRegion } from '../types/location';
import {
  recordShiftAction,
  extractAttendanceErrorMessage,
  fetchAttendanceRecords,
  type ShiftActionPayload,
} from '../api/attendance';
import { calculateWorkedTime, getShiftStateFromRecords } from '../utils/shiftTime';

type ShiftState = 'idle' | 'active' | 'paused' | 'finished';

type ShiftTimeline = {
  startedAt: Date | null;
  pausedAt: Date | null;
  resumedAt: Date | null;
  endedAt: Date | null;
};

const HomeScreenEmployee = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();

  const currentDayData = useMemo(() => {
    const now = new Date();
    const dayName = new Intl.DateTimeFormat('he-IL', { weekday: 'long' }).format(now);
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);

    return {
      dayName,
      formattedDate: `${day}/${month}/${year}`,
      isoDate: `${now.getFullYear()}-${month}-${day}`,
    };
  }, []);

  // Fetch today's attendance records
  const {
    data: attendanceRecords,
    isLoading: isLoadingAttendance,
    refetch: refetchAttendance,
  } = useQuery({
    queryKey: ['attendance', user?.id, currentDayData.isoDate],
    queryFn: () => {
      if (!user?.id) throw new Error('User ID is required');
      return fetchAttendanceRecords(user.id, currentDayData.isoDate);
    },
    enabled: !!user?.id,
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  const fallbackRegion = useMemo<MapRegion>(
    () => ({
      latitude: 32.0853,
      longitude: 34.7818,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    }),
    []
  );

  const [locationRegion, setLocationRegion] = useState<MapRegion | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      try {
        setIsFetchingLocation(true);
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) {
          throw new Error('Failed to fetch location');
        }
        const data = await response.json();
        if (!isMounted) return;

        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
          setLocationRegion({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: 0.045,
            longitudeDelta: 0.045,
          });
          setLocationError(null);
        } else {
          setLocationError('לא הצלחנו לאתר את המיקום לפי ה-IP שלך.');
        }
      } catch (error) {
        if (!isMounted) return;
        setLocationError('לא ניתן לטעון את המיקום כרגע. נסה שוב מאוחר יותר.');
      } finally {
        if (isMounted) {
          setIsFetchingLocation(false);
        }
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedRegion = locationRegion ?? fallbackRegion;

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  const [shiftState, setShiftState] = useState<ShiftState>('idle');
  const [timeline, setTimeline] = useState<ShiftTimeline>({
    startedAt: null,
    pausedAt: null,
    resumedAt: null,
    endedAt: null,
  });
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const formatTime = useCallback((date: Date | null) => (date ? timeFormatter.format(date) : null), [timeFormatter]);

  // Sync local state with server data on mount and when records change
  useEffect(() => {
    if (attendanceRecords && attendanceRecords.length > 0) {
      const serverState = getShiftStateFromRecords(attendanceRecords);
      // Always sync to 'finished' if server says finished (shift ended)
      if (serverState === 'finished') {
        setShiftState('finished');
      }
      // Only sync to active/paused if we're in idle/finished state (app just opened or shift ended)
      // This prevents overriding user actions that are in progress
      else if ((shiftState === 'idle' || shiftState === 'finished') && serverState !== 'idle') {
        setShiftState(serverState);
      }
    } else if (attendanceRecords && attendanceRecords.length === 0 && shiftState !== 'idle') {
      // If no records and we're not idle, reset to idle
      setShiftState('idle');
    }
  }, [attendanceRecords, shiftState]);

  // Calculate worked time from records
  const workedTimeMs = useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return 0;
    }
    return calculateWorkedTime(attendanceRecords, currentTime);
  }, [attendanceRecords, currentTime]);

  // Update timer every second when shift is active
  useEffect(() => {
    if (shiftState === 'active') {
      intervalRef.current = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Update once when paused to show frozen time
      if (shiftState === 'paused') {
        setCurrentTime(new Date());
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [shiftState]);

  // Handle app state changes to recalculate time when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, update time and refetch attendance
        setCurrentTime(new Date());
        if (user?.id) {
          refetchAttendance();
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [refetchAttendance, user?.id]);

  const shiftActionMutation = useMutation({
    mutationFn: recordShiftAction,
    onMutate: () => {
      setAttendanceError(null);
    },
    onSuccess: () => {
      setAttendanceError(null);
      // Invalidate and refetch attendance records after action
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ['attendance', user.id] });
      }
    },
    onError: (error) => {
      setAttendanceError(extractAttendanceErrorMessage(error));
    },
  });

  const handleStartShift = () => {
    if (!user) return;

    const now = new Date();
    const payload: ShiftActionPayload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      action: 'start',
      timestamp: now.toISOString(),
    };

    shiftActionMutation.mutate(payload, {
      onSuccess: () => {
        setShiftState('active');
        setTimeline({
          startedAt: now,
          pausedAt: null,
          resumedAt: null,
          endedAt: null,
        });
      },
    });
  };

  const handleTogglePause = () => {
    if (!user) return;

    const now = new Date();
    const action: 'pause' | 'resume' = shiftState === 'active' ? 'pause' : 'resume';
    const payload: ShiftActionPayload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      action,
      timestamp: now.toISOString(),
    };

    shiftActionMutation.mutate(payload, {
      onSuccess: () => {
        if (shiftState === 'active') {
          setShiftState('paused');
          setTimeline((prev) => ({
            ...prev,
            pausedAt: now,
            resumedAt: null,
          }));
        } else if (shiftState === 'paused') {
          setShiftState('active');
          setTimeline((prev) => ({
            ...prev,
            resumedAt: now,
          }));
        }
      },
    });
  };

  const handleEndShift = () => {
    if (!user) return;

    const now = new Date();
    const payload: ShiftActionPayload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      action: 'stop',
      timestamp: now.toISOString(),
    };

    shiftActionMutation.mutate(payload, {
      onSuccess: () => {
        setShiftState('finished');
        setTimeline((prev) => ({
          ...prev,
          endedAt: now,
        }));
      },
    });
  };

  const shiftStatusMessage = useMemo(() => {
    switch (shiftState) {
      case 'idle':
        return 'כדי להתחיל את המשמרת שלך, לחץ על "התחל משמרת".';
      case 'active':
        return 'המשמרת פעילה. תוכל לבחור בהשהייה אם אתה יוצא להפסקה.';
      case 'paused':
        return 'המשמרת בהשהייה. כשתהיה מוכן לחזור, לחץ על "חזרה לעבודה".';
      case 'finished':
        return 'המשמרת הסתיימה. תוכל להתחיל משמרת חדשה בכל רגע.';
      default:
        return '';
    }
  }, [shiftState]);

  const lastEvent = useMemo(() => {
    if (shiftState === 'finished' && timeline.endedAt) {
      return {
        label: 'משמרת הסתיימה בשעה',
        time: formatTime(timeline.endedAt),
      };
    }

    if (shiftState === 'paused' && timeline.pausedAt) {
      return {
        label: 'השהייה החלה בשעה',
        time: formatTime(timeline.pausedAt),
      };
    }

    if (shiftState === 'active') {
      if (timeline.resumedAt) {
        return {
          label: 'חזרת לעבודה בשעה',
          time: formatTime(timeline.resumedAt),
        };
      }

      if (timeline.startedAt) {
        return {
          label: 'משמרת התחילה בשעה',
          time: formatTime(timeline.startedAt),
        };
      }
    }

    return null;
  }, [formatTime, shiftState, timeline.endedAt, timeline.pausedAt, timeline.resumedAt, timeline.startedAt]);

  const pauseResumeLabel = shiftState === 'paused' ? 'חזרה לעבודה' : 'השהייה';
  const pauseResumeIcon = shiftState === 'paused' ? (
    <Feather name="play-circle" size={24} color="#ffffff" />
  ) : (
    <Feather name="pause-circle" size={24} color="#ffffff" />
  );
  const showStartButton = shiftState === 'idle' || shiftState === 'finished';
  const showPauseButton = shiftState === 'active' || shiftState === 'paused';
  const isPending = shiftActionMutation.isPending;

  const canNavigateHome = user?.role !== 'assistant_employee';

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.container}>
          <Text style={styles.devLabel}>HomeScreenEmployee</Text>
          <View style={styles.header}>
            <Pressable
              onPress={canNavigateHome ? () => navigation.navigate('Home') : undefined}
              disabled={!canNavigateHome}
              style={({ pressed }) => [
                styles.dateGroup,
                pressed && canNavigateHome && styles.dateGroupPressed,
              ]}
            >
              <Text style={styles.dateTitle}>{currentDayData.dayName}</Text>
              <Text style={styles.dateSubtitle}>{currentDayData.formattedDate}</Text>
            </Pressable>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerBadge}>ניהול עובדים</Text>
              <Text style={styles.headerTitle}>
                ברוך הבא, {user?.name ?? user?.email ?? 'משתמש'}
              </Text>
              {user?.email ? <Text style={styles.headerSubtitle}>{user.email}</Text> : null}
            </View>
          </View>

          {/* <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>המיקום הנוכחי שלך</Text>
            <EmployeeLocationMap
              region={resolvedRegion}
              loading={isFetchingLocation}
              overlayText="טוען מיקום לפי ה-IP שלך..."
              containerStyle={styles.mapContainer}
            />
            {locationError ? <Text style={styles.mapError}>{locationError}</Text> : null}
          </View> */}

          <View style={styles.shiftSection}>
            {(shiftState === 'active' || shiftState === 'paused') && (
              <WorkingTimeTimer milliseconds={workedTimeMs} isActive={shiftState === 'active'} />
            )}

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>ניהול משמרת</Text>
              <Text style={styles.sectionDescription}>{shiftStatusMessage}</Text>
              {attendanceError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{attendanceError}</Text>
                </View>
              ) : null}
              {lastEvent?.time ? (
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeLabel}>{lastEvent.label}</Text>
                  <Text style={styles.eventBadgeTime}>{lastEvent.time}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.actions}>
              {showStartButton ? (
                <GradientButton
                  label="התחל משמרת"
                  onPress={handleStartShift}
                  colors={['#14B8A6', '#457B9D']}
                  containerStyle={styles.actionButtonContainer}
                  buttonStyle={styles.actionButton}
                  icon={<Feather name="play-circle" size={24} color="#ffffff" />}
                  iconPosition="right"
                  disabled={isPending}
                />
              ) : null}

              {showPauseButton ? (
                <GradientButton
                  label={pauseResumeLabel}
                  onPress={handleTogglePause}
                  colors={['#FF6B4D', '#E85A3F']}
                  containerStyle={styles.actionButtonContainer}
                  buttonStyle={styles.actionButton}
                  icon={pauseResumeIcon}
                  iconPosition="right"
                  disabled={isPending}
                />
              ) : null}

              {showPauseButton ? (
                <GradientButton
                  label="סיום משמרת"
                  onPress={handleEndShift}
                  colors={['#FF6B4D', '#E85A3F']}
                  containerStyle={styles.actionButtonContainer}
                  buttonStyle={styles.actionButton}
                  icon={<Feather name="stop-circle" size={24} color="#ffffff" />}
                  iconPosition="right"
                  disabled={isPending}
                />
              ) : null}
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
  devLabel: {
    alignSelf: 'flex-end',
    color: '#94A3B8',
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
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
  sectionCard: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 28,
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
  sectionTitle: {
    textAlign: 'right',
    color: '#1e293b',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionDescription: {
    textAlign: 'right',
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
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
    marginTop: 24,
    alignItems: 'center',
    paddingBottom: 24,
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
  mapSection: {
    marginBottom: 28,
    gap: 12,
  },
  mapContainer: {
    shadowColor: '#020617',
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  mapError: {
    textAlign: 'right',
    color: '#fca5a5',
    fontSize: 12,
  },
  shiftSection: {
    gap: 24,
    marginBottom: 12,
  },
  timerSection: {
    marginBottom: 24,
  },
  actions: {
    gap: 14,
    marginTop: 12,
  },
  actionButtonContainer: {
    borderRadius: 16,
    shadowOpacity: 0.22,
  },
  actionButton: {
    borderRadius: 16,
    paddingVertical: 14,
  },
  eventBadge: {
    marginTop: 18,
    alignItems: 'flex-end',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  eventBadgeLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  eventBadgeTime: {
    color: '#457B9D',
    fontSize: 18,
    fontWeight: '700',
  },
  errorContainer: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF5F3',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD4C4',
  },
  errorText: {
    textAlign: 'right',
    color: '#E85A3F',
    fontSize: 13,
    lineHeight: 18,
  },
});

export default HomeScreenEmployee;


