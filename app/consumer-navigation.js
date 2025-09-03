/**
 * Consumer App Navigation
 * Routes users through the simplified startup flow
 */

import React, { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Consumer screens
import ConsumerAuth from './consumer-auth';
import SimplifiedOnboarding from './simplified-onboarding';
import ConsumerDashboard from './consumer-dashboard';
import SubscriptionPlans from './subscription-plans';

// Existing screens (for Pro users who want advanced features)
import Chat from './(tabs)/chat';
import Training from './(tabs)/training';
import Settings from './settings';

import userAuthService from '../utils/userAuthService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app tabs for authenticated users
function MainAppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Training':
              iconName = focused ? 'school' : 'school-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
            default:
              iconName = 'circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6A0572',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={ConsumerDashboard}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="Chat" 
        component={Chat}
        options={{ tabBarLabel: 'AI Chat' }}
      />
      <Tab.Screen 
        name="Training" 
        component={Training}
        options={{ tabBarLabel: 'Train AI' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={Settings}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

// Main navigation component
export default function ConsumerAppNavigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
    
    // Listen for auth state changes
    const unsubscribe = userAuthService.addAuthListener((user) => {
      setIsAuthenticated(!!user);
      if (user) {
        checkOnboardingStatus();
      } else {
        setOnboardingCompleted(false);
      }
    });

    return unsubscribe;
  }, []);

  const checkAuthState = async () => {
    try {
      await userAuthService.initialize();
      const authStatus = await userAuthService.checkAuthStatus();
      
      setIsAuthenticated(authStatus.isAuthenticated);
      
      if (authStatus.isAuthenticated) {
        await checkOnboardingStatus();
      }

    } catch (_error) {
      console.error('Failed to check auth state');
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const profile = await userAuthService.getStoredUserProfile();
      setOnboardingCompleted(profile?.onboardingCompleted || false);
    } catch (_error) {
      setOnboardingCompleted(false);
    }
  };

  if (isLoading) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          cardStyle: { backgroundColor: 'transparent' }
        }}
      >
        {!isAuthenticated ? (
          // Authentication flow
          <Stack.Screen name="Auth" component={ConsumerAuth} />
        ) : !onboardingCompleted ? (
          // Onboarding flow
          <Stack.Screen name="Onboarding" component={SimplifiedOnboarding} />
        ) : (
          // Main app
          <>
            <Stack.Screen name="Main" component={MainAppTabs} />
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionPlans}
              options={{
                presentation: 'modal',
                headerShown: true,
                title: 'Subscription Plans',
                headerStyle: { backgroundColor: '#6A0572' },
                headerTintColor: '#FFFFFF'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Simple loading screen
function LoadingScreen() {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#6A0572'
    }}>
      <Text style={{
        fontSize: 60,
        marginBottom: 20
      }}>🤖</Text>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 10
      }}>AiReplica</Text>
      <Text style={{
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.8
      }}>Loading your AI assistant...</Text>
    </View>
  );
}
