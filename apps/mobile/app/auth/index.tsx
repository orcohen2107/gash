import React from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>גאש</Text>
          </View>
          <Text style={styles.title}>גאש – המאמן האישי שלך</Text>
          <Text style={styles.subtitle}>הדרך שלך להצליח עם נשים מתחילה כאן</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#81ecff', '#00d4ec']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryGradient}
            >
              <Text style={styles.primaryButtonText}>התחברות</Text>
              <Text style={styles.chevron}>‹</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryButtonText}>הרשמה</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>THE DIGITAL ARCHITECT</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>✅</Text>
              <Text style={styles.featureLabel}>תוצאות מוכחות</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureLabel}>AI מתקדם</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🔒</Text>
              <Text style={styles.featureLabel}>אנונימיות מלאה</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0e0e0e',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 60,
  },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#81ecff',
    fontFamily: 'Inter',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#adaaaa',
    textAlign: 'center',
    fontFamily: 'Inter',
    lineHeight: 22,
  },
  buttonSection: {
    gap: 16,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryGradient: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  chevron: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
  },
  secondaryButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3a3a3a',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  footer: {
    gap: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    color: '#555',
    fontSize: 10,
    fontFamily: 'Inter',
    letterSpacing: 1.5,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    alignItems: 'center',
    gap: 6,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureLabel: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'Inter',
    textAlign: 'center',
  },
})
