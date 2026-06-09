import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  Pressable,
} from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomAlert, { AlertType } from '../components/CustomAlert';
import { useAuth } from '../context/AuthContext';
import { setStoredUser, isAdmin } from '../utils/authUtils';
import AppText from '../components/AppText';
import { getSecureToken, setSecureToken } from '../utils/tokenStorage';
import * as LocalAuthentication from 'expo-local-authentication';

// ─── Shimmer line component for input fields ───
function ShimmerLine() {
  const shimmer = useRef(new Animated.Value(0)).current;
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    // Smooth ping-pong sweep
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Beam width is 40% of line width.
  const beamWidth = lineWidth * 0.4;
  const maxTranslate = Math.max(0, lineWidth - beamWidth);

  // Animate strictly within the bounds of the line
  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxTranslate],
  });

  return (
    <View 
      style={shimmerStyles.track}
      onLayout={(e) => setLineWidth(e.nativeEvent.layout.width)}
    >
      {lineWidth > 0 && (
        <Animated.View
          style={[
            shimmerStyles.beam,
            {
              width: beamWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
    </View>
  );
}

const shimmerStyles = StyleSheet.create({
  track: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    borderRadius: 1,
  },
  beam: {
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 1,
  },
});

// ─── Main Login Component ───
export default function Login() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorMethod, setTwoFactorMethod] = useState<'app' | 'sms' | 'both'>('app');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Entrance animation for form
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;

  // Inline info box states
  const [showEmailInfo, setShowEmailInfo] = useState(false);
  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  // Input focus state for border highlight
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Custom Alert State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<AlertType>('info');

  const showAlert = (title: string, message: string, type: AlertType = 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  useEffect(() => {
    // Trigger entrance animation
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    console.log('📡 Google Sign-In Config:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Loaded' : 'MISSING');
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      offlineAccess: true,
    });
    checkBiometricAvailability();
  }, []);

  const [biometricSupported, setBiometricSupported] = useState(false);
  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricSupported(compatible && enrolled);
  };

  const handleBiometricLogin = async () => {
    try {
      const storedToken = await getSecureToken('userToken');
      if (!storedToken) {
        showAlert('Info', 'Please login with your password first to enable biometric login.', 'info');
        return;
      }
      
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SmartStay',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });

      if (auth.success) {
        setIsLoading(true);
        // We have a token securely decrypted. Just refresh the session
        await refreshUser();
        
        const { useSettingsStore } = await import('../store/useSettingsStore');
        await useSettingsStore.getState().loadSettings();
        const { onboardingCompleted } = useSettingsStore.getState();

        const { useAuthStore } = await import('../store/useAuthStore');
        const user = useAuthStore.getState().user;

        if (!onboardingCompleted) {
          router.replace('/onboarding');
          return;
        }

        if (user && isAdmin({ role: user.role })) {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (error) {
      console.error('Biometric failed:', error);
      showAlert('Error', 'Biometric login failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await GoogleSignin.hasPlayServices();
      
      // Force account picker by signing out first
      try {
        await GoogleSignin.signOut();
      } catch (e) {
        // Ignore errors if the user wasn't previously signed in
      }

      const userInfo: any = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken || userInfo.idToken;

      if (idToken) {
        console.log('Authenticating with backend...');

        // Call Backend API
        const { default: api } = await import('../utils/api');

        const response = await api.post('/auth/google', { 
          token: idToken,
          deviceName: Device.deviceName || Device.modelName || Platform.OS,
          appVersion: Application.nativeApplicationVersion || '1.0.0'
        });

        if (response.data.requiresTwoFactor) {
          setTempToken(response.data.tempToken);
          setTwoFactorMethod(response.data.method || 'app');
          setShow2FA(true);
          return;
        }

        const { user, token, refreshToken } = response.data;

        // Store Token securely
        await setSecureToken('userToken', token);
        if (refreshToken) await setSecureToken('refreshToken', refreshToken);

        // Store User Info
        await setStoredUser({
          id: user.id.toString(),
          name: user.fullName,
          role: user.role
        });

        await refreshUser();

        // Check Onboarding
        const { useSettingsStore } = await import('../store/useSettingsStore');
        await useSettingsStore.getState().loadSettings();
        const { onboardingCompleted } = useSettingsStore.getState();

        if (!onboardingCompleted) {
          router.replace('/onboarding');
          return;
        }

        // Navigate based on role
        if (isAdmin({ role: user.role })) {
          router.replace('/admin');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        showAlert('Google Sign-In', 'No account selected', 'warning');
      }
    } catch (e: any) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User cancelled login');
        showAlert('Login Cancelled', 'Google Sign-In was cancelled.', 'warning');
      } else if (e.code === statusCodes.IN_PROGRESS) {
        console.log('Login in progress');
      } else if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        showAlert('Error', 'Google Play Services not available', 'error');
      } else {
        console.log('Google Login Failed:', e.message);
        let message = e.response?.data?.error || 'Google Sign-In failed. Please try again.';
        
        // Ensure the exact requested phrasing is used if the backend says the user is not found
        if (e.response?.status === 404 || message.toLowerCase().includes('not found') || message.toLowerCase().includes('does not exist')) {
            message = 'Account not found for Google Sign-In.';
        }

        showAlert('Error', message, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (loginEmail = email, loginPassword = password) => {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      showAlert('Error', 'Please enter both email and password', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      // Dynamic imports
      const { default: api } = await import('../utils/api');
      const { setStoredUser } = await import('../utils/authUtils');

      console.log('Attempting login with:', loginEmail);
      const response = await api.post('/auth/login', {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword.trim(),
        deviceName: Device.deviceName || Device.modelName || Platform.OS,
        appVersion: Application.nativeApplicationVersion || '1.0.0'
      });

      if (response.data.requiresTwoFactor) {
        setTempToken(response.data.tempToken);
        setTwoFactorMethod(response.data.method || 'app');
        setShow2FA(true);
        return;
      }

      const { user, token, refreshToken } = response.data;

      // Store Token securely
      await setSecureToken('userToken', token);
      if (refreshToken) await setSecureToken('refreshToken', refreshToken);

      await setStoredUser({
        id: user.id.toString(),
        name: user.fullName || user.email,
        role: user.role
      });

      await refreshUser();

      // Check Onboarding
      const { useSettingsStore } = await import('../store/useSettingsStore');
      await useSettingsStore.getState().loadSettings();
      const { onboardingCompleted } = useSettingsStore.getState();

      if (!onboardingCompleted) {
        router.replace('/onboarding');
        return;
      }

      // Navigate
      if (isAdmin({ role: user.role })) {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }

    } catch (e: any) {
      console.log('Login Failed:', e.message);
      const message = (e.response?.status === 401 || e.response?.status === 400) ? 'Invalid email or password' : (e.response?.data?.error || 'Login failed. Please check your internet connection.');
      showAlert('Error', message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode || twoFactorCode.length < 6) {
      showAlert('Error', 'Please enter a valid 6-digit code', 'warning');
      return;
    }
    setIsLoading(true);
    try {
      const { default: api } = await import('../utils/api');
      
      const response = await api.post('/auth/login/verify-2fa', {
        tempToken,
        token: twoFactorCode,
        deviceName: Device.deviceName || Device.modelName || Platform.OS,
        appVersion: Application.nativeApplicationVersion || '1.0.0'
      });

      const { user, token, refreshToken } = response.data;

      await setSecureToken('userToken', token);
      if (refreshToken) await setSecureToken('refreshToken', refreshToken);

      await setStoredUser({
        id: user.id.toString(),
        name: user.fullName || user.email,
        role: user.role
      });

      await refreshUser();

      const { useSettingsStore } = await import('../store/useSettingsStore');
      await useSettingsStore.getState().loadSettings();
      const { onboardingCompleted } = useSettingsStore.getState();

      setShow2FA(false);

      if (!onboardingCompleted) {
        router.replace('/onboarding');
        return;
      }

      if (isAdmin({ role: user.role })) {
        router.replace('/admin');
      } else {
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      console.error('2FA Verify Error:', e);
      showAlert('Error', e.response?.data?.error || 'Invalid 2FA Code', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <CustomAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        onClose={() => setAlertVisible(false)}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Invisible Backdrop for closing tooltips when tapping outside */}
          {(showEmailInfo || showPasswordInfo) && (
            <Pressable
              style={[StyleSheet.absoluteFill, { zIndex: 5 }]}
              onPress={() => {
                setShowEmailInfo(false);
                setShowPasswordInfo(false);
              }}
            />
          )}

          {/* ── Header ── */}
          <View style={styles.header}>
            <AppText style={styles.brand}>SmartStay</AppText>
            <View style={styles.dividerAccent} />
            <AppText style={styles.tagline}>Sign in to continue</AppText>
          </View>

          {/* ── Form ── */}
          <Animated.View style={[styles.form, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <View style={[styles.labelRow, { zIndex: showEmailInfo ? 10 : 1 }]}>
                <AppText style={styles.label}>Email</AppText>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setShowEmailInfo(!showEmailInfo)}
                    style={styles.infoIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons name="help-circle-outline" size={14} color={showEmailInfo ? '#ffffff' : '#555555'} />
                  </TouchableOpacity>
                  {showEmailInfo && (
                    <View style={styles.tooltipWrapper}>
                      <View style={styles.tooltipArrow} />
                      <View style={styles.tooltipBox}>
                        <AppText style={styles.tooltipText}>
                          Your email is provided by your warden. Contact them if you need assistance.
                        </AppText>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.inputRow,
                  emailFocused && styles.inputRowFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="email-outline"
                  size={18}
                  color={emailFocused ? '#ffffff' : '#555555'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor="#444444"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
              {!emailFocused && <ShimmerLine />}
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={[styles.labelRow, { zIndex: showPasswordInfo ? 10 : 1 }]}>
                <AppText style={styles.label}>Password</AppText>
                <View style={{ position: 'relative', justifyContent: 'center' }}>
                  <TouchableOpacity 
                    onPress={() => setShowPasswordInfo(!showPasswordInfo)}
                    style={styles.infoIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialCommunityIcons name="help-circle-outline" size={14} color={showPasswordInfo ? '#ffffff' : '#555555'} />
                  </TouchableOpacity>
                  {showPasswordInfo && (
                    <View style={styles.tooltipWrapper}>
                      <View style={styles.tooltipArrow} />
                      <View style={styles.tooltipBox}>
                        <AppText style={styles.tooltipText}>
                          Your password is provided by your warden. Contact them if you need assistance.
                        </AppText>
                      </View>
                    </View>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.inputRow,
                  passwordFocused && styles.inputRowFocused,
                ]}
              >
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={18}
                  color={passwordFocused ? '#ffffff' : '#555555'}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#444444"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  onSubmitEditing={() => handleLogin()}
                />
                <View style={{ flexDirection: 'row', alignItems: 'center', position: 'absolute', right: 4, height: '100%' }}>
                  {biometricSupported && (
                    <TouchableOpacity 
                      onPress={handleBiometricLogin} 
                      style={{ padding: 12, marginRight: 4, opacity: 0.8 }}
                    >
                      <MaterialCommunityIcons name="fingerprint" size={26} color="#3B82F6" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#555555"
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {!passwordFocused && <ShimmerLine />}
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => handleLogin()}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#000000" size="small" />
              ) : (
                <AppText style={styles.loginBtnText}>Log In</AppText>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <AppText style={styles.dividerText}>or</AppText>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign In */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="google"
                size={18}
                color="#ffffff"
                style={{ marginRight: 10 }}
              />
              <AppText style={styles.googleBtnText}>
                Continue with Google
              </AppText>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── 2FA Modal ── */}
      <Modal visible={show2FA} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons
              name={
                twoFactorMethod === 'sms'
                  ? 'message-processing-outline'
                  : 'shield-lock-outline'
              }
              size={40}
              color="#ffffff"
              style={{ marginBottom: 16 }}
            />
            <AppText style={styles.modalTitle}>Two-Factor Auth</AppText>
            <AppText style={styles.modalDesc}>
              {twoFactorMethod === 'sms'
                ? 'Enter the 6-digit code sent to your phone.'
                : twoFactorMethod === 'both'
                ? 'Enter the 6-digit code from your authenticator app or phone.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </AppText>

            <TextInput
              style={styles.modalInput}
              placeholder="000000"
              placeholderTextColor="#444444"
              keyboardType="number-pad"
              maxLength={6}
              value={twoFactorCode}
              onChangeText={setTwoFactorCode}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setShow2FA(false)}
              >
                <AppText style={styles.modalBtnCancelText}>Cancel</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalBtnVerify}
                onPress={handleVerify2FA}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <AppText style={styles.modalBtnVerifyText}>Verify</AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },

  // ── Header ──
  header: {
    marginBottom: 52,
  },
  brand: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  dividerAccent: {
    width: 32,
    height: 2,
    backgroundColor: '#ffffff',
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 1,
  },
  tagline: {
    fontSize: 15,
    color: '#666666',
    letterSpacing: 0.3,
  },

  // ── Form ──
  form: {
    gap: 0,
  },
  fieldGroup: {
    marginBottom: 28,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoIcon: {
    marginLeft: 6,
    padding: 2,
  },
  tooltipWrapper: {
    position: 'absolute',
    left: 28, // Places it to the right of the icon
    flexDirection: 'row',
    alignItems: 'center',
    width: 220, // Fixed width so it wraps text neatly
    zIndex: 999, // Ensure it floats above the inputs below
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: '#111111', // Matches tooltip background
  },
  tooltipBox: {
    backgroundColor: '#111111',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipText: {
    fontSize: 11,
    color: '#888888',
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  inputRowFocused: {
    borderBottomColor: '#ffffff',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    height: '100%',
    letterSpacing: 0.3,
  },
  eyeBtn: {
    paddingLeft: 12,
    height: '100%',
    justifyContent: 'center',
  },

  // ── Login Button ──
  loginBtn: {
    height: 52,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
  },
  loginBtnText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#333333',
  },
  dividerText: {
    color: '#555555',
    fontSize: 12,
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },

  // ── Google Button ──
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  googleBtnText: {
    color: '#cccccc',
    fontSize: 15,
    fontWeight: '500',
  },

  // ── 2FA Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    width: '100%',
    height: 52,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    color: '#ffffff',
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnCancel: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalBtnCancelText: {
    color: '#888888',
    fontSize: 15,
    fontWeight: '600',
  },
  modalBtnVerify: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  modalBtnVerifyText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
