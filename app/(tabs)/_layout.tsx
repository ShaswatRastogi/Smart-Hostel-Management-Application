import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {
  createMaterialTopTabNavigator,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import { useRouter, useSegments, withLayoutContext } from 'expo-router';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../utils/ThemeContext';
import * as Haptics from 'expo-haptics';

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

  const themeBg = isDark ? '#09090B' : '#FAFAFA';
  const tabActiveText = isDark ? '#FFFFFF' : '#111111';
  const tabInactiveText = isDark ? '#555555' : '#A1A1AA';
  const tabBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const solidTabBg = isDark ? '#111111' : '#FFFFFF';

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
        screenListeners={{
          state: (e) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          },
        }}
        screenOptions={{
          tabBarActiveTintColor: tabActiveText,
          tabBarInactiveTintColor: tabInactiveText,
          tabBarStyle: {
            backgroundColor: solidTabBg,
            position: 'absolute',
            bottom: 24,
            left: 16,
            right: 16,
            borderRadius: 32,
            height: 64,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: tabBorder,
            elevation: isDark ? 8 : 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            justifyContent: 'center',
            paddingBottom: 0,
          },
          tabBarIndicatorStyle: {
            height: 0,
            backgroundColor: 'transparent',
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'capitalize',
            marginTop: 0,
            marginBottom: 4,
            letterSpacing: 0.5,
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
              <AnimatedIcon name={focused ? 'home' : 'home-outline'} focused={focused} color={color} />
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

const styles = StyleSheet.create({});

export default _layout