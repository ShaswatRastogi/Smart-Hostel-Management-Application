import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAccessibilityStore } from '../store/useAccessibilityStore';
import { useAuthStore } from '../store/useAuthStore';

const FONT_SIZES = [
  { id: 'small', scale: 0.85 },
  { id: 'default', scale: 1.0 },
  { id: 'large', scale: 1.15 },
  { id: 'extra-large', scale: 1.3 },
];

export default function AppText({ style, ...props }: TextProps) {
  const { fontSize: selectedFontSize, boldText } = useAccessibilityStore();
  const user = useAuthStore(state => state.user);
  
  const isPublic = !user;
  const scale = isPublic ? 1.0 : (FONT_SIZES.find(s => s.id === selectedFontSize)?.scale || 1.0);
  const isBoldEnabled = isPublic ? false : boldText;

  const flatStyle = StyleSheet.flatten(style) || {};
  const dynamicStyle: any = {};

  // Apply scaling to fontSize
  if (flatStyle.fontSize !== undefined) {
    dynamicStyle.fontSize = flatStyle.fontSize * scale;
  } else if (scale !== 1.0) {
    dynamicStyle.fontSize = 14 * scale;
  }

  // Apply scaling to lineHeight if it exists
  if (flatStyle.lineHeight !== undefined) {
    dynamicStyle.lineHeight = flatStyle.lineHeight * scale;
  }

  // Apply global bolding
  if (isBoldEnabled) {
    const fw = flatStyle.fontWeight;
    if (fw === 'bold' || fw === '700' || fw === '800' || fw === '900') {
      dynamicStyle.fontWeight = '900';
    } else {
      dynamicStyle.fontWeight = '700';
    }
  }

  return <Text style={[style, dynamicStyle]} {...props} />;
}
