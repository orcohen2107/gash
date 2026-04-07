# Expo Mobile Research

**Project:** Gash — Hebrew Dating Coach App
**Researched:** 2026-04-07
**Confidence:** HIGH (official docs + multiple verified sources)

---

## RTL Hebrew Support

### How RTL Works in React Native

React Native provides `I18nManager` from `react-native` to control layout direction. For a Hebrew-only app like Gash, the correct approach is to **force RTL at app boot** rather than allow dynamic switching.

```typescript
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

// Call this once at app startup (e.g., in _layout.tsx or App.tsx)
async function ensureRTL() {
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    await Updates.reloadAsync(); // triggers one-time reload
  }
}
```

Since Gash is Hebrew-only, call this unconditionally on first launch and persist a flag via AsyncStorage so it only triggers once.

### Platform Differences (CRITICAL)

- **Android**: RTL applies correctly after a single `Updates.reloadAsync()` call.
- **iOS before RN 0.79**: RTL changes do NOT apply even after reload — a full app restart is required. This was a known Expo/RN limitation.
- **iOS with RN 0.79+ (Expo SDK 52+)**: Layout context updates dynamically. If targeting SDK 52+, this is resolved.
- **Expo Go**: Does not reliably reflect `forceRTL` changes. Use a **development build** (EAS or `npx expo run:ios`) for accurate RTL testing.

### Styling Rules — Always Use Logical Properties

| Avoid | Use Instead |
|-------|-------------|
| `paddingLeft` | `paddingStart` |
| `paddingRight` | `paddingEnd` |
| `marginLeft` | `marginStart` |
| `marginRight` | `marginEnd` |
| `left: 0` (in absolute positioning) | `start: 0` |
| `textAlign: 'right'` | `textAlign: 'right'` is fine for Hebrew, but prefer `I18nManager.isRTL ? 'right' : 'left'` |
| `flexDirection: 'row'` (when direction matters) | `flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row'` |

### Components That Need Special Treatment

1. **Icon buttons with directional meaning** (back arrows, chevrons): Flip them explicitly — RN does NOT auto-flip images. Use `transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }]`.
2. **TextInput**: Set `textAlign: 'right'` and ensure `placeholder` text is Hebrew. On Android, also set `writingDirection` if needed.
3. **FlatList / ScrollView with horizontal scroll**: Set `horizontal` direction explicitly; list items may need `flexDirection: 'row-reverse'` in RTL.
4. **Modal and Drawer components**: Test manually — some third-party drawers assume LTR.
5. **Charts** (see Charts section): Most chart libraries do not have built-in RTL support — axis labels may need mirroring.

### The "key prop" Trick for Dynamic Language Switching

If you ever need dynamic language switching without a reload, wrap your root component with a key that changes on language switch:

```tsx
<View key={currentLanguage}>
  <App />
</View>
```

This forces a full re-render tree without requiring `Updates.reloadAsync()`.

### Pitfalls

- **Do not mix** `I18nManager.forceRTL(true)` AND `rtl: true` in config simultaneously — they conflict.
- **Mixed content** (English usernames in Hebrew text): Use Unicode direction markers (`\u200F` for RTL mark, `\u200E` for LTR mark).
- **iOS Simulator**: RTL may not behave identically to device. Test on a real device.
- **Third-party UI libraries**: Check each library individually — many assume LTR. NativeWind/Tailwind RN does support RTL via logical properties.

