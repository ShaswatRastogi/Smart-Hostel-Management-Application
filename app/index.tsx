import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../components/AppText';

const { width, height } = Dimensions.get('window');

// Import the new brand logo
const LOGO_SOURCE = require('../assets/brand_icon.jpg');

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Simple navigation logic
    const navigate = async () => {
      // Wait 3 seconds then navigate
      await new Promise(r => setTimeout(r, 1500));

      try {
        const { setStoredUser } = await import('../utils/authUtils');
        await setStoredUser(null);
        router.replace('/login');
      } catch (error) {
        console.log("Error in splash navigation:", error);
        router.replace('/login');
      }
    };

    navigate();
  }, []);

  return (
    <View style={styles.container}>
      {/* BACKGROUND LAYERS */}
      <LinearGradient
        colors={['#000310', '#000924', '#001e50']}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <LinearGradient
        colors={['rgba(0, 210, 255, 0.1)', 'transparent']}
        style={[StyleSheet.absoluteFill, { top: -height * 0.2 }]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      {/* CONTENT LAYER - High Z-Index to prevent hiding */}
      <SafeAreaView style={styles.content}>

        <View style={styles.centerWrapper}>
          {/* Logo Container */}
          <View style={styles.logoWrapper}>
            <LinearGradient
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.01)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.borderStroke} />
            <Image
              source={LOGO_SOURCE}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>

          {/* Text Container */}
          <View style={styles.textContainer}>
            <AppText style={styles.title}>SMARTSTAY</AppText>
            <View style={styles.divider} />
            <AppText style={styles.subtitle}>The Future of Hostel Living</AppText>
          </View>
        </View>

      </SafeAreaView>

      <View style={styles.footer}>
        <AppText style={styles.version}>v2.0 Universal</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000428', // Fallback color
  },
  content: {
    flex: 1,
    zIndex: 100, // Force on top
    elevation: 100,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: height * 0.15,
  },
  logoWrapper: {
    width: width * 0.5,
    height: width * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative', // Ensure sizing works
  },
  borderStroke: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 210, 255, 0.25)',
  },
  logoImage: {
    width: '65%',
    height: '65%',
    zIndex: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: 4,
    textAlign: 'center',
  },
  divider: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(0, 210, 255, 0.5)',
    borderRadius: 1,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#90CAF9',
    letterSpacing: 1.5,
    fontWeight: '400',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
  },
  version: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    letterSpacing: 1,
  }
});
