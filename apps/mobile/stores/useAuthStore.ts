import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@gash/types'

interface AuthStore {
  user: User | null
  session: Session | null
  loading: boolean
  userProfile: UserProfile | null
  /** מזהה המשתמש (auth.users) ששייך אליו המטמון — למניעת דליפה בין משתמשים */
  profileCacheUserId: string | null
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setUserProfile: (profile: UserProfile | null) => void
  signOut: () => Promise<void>
}

/** JWT נשאר אצל Supabase; רק פרופיל מוצג (שם, גיל, טלפון, תמונה) נשמר לזמינות מיידית ב-AppBar */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      user: null,
      session: null,
      loading: true,
      userProfile: null,
      profileCacheUserId: null,

      setSession: (session) => {
        const uid = session?.user?.id ?? null
        if (!uid) {
          set({
            session: null,
            user: null,
            userProfile: null,
            profileCacheUserId: null,
          })
          return
        }
        set((s) => {
          const wrongUser = s.profileCacheUserId != null && s.profileCacheUserId !== uid
          return {
            session,
            user: session!.user,
            userProfile: wrongUser ? null : s.userProfile,
            profileCacheUserId: uid,
          }
        })
      },

      setLoading: (loading) => set({ loading }),

      setUserProfile: (userProfile) =>
        set((s) => ({
          userProfile,
          profileCacheUserId:
            userProfile != null && s.session?.user?.id
              ? s.session.user.id
              : s.profileCacheUserId,
        })),

      signOut: async () => {
        await supabase.auth.signOut()
        set({
          session: null,
          user: null,
          userProfile: null,
          profileCacheUserId: null,
        })
      },
    }),
    {
      name: 'gash-auth-profile-cache',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        userProfile: s.userProfile,
        profileCacheUserId: s.profileCacheUserId,
      }),
    }
  )
)
