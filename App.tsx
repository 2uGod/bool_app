import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import FindAccountScreen from './src/screens/FindAccountScreen';
import MainCameraScreen from './src/screens/MainCameraScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import ReportDetailScreen from './src/screens/ReportDetailScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 메인 탭 네비게이터
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#FF4500',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e0e0e0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        headerStyle: {
          backgroundColor: '#FF4500',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Detection"
        component={MainCameraScreen}
        options={{
          tabBarLabel: '화재 감지',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color }]}>🔥</Text>
            </View>
          ),
          headerTitle: 'BOOL 화재 감지',
        }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{
          tabBarLabel: '신고 내역',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color }]}>📋</Text>
            </View>
          ),
          headerTitle: '신고 내역',
        }}
      />
      <Tab.Screen
        name="MyPage"
        component={MyPageScreen}
        options={{
          tabBarLabel: '마이페이지',
          tabBarIcon: ({ color }) => (
            <View style={styles.iconContainer}>
              <Text style={[styles.icon, { color }]}>👤</Text>
            </View>
          ),
          headerTitle: '마이페이지',
        }}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      setIsLoggedIn(!!token);
    } catch (error) {
      console.error('Error checking login status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4500" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isLoggedIn ? 'Main' : 'Login'}
          screenOptions={{
            headerShown: false,
          }}
        >
          {/* Auth Stack */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="FindAccount" component={FindAccountScreen} />

          {/* Main Stack */}
          <Stack.Screen name="Main" component={MainTabs} />

          {/* Detail Screens */}
          <Stack.Screen name="ReportDetail" component={ReportDetailScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />

          {/* Settings Stack */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              headerShown: true,
              headerTitle: '설정',
              headerStyle: { backgroundColor: '#FF4500' },
              headerTintColor: '#fff',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
});

export default App;
