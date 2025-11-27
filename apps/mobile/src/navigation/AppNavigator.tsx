import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../providers/AuthProvider';
import HomeScreen from '../screens/HomeScreen';
import HomeScreenEmployee from '../screens/HomeScreenEmployee';
import HomeScreenVer2 from '../screens/HomeScreenVer2';
import LoginScreen from '../screens/LoginScreen';
import MyTasksScreen from '../screens/MyTasksScreen';
import EmployeesPage from '../screens/EmployeesPage';
import ChatPage from '../screens/ChatPage';
import KidsPage from '../screens/KidsPage';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MyTasks: undefined;
  EmployeesPage: undefined;
  HomeVer2: undefined;
  HomeEmployee: undefined;
  ChatPage: undefined;
  KidsPage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const LoadingScreen = () => (
  <View className="flex-1 items-center justify-center bg-white">
    <ActivityIndicator size="large" />
  </View>
);

export const AppNavigator = () => {
  const { user, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShadowVisible: false, headerTitleAlign: 'center' }}>
        {user ? (
          user.role === 'assistant_employee' ? (
            <>
              <Stack.Screen
                name="HomeEmployee"
                component={HomeScreenEmployee}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MyTasks"
                component={MyTasksScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatPage"
                component={ChatPage}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="KidsPage"
                component={KidsPage}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen
                name="HomeVer2"
                component={HomeScreenVer2}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="HomeEmployee"
                component={HomeScreenEmployee}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="MyTasks"
                component={MyTasksScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="EmployeesPage"
                component={EmployeesPage}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="ChatPage"
                component={ChatPage}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="KidsPage"
                component={KidsPage}
                options={{ headerShown: false }}
              />
            </>
          )
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;


