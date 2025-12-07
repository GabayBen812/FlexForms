import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Input, InputField, InputSlot } from '@gluestack-ui/themed';

import GradientButton from '../components/ui/GradientButton';
import { useAuth } from '../providers/AuthProvider';

const LoginScreen = () => {
  const { login, isLoggingIn, loginError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    console.log('[LoginScreen] handleSubmit called');
    if (!email.trim() || !password.trim()) {
      console.log('[LoginScreen] Validation failed - empty fields');
      setFormError('נא למלא אימייל וסיסמה');
      return;
    }

    console.log('[LoginScreen] Validation passed, calling login');
    setFormError(null);

    try {
      await login({ email: email.trim(), password });
      console.log('[LoginScreen] Login completed successfully');
    } catch (error) {
      console.log('[LoginScreen] Login catch block:', error);
      // errors handled via context state
    }
  };

  const errorMessage = formError ?? loginError;

  return (
    <LinearGradient colors={['#FFFFFF', '#FFF5F3', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.brandBadge}>
              <Text style={styles.brandText}>Paradize</Text>
              <View style={styles.brandIcon}>
                <Text style={styles.brandIconText}>⟆</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardChip}>
                <Text style={styles.cardChipText}>כניסה מאובטחת</Text>
              </View>

              <Text style={styles.title}>
                חיבור מאובטח ל-
                <Text style={styles.titleAccent}>Paradize</Text>
              </Text>
              <Text style={styles.subtitle}>
                השתמשו בפרטי המוסד והיכנסו אל מרכז השליטה העתידי שלכם.
              </Text>

              <View style={styles.fields}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>אימייל</Text>
                  <Input style={styles.glInput} isDisabled={false}>
                    <InputField
                      placeholder="admin@example.com"
                      placeholderTextColor="#9CA3AF"
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      returnKeyType="next"
                      style={styles.inputField}
                    />
                    <InputSlot style={styles.iconSlot}>
                      <Feather name="mail" size={18} color="#6B7280" />
                    </InputSlot>
                  </Input>
                </View>

                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>סיסמה</Text>
                  <Input style={styles.glInput}>
                    <InputField
                      placeholder="••••••••"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                      style={styles.inputField}
                    />
                    <InputSlot style={styles.iconSlot}>
                      <Feather name="lock" size={18} color="#6B7280" />
                    </InputSlot>
                  </Input>
                </View>

                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <GradientButton
                  label="התחברו"
                  loading={isLoggingIn}
                  onPress={handleSubmit}
                  colors={['#FF6B4D', '#457B9D', '#14B8A6']}
                  containerStyle={styles.ctaContainer}
                  labelStyle={styles.ctaLabel}
                  className="w-full"
                />
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerPrimary}>צריך עזרה? צוות התמיכה שלנו זמין 24/7 בטלפון, ווטסאפ וצ׳אט.</Text>
                <Text style={styles.footerSecondary}>גישה זמינה רק למשתמשים מאושרים באמצעות JWT.</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brandBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 28,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  brandText: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '600',
  },
  brandIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD4C4',
  },
  brandIconText: {
    color: '#FF6B4D',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 28 },
    elevation: 18,
  },
  cardChip: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFF5F3',
    borderColor: '#FFD4C4',
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 999,
  },
  cardChipText: {
    color: '#FF6B4D',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    marginTop: 28,
    color: '#1e293b',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'right',
  },
  titleAccent: {
    color: '#14B8A6',
  },
  subtitle: {
    marginTop: 10,
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'right',
  },
  fields: {
    marginTop: 32,
    gap: 20,
  },
  field: {
    gap: 10,
  },
  fieldLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  glInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
    paddingRight: 20,
    paddingLeft: 16,
    height: 56,
  },
  inputField: {
    flex: 1,
    color: '#1e293b',
    fontSize: 15,
    textAlign: 'right',
    paddingHorizontal: 12,
  },
  iconSlot: {
    marginLeft: 12,
  },
  ctaContainer: {
    marginTop: 6,
    height: 56,
    borderRadius: 999,
  },
  ctaLabel: {
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#E85A3F',
    textAlign: 'right',
    fontSize: 13,
  },
  footer: {
    marginTop: 36,
    alignItems: 'center',
    gap: 6,
  },
  footerPrimary: {
    color: '#475569',
    fontSize: 13,
    textAlign: 'center',
  },
  footerSecondary: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
  },
});

export default LoginScreen;


