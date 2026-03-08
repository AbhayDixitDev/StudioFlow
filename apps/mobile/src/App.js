import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import OfflineBanner from './components/OfflineBanner';
import useNetworkStatus from './hooks/useNetworkStatus';
import useAppStore from './stores/useAppStore';
import HomeScreen from './screens/HomeScreen';
import SeparatorScreen from './screens/SeparatorScreen';
import ConverterScreen from './screens/ConverterScreen';
import CutterScreen from './screens/CutterScreen';
import SettingsScreen from './screens/SettingsScreen';
import AuthScreen from './screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  Separator: ['git-branch', 'git-branch-outline'],
  Converter: ['swap-horizontal', 'swap-horizontal-outline'],
  Cutter: ['cut', 'cut-outline'],
  Settings: ['settings', 'settings-outline'],
};

function TabNavigator() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = TAB_ICONS[route.name];
          return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="Separator" component={SeparatorScreen} options={{ tabBarLabel: 'Separate' }} />
      <Tab.Screen name="Converter" component={ConverterScreen} options={{ tabBarLabel: 'Convert' }} />
      <Tab.Screen name="Cutter" component={CutterScreen} options={{ tabBarLabel: 'Cut' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

function AppContent() {
  const { isDark, colors } = useTheme();
  const { isOnline } = useNetworkStatus();
  const loadJobs = useAppStore((s) => s.loadJobs);

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <NavigationContainer
      theme={{
        ...(isDark ? DarkTheme : DefaultTheme),
        dark: isDark,
        colors: {
          ...(isDark ? DarkTheme : DefaultTheme).colors,
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <OfflineBanner visible={!isOnline} />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Auth"
            component={AuthScreen}
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}
