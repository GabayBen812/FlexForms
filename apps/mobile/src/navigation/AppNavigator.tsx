import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '../providers/AuthProvider';
import HomeScreen from '../screens/HomeScreen';
import HomeScreenEmployee from '../screens/HomeScreenEmployee';
import HomeScreenParent from '../screens/HomeScreenParent';
import HomeScreenVer2 from '../screens/HomeScreenVer2';
import LoginScreen from '../screens/LoginScreen';
import MyTasksScreen from '../screens/MyTasksScreen';
import EmployeesPage from '../screens/EmployeesPage';
import ChatPage from '../screens/ChatPage';
import KidsPage from '../screens/KidsPage';
import KidDetailsPage from '../screens/KidDetailsPage';
import ParentDetailsPage from '../screens/ParentDetailsPage';
import MessagesPage from '../screens/MessagesPage';
import FinancePage from '../screens/FinancePage';
import PaymentPage from '../screens/PaymentPage';
import IncomeListPage from '../screens/IncomeListPage';
import ExpensesListPage from '../screens/ExpensesListPage';
import CoursesPage from '../screens/CoursesPage';
import CourseAttendancePage from '../screens/CourseAttendancePage';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  MyTasks: undefined;
  EmployeesPage: undefined;
  HomeVer2: undefined;
  HomeEmployee: undefined;
  ChatPage: undefined;
  KidsPage: undefined;
  MessagesPage: undefined;
  FinancePage: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  HomeVer2: undefined;
  HomeEmployee: undefined;
  HomeParent: undefined;
  MyTasks: undefined;
  EmployeesPage: undefined;
  CoursesPage: undefined;
  CourseAttendancePage: { courseId: string };
  KidDetails: { kidId: string };
  ParentDetails: { parentId: string };
};

export type KidsStackParamList = {
  KidsPage: undefined;
  KidDetails: { kidId: string };
  ParentDetails: { parentId: string };
};

export type MessagesStackParamList = {
  MessagesPage: undefined;
  ChatPage: { groupId: string; groupName: string };
};

export type FinanceStackParamList = {
  FinancePage: undefined;
  PaymentPage: undefined;
  IncomeList: undefined;
  ExpensesList: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const KidsStack = createNativeStackNavigator<KidsStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();
const FinanceStack = createNativeStackNavigator<FinanceStackParamList>();
const Tab = createBottomTabNavigator();

const LoadingScreen = () => (
  <View className="flex-1 items-center justify-center bg-white">
    <ActivityIndicator size="large" />
  </View>
);

// Home Stack Navigator
const HomeStackNavigator = () => {
  const { user } = useAuth();
  const isParent = user?.role === 'parent';

  return (
    <HomeStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isParent ? 'HomeParent' : 'Home'}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="HomeParent" component={HomeScreenParent} />
      <HomeStack.Screen name="HomeVer2" component={HomeScreenVer2} />
      <HomeStack.Screen name="HomeEmployee" component={HomeScreenEmployee} />
      <HomeStack.Screen name="MyTasks" component={MyTasksScreen} />
      <HomeStack.Screen name="EmployeesPage" component={EmployeesPage} />
      <HomeStack.Screen name="CoursesPage" component={CoursesPage} />
      <HomeStack.Screen name="CourseAttendancePage" component={CourseAttendancePage} />
      <HomeStack.Screen name="KidDetails" component={KidDetailsPage} />
      <HomeStack.Screen name="ParentDetails" component={ParentDetailsPage} />
    </HomeStack.Navigator>
  );
};

// Kids Stack Navigator
const KidsStackNavigator = () => (
  <KidsStack.Navigator screenOptions={{ headerShown: false }}>
    <KidsStack.Screen name="KidsPage" component={KidsPage} />
    <KidsStack.Screen name="KidDetails" component={KidDetailsPage} />
    <KidsStack.Screen name="ParentDetails" component={ParentDetailsPage} />
  </KidsStack.Navigator>
);

// Messages Stack Navigator
const MessagesStackNavigator = () => (
  <MessagesStack.Navigator screenOptions={{ headerShown: false }}>
    <MessagesStack.Screen name="MessagesPage" component={MessagesPage} />
    <MessagesStack.Screen name="ChatPage" component={ChatPage} />
  </MessagesStack.Navigator>
);

// Finance Stack Navigator
const FinanceStackNavigator = () => {
  const { user } = useAuth();
  const isParent = user?.role === 'parent';

  return (
    <FinanceStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isParent ? 'PaymentPage' : 'FinancePage'}
    >
      <FinanceStack.Screen name="FinancePage" component={FinancePage} />
      <FinanceStack.Screen name="PaymentPage" component={PaymentPage} />
      <FinanceStack.Screen name="IncomeList" component={IncomeListPage} />
      <FinanceStack.Screen name="ExpensesList" component={ExpensesListPage} />
    </FinanceStack.Navigator>
  );
};

// Main Tab Navigator
const MainTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarShowLabel: true, // Ensure labels are always shown on mobile
      tabBarActiveTintColor: '#457B9D',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarLabelStyle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
      },
      tabBarStyle: {
        height: 90,
        paddingBottom: 8,
        paddingTop: 8,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 0,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000000',
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
        elevation: 10,
      },
      tabBarItemStyle: {
        paddingVertical: 4,
      },
    }}
  >
    <Tab.Screen
      name="HomeTab"
      component={HomeStackNavigator}
      options={{
        tabBarLabel: 'דף הבית',
        tabBarIcon: ({ focused, color }) => (
          <Feather name="home" size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="KidsTab"
      component={KidsStackNavigator}
      options={{
        tabBarLabel: 'ילדים',
        tabBarIcon: ({ focused, color }) => (
          <Feather name="users" size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="MessagesTab"
      component={MessagesStackNavigator}
      options={{
        tabBarLabel: 'הודעות',
        tabBarIcon: ({ focused, color }) => (
          <Feather name="message-circle" size={26} color={color} />
        ),
      }}
    />
    <Tab.Screen
      name="FinanceTab"
      component={FinanceStackNavigator}
      options={{
        tabBarLabel: 'כספים',
        tabBarIcon: ({ focused, color }) => (
          <Feather name="credit-card" size={26} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  const { user, isLoadingUser } = useAuth();

  if (isLoadingUser) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {user ? (
        user.role === 'assistant_employee' ? (
          // For assistant_employee, use a simplified stack without tabs
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HomeEmployee" component={HomeScreenEmployee} />
            <Stack.Screen name="MyTasks" component={MyTasksScreen} />
            <Stack.Screen name="ChatPage" component={ChatPage} />
            <Stack.Screen name="KidsPage" component={KidsPage} />
          </Stack.Navigator>
        ) : (
          // For regular users, use the tab navigator
          <MainTabNavigator />
        )
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