**Sources:**
- [I18nManager · React Native](https://reactnative.dev/docs/i18nmanager)
- [Implementing RTL in React Native Expo — GeekyAnts](https://geekyants.com/en-us/blog/implementing-rtl-right-to-left-in-react-native-expo---a-step-by-step-guide)
- [RTL without restarting — GeekyAnts](https://geekyants.com/blog/implementing-right-to-left-rtl-support-in-expo-without-restarting-the-app)
- [Localization — Expo Docs](https://docs.expo.dev/guides/localization/)

---

## Navigation Architecture

### Recommendation: Expo Router v3 (file-based)

For a new Expo project with 5 clearly defined screens, **Expo Router v3** is the correct choice. It is Expo's first-party, officially supported router built on top of React Navigation under the hood.

**Reasoning:**
- File-based routing maps naturally to the 5 screens — no configuration boilerplate
- Automatic deep linking for every screen out of the box
- First-party support means it stays in sync with Expo SDK updates
- `expo-router` v3 (shipped Jan 2024) adds bundle splitting and testing library integration
- Works well with TypeScript — route types are auto-generated

### Suggested File Structure

```
app/
  (tabs)/
    index.tsx          # Chat/AI Coach (default tab)
    log.tsx            # Quick Log Form
    journal.tsx        # Journal/History
    dashboard.tsx      # Dashboard/Analytics
    tips.tsx           # Tips & Missions
  _layout.tsx          # Root layout, RTL init, auth gate
  (tabs)/_layout.tsx   # Tab bar config (icons, labels in Hebrew)
```

### Tab Bar Configuration

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarLabelPosition: 'below-icon',
        // Hebrew labels are RTL-safe as text, no special handling needed
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'מאמן' }} />
      <Tabs.Screen name="log" options={{ title: 'רשום' }} />
      <Tabs.Screen name="journal" options={{ title: 'יומן' }} />
      <Tabs.Screen name="dashboard" options={{ title: 'סטטיסטיקה' }} />
      <Tabs.Screen name="tips" options={{ title: 'משימות' }} />
    </Tabs>
  );
}
```

### React Navigation 7 — When to Use Instead

React Navigation 7 (Nov 2024) is appropriate if you need:
- Complex nested navigation (stacks inside drawers inside tabs)
- Fine-grained TypeScript type safety for route params
- Custom transition animations at a low level

For Gash's 5-screen tab app, this complexity is not needed. Expo Router is the better fit.

**Sources:**
- [Expo Router Introduction](https://docs.expo.dev/router/introduction/)
- [Navigation in Expo apps](https://docs.expo.dev/develop/app-navigation/)
- [React Navigation 7 vs Expo Router — Viewlytics](https://viewlytics.ai/blog/react-navigation-7-vs-expo-router)
- [Expo Router tab navigation](https://docs.expo.dev/router/advanced/tabs/)

---

## State Management

### Recommendation: Zustand

For an app of this scale (5 screens, user profile, AI chat history, log entries, stats), **Zustand is the correct choice**. It is lightweight, TypeScript-first, and requires minimal boilerplate.

**Why not Redux Toolkit:** RTK is appropriate for large enterprise apps with many developers, complex async flows, and debugging needs (Redux DevTools). Gash does not require this complexity.

**Why not Context API:** Context causes unnecessary re-renders when any context value changes. For an app that will update state frequently (chat messages streaming in, log entries added), Context will degrade performance.

### Store Design

Define separate Zustand stores per domain:

```typescript
// stores/useAuthStore.ts — user profile, auth state
// stores/useChatStore.ts — AI conversation history
// stores/useLogStore.ts — quick log entries
// stores/useStatsStore.ts — computed analytics data
// stores/useSettingsStore.ts — app preferences (language confirmed, notifications)
```

### Persistence Pattern

Use `zustand/middleware` `persist` with `@react-native-async-storage/async-storage`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSettingsStore = create(
  persist(
    (set) => ({
      rtlInitialized: false,
      setRTLInitialized: () => set({ rtlInitialized: true }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ rtlInitialized: state.rtlInitialized }),
    }
  )
);
```

For sensitive data (e.g., auth tokens), use `expo-secure-store` as the storage backend instead of AsyncStorage.

### MMKV Alternative

If performance of AsyncStorage becomes a concern (it can be slow for frequent writes), replace AsyncStorage with `react-native-mmkv`. MMKV is synchronous, encrypted, and ~30x faster. It integrates with Zustand's `persist` via a custom storage adapter.

