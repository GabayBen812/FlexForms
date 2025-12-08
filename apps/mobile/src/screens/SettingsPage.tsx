import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';

import GradientButton from '../components/ui/GradientButton';
import { useAuth } from '../providers/AuthProvider';
import type { HomeStackParamList } from '../navigation/AppNavigator';
import { fetchOrganization } from '../api/organizations';
import { fetchSeasons } from '../api/seasons';
import { useFeatureFlag } from '../hooks/useFeatureFlag';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  // Fetch organization data
  const { data: organization, isLoading: isLoadingOrg } = useQuery({
    queryKey: ['organization'],
    queryFn: () => fetchOrganization(),
    enabled: !!user?.organizationId,
  });

  // Check if seasons feature flag is enabled
  const { isEnabled: showSeasons, isLoading: isLoadingFF } = useFeatureFlag('IS_SHOW_SEASONS');

  // Fetch seasons for displaying the current season
  const { data: seasons = [], isLoading: isLoadingSeasons } = useQuery({
    queryKey: ['seasons'],
    queryFn: fetchSeasons,
    enabled: showSeasons,
  });

  const handleBack = () => {
    navigation.goBack();
  };

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
          {/* Header with Back Button */}
          <View style={styles.header}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Feather name="arrow-right" size={24} color="#334155" />
            </Pressable>
            <Text style={styles.headerTitle}>הגדרות</Text>
            <View style={styles.backButtonPlaceholder} />
          </View>

          {/* Organization Name Card */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Feather name="home" size={24} color="#457B9D" />
              <Text style={styles.cardTitle}>שם הגן</Text>
            </View>
            {isLoadingOrg ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#64748B" />
              </View>
            ) : (
              <Text style={styles.organizationName}>
                {organization?.name || 'לא זמין'}
              </Text>
            )}
          </View>

          {/* Current Season Card */}
          {showSeasons && (
            <View style={styles.settingsCard}>
              <View style={styles.cardHeader}>
                <Feather name="calendar" size={24} color="#457B9D" />
                <Text style={styles.cardTitle}>עונה נוכחית</Text>
              </View>
              {isLoadingOrg ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#64748B" />
                </View>
              ) : (
                <Text style={styles.organizationName}>
                  {organization?.currentSeason?.name || 
                   seasons.find(s => s._id === organization?.currentSeasonId)?.name ||
                   'לא נבחרה עונה'}
                </Text>
              )}
            </View>
          )}

          {/* User Info Card */}
          <View style={styles.settingsCard}>
            <View style={styles.cardHeader}>
              <Feather name="user" size={24} color="#457B9D" />
              <Text style={styles.cardTitle}>פרטי משתמש</Text>
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userInfoLabel}>שם:</Text>
              <Text style={styles.userInfoValue}>{user?.name || 'לא זמין'}</Text>
            </View>
            {user?.email && (
              <View style={styles.userInfoContainer}>
                <Text style={styles.userInfoLabel}>אימייל:</Text>
                <Text style={styles.userInfoValue}>{user.email}</Text>
              </View>
            )}
            {user?.role && (
              <View style={styles.userInfoContainer}>
                <Text style={styles.userInfoLabel}>תפקיד:</Text>
                <Text style={styles.userInfoValue}>
                  {user.role === 'system_admin' ? 'מנהל' : 
                   user.role === 'parent' ? 'הורה' : 
                   user.role === 'assistant_employee' ? 'עובד' : user.role}
                </Text>
              </View>
            )}
          </View>

          {/* Logout Button */}
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
    paddingVertical: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  backButtonPlaceholder: {
    width: 44,
  },
  headerTitle: {
    color: '#1e293b',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  settingsCard: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
  },
  organizationName: {
    color: '#1e293b',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 8,
  },
  userInfoContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  userInfoLabel: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  userInfoValue: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'left',
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  logoutSection: {
    marginTop: 32,
    alignItems: 'center',
    paddingBottom: 24,
  },
  logoutContainer: {
    borderRadius: 14,
    shadowOpacity: 0.25,
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
  },
  logoutLabel: {
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

export default SettingsPage;

