import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/providers/AuthProvider';
import { useNotifications } from './src/hooks/useNotifications';

const queryClient = new QueryClient();

function AppContent() {
  // Initialize notifications
  useNotifications();

  return (
    <View style={styles.appShell}>
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <GluestackUIProvider config={config}>
            <SafeAreaProvider>
              <AppContent />
              <StatusBar style="dark" />
            </SafeAreaProvider>
          </GluestackUIProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
});