**Sources:**
- [State Management in 2025 — DEV Community](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Zustand with AsyncStorage — Expo Docs](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [Zustand in React Native — Peslo Blog](https://blog.peslostudios.com/blog/zustand-state-management-in-react-native/)

---

## Forms

### Recommendation: react-hook-form + zod

The `react-hook-form` + `zod` + `@hookform/resolvers` combination is the established standard for React Native / Expo forms in 2024-2025. Multiple production guides and starter kits (obytes/expo-starter) use this exact stack.

**Why react-hook-form over Formik:**
- Uncontrolled inputs — no re-render on every keystroke
- First-class TypeScript support
- Smaller bundle size
- Native React Native support with `Controller` component

### Implementation Pattern

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const logSchema = z.object({
  mood: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  notes: z.string().max(500).optional(),
  date: z.date(),
});

type LogFormData = z.infer<typeof logSchema>;

export function QuickLogForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<LogFormData>({
    resolver: zodResolver(logSchema),
  });

  return (
    <Controller
      control={control}
      name="mood"
      render={({ field: { onChange, value } }) => (
        <TextInput
          value={String(value)}
          onChangeText={(v) => onChange(Number(v))}
          textAlign="right" // Hebrew RTL
        />
      )}
    />
  );
}
```

### Quick Log Form Specifics

For Gash's Quick Log Form (rating scales, notes, date), consider using slider components for numeric ratings rather than text inputs. `@react-native-community/slider` works well with `Controller`.

**Sources:**
- [react-hook-form + zod React Native — Plain English](https://plainenglish.io/blog/how-to-build-react-native-forms-with-react-hook-form-and-zod)
- [Expo + react-hook-form + TypeScript + zod — DEV](https://dev.to/birolaydin/expo-react-hook-form-typescript-zod-4oac)
- [Forms — Obytes Expo Starter](https://starter.obytes.com/ui-and-theme/forms/)

---

## Charts & Visualizations

### Recommendation: react-native-gifted-charts

For Gash's analytics dashboard (mood trends, energy over time, mission completion stats), **react-native-gifted-charts** is the best fit.

**Comparison Matrix:**

| Library | Line | Bar | Pie | Performance | RTL | Maintenance | Bundle |
|---------|------|-----|-----|-------------|-----|-------------|--------|
| react-native-gifted-charts | Yes | Yes | Yes | Good | Usable (manual) | Active (Apr 2025) | Moderate |
| Victory Native XL (v40+) | Yes | Yes | No pie | Excellent (Skia, 100fps) | Not documented | Active | Heavy (Skia + Reanimated + Gesture Handler) |
| react-native-chart-kit | Yes | Yes | Yes | Poor (large datasets) | No | Minimal | Light |

**Why gifted-charts wins for Gash:**
- Supports all required chart types: line (mood trends), bar (weekly summaries), pie/donut (mission completion)
- Easy integration — lower dependency footprint than Victory Native XL
- Actively maintained as of April 2025
- Was specifically used for Arabic/RTL use cases (line chart with RTL tooltip positioning confirmed by community)
- Scrollable and clickable charts for journal history views
- react-native-svg as the only peer dep (no Skia/Reanimated required unless you want animations)

**Victory Native XL consideration:** If you need butter-smooth 100fps chart animations (e.g., a real-time mood tracker updating rapidly), Victory Native XL is the performance king. But it requires 3 heavy peer deps (Skia, Reanimated, Gesture Handler) and does not have a pie chart. For Gash's use case (static period-end analytics), gifted-charts is sufficient.

**react-native-chart-kit: avoid.** Known issues with axis label clipping, poor performance on larger datasets, and minimal maintenance.

### RTL Note for Charts

No chart library has first-class RTL support. For Hebrew RTL dashboards:
- X-axis labels (dates) will render left-to-right regardless — this is acceptable for date axes
- Hebrew text in tooltips/labels: pass Hebrew strings directly, they render correctly in SVG
- Y-axis positioning: gifted-charts supports `yAxisLabelWidth` and `yAxisSide` props to move the Y axis to the right side

**Sources:**
- [Top React Native Chart Libraries 2025 — LogRocket](https://blog.logrocket.com/top-react-native-chart-libraries/)
- [React Native Chart Libraries 2025 — OpenReplay](https://blog.openreplay.com/react-native-chart-libraries-2025/)
- [npm trends comparison](https://npmtrends.com/react-native-chart-kit-vs-react-native-gifted-charts-vs-victory-native)
- [RTL chart use case — Medium](https://medium.com/@contact8abhishek/react-native-chat-graph-library-arabic-support-rtl-e8504ccf46a7)

---

## Expo SDK Capabilities

### expo-notifications

- Install: `npx expo install expo-notifications`
- **CRITICAL:** Push notifications do NOT work in Expo Go — you must use a development build.
- Local notifications (reminders to log, daily check-in) work without a server.
- Push notifications require FCM (Android) and APNs (iOS) credentials — EAS handles this automatically.
- Android 13+ requires explicit permission grant at runtime.
- Configure notification channels for Android in `app.json`.

```json
// app.json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#ffffff"
      }]
    ]
  }
}
```

### expo-local-authentication

- Install: `npx expo install expo-local-authentication`
- Supports: TouchID, FaceID, fingerprint (Android)
- **CRITICAL:** FaceID in iOS does NOT work in Expo Go — requires development build.
- Configure iOS permission in `app.json`:
```json
["expo-local-authentication", {
  "faceIDPermission": "Allow Gash to use Face ID for secure login"
}]
```
- Always call `hasHardwareAsync()` and `isEnrolledAsync()` before calling `authenticateAsync()` — do not assume biometrics are available.
- Falls back to device passcode if biometrics fail.

### expo-image-picker (for v2 screenshot upload)

- Install: `npx expo install expo-image-picker`
- Permissions required: camera, photo library (separate permissions)
- Supports picking from library and launching camera
- Returns base64 or URI — for AI analysis, send base64 to backend

**Sources:**
- [Notifications — Expo Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [expo-local-authentication — Expo Docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/)

---

## EAS Build

### First-Time Setup Checklist

```bash
npm install -g eas-cli
eas login
eas build:configure   # generates eas.json with dev/preview/production profiles
```

### eas.json Structure

```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

