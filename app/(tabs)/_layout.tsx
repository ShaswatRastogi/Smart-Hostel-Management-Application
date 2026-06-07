import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { useRouter, useSegments, withLayoutContext } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../utils/ThemeContext';

const { Navigator } = createMaterialTopTabNavigator();

export const MaterialTopTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

const AnimatedIcon = ({ name, focused, color }: { name: any, focused: boolean, color: string }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(focused ? 1.2 : 1, { mass: 0.5, damping: 10, stiffness: 150 }) }
      ],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <MaterialCommunityIcons name={name} size={24} color={color} />
    </Animated.View>
  );
};

const _layout = () => {
  const { colors, isDark } = useTheme();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  const themeBg = isDark ? '#000000' : '#F8FAFC';
  const tabBg = isDark ? '#000000' : '#FFFFFF';
  const tabActiveText = isDark ? '#FFFFFF' : '#111111';
  const tabInactiveText = isDark ? '#555555' : '#A1A1AA';
  const tabShadow = isDark ? '#000000' : '#E2E8F0';
  const tabBorder = isDark ? 'transparent' : 'rgba(0,0,0,0.05)';

  useEffect(() => {
    if (!isLoading) {
      const inTabs = segments[0] === '(tabs)';
      if (inTabs && (!user || user.role !== 'student')) {
        router.replace('/login');
      }
    }
  }, [user, isLoading, segments, router]);

  if (isLoading || (!user || user.role !== 'student')) {
    return <View style={{ flex: 1, backgroundColor: themeBg }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: themeBg }}>
      <MaterialTopTabs
        tabBarPosition="bottom"
        screenOptions={{
          tabBarActiveTintColor: tabActiveText,
          tabBarInactiveTintColor: tabInactiveText,
          tabBarStyle: {
            backgroundColor: tabBg,
            position: 'absolute',
            bottom: 16,
            left: 24,
            right: 24,
            borderRadius: 32,
            height: 60,
            borderTopWidth: isDark ? 0 : 1,
            borderWidth: isDark ? 0 : 1,
            borderColor: tabBorder,
            elevation: isDark ? 8 : 4,
            shadowColor: tabShadow,
            shadowOpacity: isDark ? 0.4 : 1,
            shadowRadius: isDark ? 16 : 8,
            shadowOffset: { width: 0, height: 4 },
            justifyContent: 'center',
            paddingBottom: 0,
          },
          tabBarIndicatorStyle: {
            height: 0,
            backgroundColor: 'transparent',
          },
          tabBarLabelStyle: {
            fontSize: 9,
            fontWeight: '600',
            textTransform: 'capitalize',
            marginTop: -3,
            marginBottom: 3,
            letterSpacing: 0.2,
          },
          swipeEnabled: true,
          animationEnabled: true,
        }}
      >
        <MaterialTopTabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color }) => (
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            )
          }}
        />

        <MaterialTopTabs.Screen
          name="emergency"
          options={{
            title: 'Emergency',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon name={focused ? "phone-alert" : "phone-alert-outline"} focused={focused} color={color} />
            )
          }}
        />

        <MaterialTopTabs.Screen
          name="payments"
          options={{
            title: 'Payments',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon name={focused ? "wallet" : "wallet-outline"} focused={focused} color={color} />
            )
          }}
        />

        <MaterialTopTabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedIcon name={focused ? "cog" : "cog-outline"} focused={focused} color={color} />
            )
          }}
        />
      </MaterialTopTabs>
    </View>
  )
}

export default _layout