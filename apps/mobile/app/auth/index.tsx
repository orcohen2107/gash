import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AuthScreenBackdrop, authSurfaceColor } from '@/components/auth/AuthScreenBackdrop'
import { welcomeScreenPaddingX } from '@/lib/responsiveLayout'

const SURFACE_CONTAINER = '#1a1a1a'
const ON_SURFACE = '#ffffff'
const ON_SURFACE_VARIANT = '#adaaaa'
const ON_PRIMARY_FIXED = '#003840'
const PRIMARY = '#81ecff'
const PRIMARY_FIXED = '#00e3fd'

export default function WelcomeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const welcomePad = welcomeScreenPaddingX(width)
  const featuresGap = width < 360 ? 20 : width > 430 ? 56 : 40

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AuthScreenBackdrop variant="welcome" />

      {/* פס דק בראש — כמו ב־HTML */}
      <LinearGradient
        colors={['rgba(129,236,255,0)', 'rgba(129,236,255,0.4)', 'rgba(129,236,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topAccent}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: welcomePad,
            paddingBottom: insets.bottom + 96,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces
      >
        <View style={styles.main}>
          {/* לוגו + הילה */}
          <View style={styles.logoWrap}>
            <View style={styles.logoGlow} />
            <View style={styles.logoBox}>
              <LinearGradient
                colors={['rgba(255,255,255,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.logoText}>גש</Text>
            </View>
          </View>

          <View style={styles.headlineBlock}>
            <View style={styles.titleWrap}>
              <Text
                style={[styles.title, width < 360 ? styles.titleCompact : null]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.68}
                maxFontSizeMultiplier={1.2}
              >
                גש - המאמן האישי שלך
              </Text>
            </View>
            <Text style={styles.subtitle}>הדרך שלך להצליח עם נשים מתחילה כאן</Text>
          </View>

          <View style={styles.buttonBlock}>
            <TouchableOpacity
              style={styles.primaryOuter}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.92}
            >
              <LinearGradient
                colors={['#81ecff', '#00d4ec']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryGradient}
              >
                <Text style={styles.primaryButtonText}>התחברות</Text>
                <MaterialIcons name="chevron-left" size={24} color={ON_PRIMARY_FIXED} style={styles.chevron} />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/auth/register')}
              activeOpacity={0.88}
            >
              <Text style={styles.secondaryButtonText}>הרשמה</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.featuresBar,
          { paddingBottom: insets.bottom + 10, paddingHorizontal: welcomePad, gap: featuresGap },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.feature}>
          <MaterialIcons name="security" size={22} color="rgba(173,170,170,0.35)" />
          <Text style={styles.featureLabel}>אנונימיות מלאה</Text>
        </View>
        <View style={styles.feature}>
          <MaterialIcons name="psychology" size={22} color="rgba(173,170,170,0.35)" />
          <Text style={styles.featureLabel}>AI מתקדם</Text>
        </View>
        <View style={styles.feature}>
          <MaterialIcons name="verified" size={22} color="rgba(173,170,170,0.35)" />
          <Text style={styles.featureLabel}>תוצאות מוכחות</Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: authSurfaceColor,
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    zIndex: 20,
    opacity: 0.2,
  },
  scroll: {
    flexGrow: 1,
    paddingTop: 32,
  },
  main: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 512,
    alignSelf: 'center',
  },
  logoWrap: {
    marginBottom: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(129, 236, 255, 0.2)',
    transform: [{ scale: 1.15 }],
  },
  logoBox: {
    width: 128,
    height: 128,
    borderRadius: 40,
    backgroundColor: SURFACE_CONTAINER,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 12 },
    }),
  },
  logoText: {
    fontSize: 64,
    fontWeight: '900',
    color: PRIMARY_FIXED,
    letterSpacing: -2,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 12,
      },
    }),
  },
  headlineBlock: {
    alignItems: 'center',
    gap: 24,
    marginBottom: 8,
    width: '100%',
    maxWidth: 448,
    paddingHorizontal: 4,
  },
  titleWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCompact: {
    fontSize: 28,
    letterSpacing: -0.4,
  },
  title: {
    width: '100%',
    fontSize: 34,
    fontWeight: '900',
    color: ON_SURFACE,
    textAlign: 'center',
    letterSpacing: -0.6,
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif' }),
    ...Platform.select({
      ios: {
        textShadowColor: 'rgba(129, 236, 255, 0.35)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
      },
    }),
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: ON_SURFACE_VARIANT,
    textAlign: 'center',
    lineHeight: 28,
    fontFamily: 'Inter',
  },
  buttonBlock: {
    width: '100%',
    maxWidth: 384,
    marginTop: 56,
    gap: 16,
    alignSelf: 'center',
  },
  primaryOuter: {
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  primaryGradient: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 6,
  },
  primaryButtonText: {
    color: ON_PRIMARY_FIXED,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  chevron: {
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(72, 72, 71, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: PRIMARY,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  featuresBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    paddingTop: 8,
  },
  feature: {
    alignItems: 'center',
    gap: 4,
    minWidth: 72,
  },
  featureLabel: {
    color: 'rgba(173, 170, 170, 0.35)',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
})