### iOS Gotchas

1. **Apple Developer Program required** — $99/year. Without it, you cannot sign iOS builds (even development builds for real devices).
2. **Automatic credential management**: EAS CLI handles provisioning profiles and distribution certificates. Let EAS manage these — do not fight it by creating manual profiles.
3. **Provisioning profile type**: EAS creates "Ad Hoc" profiles for internal distribution — this is correct for testing without App Store submission.
4. **Provisioning profiles expire after 12 months**: When they expire, re-run `eas build -p ios` and EAS auto-rotates them.
5. **Xcode 14+ resource bundle signing**: If you get signing errors for resource bundles, add to your Podfile:
   ```ruby
   post_install do |installer|
     installer.pods_project.targets.each do |target|
       target.build_configurations.each do |config|
         config.build_settings['CODE_SIGNING_ALLOWED'] = 'NO'
       end
     end
   end
   ```
   Or pin to an older Xcode image in `eas.json` via `"image": "macos-ventura-13.6-xcode-15.0"`.
6. **FaceID + push notifications** both require development builds — plan your first build to include both capabilities.

### Android Gotchas

1. **Keystore management**: Let EAS generate and store your keystore. Losing a production keystore means you cannot update your app on Google Play — EAS cloud storage prevents this.
2. **google-services.json** required for push notifications — download from Firebase Console and add to project root.
3. **`android.package`** must be set in `app.json` before first build (e.g., `"com.yourname.gash"`).

### Development Build Workflow

```bash
# Build development client (run once, then iterate without rebuilding)
eas build --profile development --platform ios
eas build --profile development --platform android

# After initial build: fast iteration with Expo dev server
npx expo start --dev-client
```

The development build installs on your device and connects to your local dev server — hot reload works normally. You only need to rebuild when native dependencies change.

### Environment Variables

Use `eas secret:create` to store API keys (OpenAI key, etc.) rather than putting them in `app.json` or `.env`:

```bash
eas secret:create --scope project --name OPENAI_API_KEY --value sk-...
```

Reference in `eas.json`:
```json
"production": {
  "env": {
    "OPENAI_API_KEY": "$OPENAI_API_KEY"
  }
}
```

**Sources:**
- [EAS Build Setup — Expo Docs](https://docs.expo.dev/build/setup/)
- [App credentials — Expo Docs](https://docs.expo.dev/app-signing/app-credentials/)
- [Managed credentials — Expo Docs](https://docs.expo.dev/app-signing/managed-credentials/)

---

## Key Recommendations

- **Force RTL at app boot** using `I18nManager.forceRTL(true)` in `_layout.tsx`, then call `Updates.reloadAsync()` once. Store a flag in AsyncStorage so this only happens on first launch. Never rely on device locale for a Hebrew-only app.

- **Use `paddingStart`/`paddingEnd`/`marginStart`/`marginEnd`** everywhere. Audit your entire stylesheet before release. Zero use of `left`/`right` directional properties.

- **Always test RTL on a real device with a development build** — Expo Go and simulators give unreliable RTL results.

- **Flip directional icons explicitly** with `transform: [{ scaleX: -1 }]` — React Native does not auto-mirror images in RTL mode.

- **Use Expo Router v3** with `app/(tabs)/` file structure. It maps perfectly to the 5-screen tab layout and handles deep linking automatically.

- **Use Zustand** with the `persist` middleware backed by AsyncStorage for app state. Use separate stores per domain (chat, log, stats, settings). For sensitive tokens, use `expo-secure-store` as the storage backend.

- **Use react-hook-form + zod** for the Quick Log Form. Use `Controller` to wrap native inputs. Define Zod schemas that mirror your Prisma/database types.

- **Use react-native-gifted-charts** for all chart types. Move the Y-axis to the right side (`yAxisSide='right'`) for RTL dashboards. Pass Hebrew strings directly to chart labels.

- **Build development builds early** (first sprint) since both `expo-notifications` and `expo-local-authentication` (FaceID) do not work in Expo Go. Block on this.

- **Let EAS manage iOS credentials** automatically — do not create manual provisioning profiles. Store the Android keystore in EAS cloud, not locally.

- **Set `android.package` and `ios.bundleIdentifier`** in `app.json` before the first EAS build to avoid interactive prompts in CI.

- **Use MMKV** (`react-native-mmkv`) instead of AsyncStorage for any state that updates frequently (e.g., streaming AI chat tokens). AsyncStorage is async and slow for high-frequency writes.
