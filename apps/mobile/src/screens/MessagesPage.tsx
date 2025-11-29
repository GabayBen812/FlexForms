import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const MessagesPage = () => {
  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF', '#FFFFFF']} style={styles.root}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.headerBadge}>הודעות</Text>
          <Text style={styles.headerTitle}>כל ההודעות</Text>
          <View style={styles.content}>
            <Text style={styles.placeholderText}>עמוד הודעות - יפותח בעתיד</Text>
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
    gap: 20,
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default MessagesPage;

