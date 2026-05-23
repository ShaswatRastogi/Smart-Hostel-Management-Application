import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

interface MenuItem {
  dish: string;
  type: 'veg' | 'non-veg';
  highlight?: boolean;
}

interface WeekMenu {
  [key: string]: {
    breakfast?: MenuItem[];
    lunch?: MenuItem[];
    snacks?: MenuItem[];
    dinner?: MenuItem[];
    timings?: any;
  }
}

interface MessMenuProps {
  initialDay?: string;
  highlightTarget?: string;
}

export default function MessMenu({ initialDay, highlightTarget }: MessMenuProps) {
  const { colors, theme } = useTheme();

  const [fullMenu, setFullMenu] = useState<WeekMenu>({});
  const [selectedDay, setSelectedDay] = useState(initialDay || new Date().toLocaleString('en-US', { weekday: 'long' }));
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayScrollRef = React.useRef<ScrollView>(null);
  const mainScrollRef = React.useRef<ScrollView>(null);
  const [mealLayouts, setMealLayouts] = useState<{ [key: string]: number }>({});

  // Update selected day if prop changes (deep link)
  useEffect(() => {
    if (initialDay && days.includes(initialDay)) {
      setSelectedDay(initialDay);
    }
  }, [initialDay]);

  // Scroll to target meal when layouts are ready and day matches
  useEffect(() => {
    if (highlightTarget && mealLayouts[highlightTarget] && !loading) {
      // Small delay to ensure render
      setTimeout(() => {
        mainScrollRef.current?.scrollTo({
          y: mealLayouts[highlightTarget],
          animated: true
        });
      }, 500);
    }
  }, [highlightTarget, mealLayouts, loading, selectedDay]);

  const onMealLayout = (meal: string, event: any) => {
    const y = event.nativeEvent.layout.y;
    setMealLayouts(prev => ({ ...prev, [meal]: y }));
  };

  useEffect(() => {
    if (Platform.OS === 'android') {
      if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
      }
    }
  }, []);

  useEffect(() => {
    if (dayScrollRef.current) {
      const index = days.indexOf(selectedDay);
      dayScrollRef.current.scrollTo({ x: index * 90, animated: true });
    }
  }, [selectedDay]);

  const changeDay = (direction: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const currentIndex = days.indexOf(selectedDay);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = days.length - 1;
    if (nextIndex >= days.length) nextIndex = 0;
    setSelectedDay(days[nextIndex]);
  };

  const swipeGestures = React.useMemo(() => {
    const left = Gesture.Fling().direction(Directions.LEFT).onEnd(() => runOnJS(changeDay)(1));
    const right = Gesture.Fling().direction(Directions.RIGHT).onEnd(() => runOnJS(changeDay)(-1));
    return Gesture.Race(left, right);
  }, [selectedDay]);

  const fetchMenu = async () => {
    try {
      const { default: api } = await import('../utils/api');
      const response = await api.get('/services/mess');

      const rawData = response.data;
      const formattedMenu: WeekMenu = {};

      rawData.forEach((dayRow: any) => {
        const dayName = dayRow.day; // "Monday"
        formattedMenu[dayName] = {};

        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
          const rawMealData = dayRow[meal];
          if (rawMealData) {
            let items: MenuItem[] = [];

            // Case 1: Already an array (JSONB support)
            if (Array.isArray(rawMealData)) {
              items = rawMealData;
            }
            // Case 2: Stringified JSON (e.g. '[{"dish":"Dal","type":"veg"}]')
            else if (typeof rawMealData === 'string' && rawMealData.trim().startsWith('[')) {
              try {
                const parsed = JSON.parse(rawMealData);
                if (Array.isArray(parsed)) items = parsed;
              } catch (e) {
                // Fallback if parse fails
                items = [{ dish: rawMealData, type: 'veg' }];
              }
            }
            // Case 3: Legacy Comma-Separated String
            else if (typeof rawMealData === 'string') {
              items = rawMealData.split(',').map((dish: string) => ({
                dish: dish.trim(),
                type: 'veg' as 'veg' | 'non-veg',
                highlight: false
              })).filter(i => i.dish);
            }

            // @ts-ignore
            formattedMenu[dayName][meal] = items;
          }
        });

        // Map timings if present (backend should send them)
        if (dayRow.timings) {
          // @ts-ignore
          formattedMenu[dayName].timings = typeof dayRow.timings === 'string' ? JSON.parse(dayRow.timings) : dayRow.timings;
        }
      });

      setFullMenu(formattedMenu);

    } catch (error) {
      console.error('Error fetching mess menu:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    daySelectorWrapper: {
      marginBottom: 20,
      marginTop: 20,
    },
    daySelector: {
      paddingHorizontal: 20,
      gap: 12,
      paddingBottom: 10, // For shadow
    },
    dayButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 24,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 70,
      alignItems: 'center',
    },
    selectedDay: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    dayText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
    selectedDayText: {
      color: 'white',
    },
    menuContainer: {
      paddingHorizontal: 20,
      gap: 16,
    },
    currentDayTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
      marginLeft: 4,
    },
    mealSection: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 16,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mealHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    mealTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mealType: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    timings: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 6,
    },
    menuItemText: {
      color: colors.textSecondary,
      fontSize: 14,
      flex: 1,
      lineHeight: 20,
    },
    shadowProp: {
      shadowColor: colors.textSecondary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 3,
    },
  }), [colors, theme]);

  const getMealTimings = (mealType: string) => {
    // @ts-ignore
    return fullMenu[selectedDay]?.timings?.[mealType] || '';
  };

  const isMenuLoadedForDay = (day: string) => {
    // @ts-ignore
    return fullMenu[day] !== undefined;
  }

  return (
    <ScrollView
      ref={mainScrollRef}
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Day Selector */}
      <View style={styles.daySelectorWrapper}>
        <ScrollView
          ref={dayScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daySelector}
        >
          {days.map((day) => (
            <Pressable
              key={day}
              onPress={() => setSelectedDay(day)}
              style={[
                styles.dayButton,
                selectedDay === day && styles.selectedDay,
                styles.shadowProp
              ]}
            >
              <AppText style={[
                styles.dayText,
                selectedDay === day && styles.selectedDayText
              ]}>
                {day.slice(0, 3)}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <GestureDetector gesture={swipeGestures}>
        <View style={styles.menuContainer}>
          <AppText style={styles.currentDayTitle}>{selectedDay}'s Menu</AppText>

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <>
              {['breakfast', 'lunch', 'snacks', 'dinner'].map((mealType) => (
                <View
                  key={mealType}
                  style={[styles.mealSection, styles.shadowProp]}
                  onLayout={(event) => onMealLayout(mealType, event)}
                >
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleContainer}>
                      <View style={[styles.iconBox, { backgroundColor: getMealColorBg(mealType, theme) }]}>
                        <MaterialCommunityIcons
                          name={getMealIcon(mealType) as any}
                          size={20}
                          color={getMealColor(mealType)}
                        />
                      </View>
                      <View>
                        <AppText style={styles.mealType}>
                          {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
                        </AppText>
                        <AppText style={styles.timings}>
                          {getMealTimings(mealType)}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* @ts-ignore */}
                  {!fullMenu[selectedDay]?.[mealType]?.length ? (
                    <AppText style={{ color: colors.textSecondary, fontStyle: 'italic', fontSize: 13 }}>No menu available</AppText>
                  ) : (
                    // @ts-ignore
                    fullMenu[selectedDay][mealType].map((item: MenuItem, index: number) => (
                      <View
                        key={index}
                        style={[
                          styles.menuItem,
                          item.highlight && { backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : '#FFFBEB', borderRadius: 8, marginHorizontal: -8, paddingHorizontal: 12, padding: 8, borderLeftWidth: 3, borderLeftColor: '#F59E0B' }
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={item.type === 'veg' ? 'circle-slice-8' : 'food-drumstick'}
                          size={14}
                          color={item.type === 'veg' ? '#10B981' : '#EF4444'}
                          style={{ marginTop: 2 }}
                        />
                        <AppText style={[
                          styles.menuItemText,
                          item.highlight && { color: colors.text, fontWeight: '500' }
                        ]}>
                          {item.dish}
                          {item.highlight && (
                            <AppText>
                              {"  "}
                              <FontAwesome name="star" size={10} color="#F59E0B" />
                            </AppText>
                          )}
                        </AppText>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </>
          )}
        </View>
      </GestureDetector>
    </ScrollView>
  );
}

const getMealIcon = (mealType: string) => {
  switch (mealType) {
    case 'breakfast': return 'coffee';
    case 'lunch': return 'food-variant';
    case 'snacks': return 'cookie';
    case 'dinner': return 'food-turkey';
    default: return 'food';
  }
};

const getMealColor = (mealType: string) => {
  switch (mealType) {
    case 'breakfast': return '#F59E0B'; // Orange
    case 'lunch': return '#EF4444';     // Red
    case 'snacks': return '#8B5CF6';    // Purple
    case 'dinner': return '#004e92';    // Blue
    default: return '#64748B';
  }
};

const getMealColorBg = (mealType: string, theme: string) => {
  if (theme === 'dark') {
    switch (mealType) {
      case 'breakfast': return 'rgba(245, 158, 11, 0.1)';
      case 'lunch': return 'rgba(239, 68, 68, 0.1)';
      case 'snacks': return 'rgba(139, 92, 246, 0.1)';
      case 'dinner': return 'rgba(59, 130, 246, 0.1)';
      default: return '#1E293B';
    }
  }
  switch (mealType) {
    case 'breakfast': return '#FFFBEB';
    case 'lunch': return '#FEF2F2';
    case 'snacks': return '#F5F3FF';
    case 'dinner': return '#EFF6FF';
    default: return '#F1F5F9';
  }
};
