import React, { useState } from 'react'
import {
  View,
  Image,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'
import { useAuthStore } from '@/stores/useAuthStore'
import { uploadAvatarBase64 } from '@/lib/uploadAvatar'
import { fetchAndSyncUserProfile } from '@/lib/userProfileSync'

const ACCENT = '#81ecff'
const ACCENT_DIM = '#00d4ec'

interface UserAvatarEditorProps {
  size?: number
  /** טבעת הדגשה (למשל בכותרת דשבורד — לא חובה ב-AppTopBar) */
  ring?: boolean
  style?: ViewStyle
}

function initialLetter(name: string | undefined): string {
  const t = name?.trim()
  if (!t) return '?'
  return t.charAt(0).toUpperCase()
}

export function UserAvatarEditor({ size = 40, ring = false, style }: UserAvatarEditorProps) {
  const userProfile = useAuthStore((s) => s.userProfile)
  const [busy, setBusy] = useState(false)

  const uri = userProfile?.avatar_url ?? undefined
  const letter = initialLetter(userProfile?.name)

  const pickAndUpload = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Toast.show({
        type: 'error',
        text1: 'נדרשת גישה לגלריה כדי לבחור תמונה',
        position: 'bottom',
      })
      return
    }

    setBusy(true)
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as const,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        base64: true,
      })
      if (result.canceled || !result.assets[0]?.base64) {
        return
      }
      const asset = result.assets[0]
      const b64 = asset.base64
      if (!b64) {
        Toast.show({ type: 'error', text1: 'לא התקבלה תמונה מהמכשיר', position: 'bottom' })
        return
      }
      const mime =
        asset.mimeType && ['image/jpeg', 'image/png', 'image/webp'].includes(asset.mimeType)
          ? asset.mimeType
          : 'image/jpeg'

      await uploadAvatarBase64(b64, mime)
      await fetchAndSyncUserProfile()
      Toast.show({ type: 'success', text1: 'תמונת הפרופיל עודכנה', position: 'bottom' })
    } catch (e) {
      console.error('[UserAvatarEditor]', e)
      Toast.show({ type: 'error', text1: 'לא הצלחנו להעלות את התמונה', position: 'bottom' })
    } finally {
      setBusy(false)
    }
  }

  const inner = (
    <Pressable
      onPress={pickAndUpload}
      disabled={busy}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        ring && styles.ringInner,
        pressed && { opacity: 0.85 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel="הוסף או שנה תמונת פרופיל"
    >
      {busy ? (
        <ActivityIndicator color={ACCENT} />
      ) : uri ? (
        <Image source={{ uri }} style={[styles.img, { width: size, height: size, borderRadius: size / 2 }]} />
      ) : (
        <Text style={[styles.letter, { fontSize: size * 0.38 }]}>{letter}</Text>
      )}
    </Pressable>
  )

  if (ring) {
    return (
      <View
        style={[
          styles.ringOuter,
          {
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        {inner}
      </View>
    )
  }

  return inner
}

const styles = StyleSheet.create({
  ringOuter: {
    borderWidth: 2,
    borderColor: ACCENT_DIM,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ringInner: {
    overflow: 'hidden',
  },
  circle: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  img: {
    resizeMode: 'cover',
  },
  letter: {
    fontWeight: '800',
    color: ACCENT,
  },
})
