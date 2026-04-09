# Skill: RTL Hebrew in Expo

דברים שחוזרים שוב ושוב — תשמור כאן כדי לא לחפש כל פעם.

## boot config (פעם אחת)
```ts
// app/_layout.tsx
import { I18nManager } from 'react-native'
import * as Updates from 'expo-updates'

const { rtlInitialized } = useSettingsStore()
if (!rtlInitialized) {
  I18nManager.allowRTL(true)
  I18nManager.forceRTL(true)
  useSettingsStore.getState().setRtlInitialized(true)
  await Updates.reloadAsync()  // חובה — בלי זה RTL לא נכנס
}
```

## styles — מה מותר ומה אסור
```ts
// ✅ נכון
paddingStart: 16,    marginStart: 8,    start: 0
paddingEnd: 16,      marginEnd: 8,      end: 0

// ❌ אסור
paddingLeft: 16,     marginLeft: 8,     left: 0
paddingRight: 16,    marginRight: 8,    right: 0
```

## textAlign
```ts
textAlign: 'right'   // ✅ לטקסט עברי
textAlign: 'auto'    // ✅ אוטומטי לפי RTL
textAlign: 'left'    // ❌ אף פעם בעברית
```

## icons — חץ/שברון צריכים flip
```ts
<Ionicons name="chevron-forward" style={{ transform: [{ scaleX: -1 }] }} />
```

## FlatList — צ'אט (הודעות מלמטה)
```ts
<FlatList
  inverted                    // הודעות חדשות למטה
  data={messages}
  keyExtractor={m => m.id}
/>
```

## tab order — ימין לשמאל
```ts
// app/(tabs)/_layout.tsx
// הטאב הראשון ב-array = הכי ימני
tabs: ['coach', 'log', 'journal', 'dashboard', 'tips']
//      צ'אט    +     יומן     דשבורד    טיפים
```

## gotchas
- RTL לא עובד ב-Expo Go simulator — תבדוק תמיד על device אמיתי
- `TextInput` — placeholder מיושר אוטומטית בRTL אם `textAlign: 'right'`
- `Modal` — צריך `style={{ direction: 'rtl' }}` בנפרד
- `@gorhom/bottom-sheet` — RTL עובד אוטומטית, לא צריך שינוי
