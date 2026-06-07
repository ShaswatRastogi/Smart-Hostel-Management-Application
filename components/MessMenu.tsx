import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useTheme } from '../utils/ThemeContext';
import AppText from './AppText';

interface MenuItem { dish: string; type: 'veg' | 'non-veg'; highlight?: boolean; }
interface WeekMenu { [key: string]: { breakfast?: MenuItem[]; lunch?: MenuItem[]; snacks?: MenuItem[]; dinner?: MenuItem[]; timings?: any; } }
interface MessMenuProps { initialDay?: string; highlightTarget?: string; }

export default function MessMenu({ initialDay, highlightTarget }: MessMenuProps) {
  const { isDark } = useTheme();

  const [fullMenu, setFullMenu] = useState<WeekMenu>({});
  const [selectedDay, setSelectedDay] = useState(initialDay || new Date().toLocaleString('en-US', { weekday: 'long' }));
  const [loading, setLoading] = useState(true);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayScrollRef = React.useRef<ScrollView>(null);
  const mainScrollRef = React.useRef<ScrollView>(null);
  const [mealLayouts, setMealLayouts] = useState<{ [key: string]: number }>({});

  const textMain = isDark ? '#FFFFFF' : '#111111';
  const textMuted = isDark ? '#888888' : '#64748B';
  const borderSubtle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const iconBoxBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const highlightBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
  const highlightBorder = isDark ? '#FFFFFF' : '#111111';
  const vegIcon = isDark ? '#FFFFFF' : '#111111';

  useEffect(() => { if (initialDay && days.includes(initialDay)) setSelectedDay(initialDay); }, [initialDay]);

  useEffect(() => {
    if (highlightTarget && mealLayouts[highlightTarget] && !loading) {
      setTimeout(() => { mainScrollRef.current?.scrollTo({ y: mealLayouts[highlightTarget], animated: true }); }, 500);
    }
  }, [highlightTarget, mealLayouts, loading, selectedDay]);

  const onMealLayout = (meal: string, event: any) => {
    const y = event.nativeEvent.layout.y;
    setMealLayouts(prev => ({ ...prev, [meal]: y }));
  };

  useEffect(() => { if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true); }, []);

  useEffect(() => {
    if (dayScrollRef.current) { const index = days.indexOf(selectedDay); dayScrollRef.current.scrollTo({ x: index * 90, animated: true }); }
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
        const dayName = dayRow.day;
        formattedMenu[dayName] = {};
        ['breakfast', 'lunch', 'snacks', 'dinner'].forEach(meal => {
          const rawMealData = dayRow[meal];
          if (rawMealData) {
            let items: MenuItem[] = [];
            if (Array.isArray(rawMealData)) items = rawMealData;
            else if (typeof rawMealData === 'string' && rawMealData.trim().startsWith('[')) {
              try { const parsed = JSON.parse(rawMealData); if (Array.isArray(parsed)) items = parsed; } catch (e) { items = [{ dish: rawMealData, type: 'veg' }]; }
            }
            else if (typeof rawMealData === 'string') {
              items = rawMealData.split(',').map((dish: string) => ({ dish: dish.trim(), type: 'veg' as 'veg' | 'non-veg', highlight: false })).filter(i => i.dish);
            }
            // @ts-ignore
            formattedMenu[dayName][meal] = items;
          }
        });
        if (dayRow.timings) {
          // @ts-ignore
          formattedMenu[dayName].timings = typeof dayRow.timings === 'string' ? JSON.parse(dayRow.timings) : dayRow.timings;
        }
      });
      setFullMenu(formattedMenu);
    } catch (error) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchMenu(); }, []);

  const getMealTimings = (mealType: string) => {
    // @ts-ignore
    return fullMenu[selectedDay]?.timings?.[mealType] || '';
  };

  return (
    <ScrollView ref={mainScrollRef} style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.daySelectorWrapper}>
        <ScrollView ref={dayScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.daySelector, { borderColor: borderSubtle }]}>
          {days.map((day) => (
            <Pressable key={day} onPress={() => setSelectedDay(day)} style={[styles.dayButton, selectedDay === day && [styles.selectedDay, { borderColor: textMain }]]}>
              <AppText style={[styles.dayText, selectedDay === day && { color: textMain }]}>{day.slice(0, 3)}</AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <GestureDetector gesture={swipeGestures}>
        <View style={styles.menuContainer}>
          <AppText style={[styles.currentDayTitle, { color: textMain }]}>{selectedDay}'s Menu</AppText>

          {loading ? (
            <ActivityIndicator size="large" color={textMain} style={{ marginTop: 20 }} />
          ) : (
            <>
              {['breakfast', 'lunch', 'snacks', 'dinner'].map((mealType) => (
                <View key={mealType} style={styles.mealSection} onLayout={(event) => onMealLayout(mealType, event)}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealTitleContainer}>
                      <View style={[styles.iconBox, { backgroundColor: iconBoxBg }]}>
                        <MaterialCommunityIcons name={getMealIcon(mealType) as any} size={24} color={textMain} />
                      </View>
                      <View>
                        <AppText style={[styles.mealType, { color: textMain }]}>{mealType.charAt(0).toUpperCase() + mealType.slice(1)}</AppText>
                        <AppText style={styles.timings}>{getMealTimings(mealType)}</AppText>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: borderSubtle }]} />

                  {/* @ts-ignore */}
                  {!fullMenu[selectedDay]?.[mealType]?.length ? (
                    <AppText style={{ color: '#666666', fontStyle: 'italic', fontSize: 13 }}>No menu available</AppText>
                  ) : (
                    // @ts-ignore
                    fullMenu[selectedDay][mealType].map((item: MenuItem, index: number) => (
                      <View key={index} style={[styles.menuItem, { borderColor: borderSubtle }, item.highlight && { backgroundColor: highlightBg, paddingHorizontal: 16, marginHorizontal: -16, borderRadius: 8, borderLeftWidth: 4, borderLeftColor: highlightBorder }]}>
                        <MaterialCommunityIcons name={item.type === 'veg' ? 'leaf' : 'food-drumstick'} size={16} color={item.type === 'veg' ? vegIcon : textMuted} />
                        <AppText style={[styles.menuItemText, { color: textMuted }, item.highlight && { color: textMain, fontWeight: '700' }]}>
                          {item.dish}
                          {item.highlight && <AppText>{"  "}<FontAwesome name="star" size={10} color="#F59E0B" /></AppText>}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  daySelectorWrapper: { marginBottom: 20, marginTop: 20 },
  daySelector: { paddingHorizontal: 24, gap: 24, borderBottomWidth: 1, marginBottom: 24 },
  dayButton: { paddingVertical: 16, alignItems: 'center' },
  selectedDay: { borderBottomWidth: 2, marginBottom: -1 },
  dayText: { color: '#666666', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  menuContainer: { paddingHorizontal: 24 },
  currentDayTitle: { fontSize: 24, fontWeight: '800', marginBottom: 32 },
  mealSection: { marginBottom: 40 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  mealType: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  timings: { fontSize: 13, color: '#888888', fontWeight: '600' },
  divider: { height: 1, marginVertical: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  menuItemText: { fontSize: 16, flex: 1, lineHeight: 24 },
});
