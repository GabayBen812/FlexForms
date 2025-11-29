import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GradientButton from '../components/ui/GradientButton';
import type { HomeStackParamList } from '../navigation/AppNavigator';

const MyTasksScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return (
    <LinearGradient colors={['#FFFFFF', '#F0FDFC', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.content}>
          <Text style={styles.title}>המשימות שלי</Text>
          <Text style={styles.subtitle}>כאן יוצגו המשימות שלך בעתיד.</Text>
          <GradientButton
            label="חזרה לדף הבית"
            onPress={() => navigation.navigate('Home')}
            colors={['#FF6B4D', '#457B9D', '#14B8A6']}
            containerStyle={styles.buttonContainer}
          />
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  buttonContainer: {
    width: '70%',
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(20, 184, 166, 0.08)',
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

export default MyTasksScreen;



