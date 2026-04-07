# Skill: User Profile Builder

איך לבנות פרופיל אישי של המשתמש מהגישות שלו ולהזריק לפרומפט.

## עיקרון
לא מאחסנים "פרופיל" — מחשבים אותו בזמן אמת מ-30 הגישות האחרונות.
מהיר, תמיד עדכני, לא דורש migration.

## מה לחשב

```ts
type UserProfile = {
  totalApproaches: number
  bestType: ApproachType       // direct|situational|humor|online
  bestRate: number             // 0-100
  worstType: ApproachType
  avgChemistry: string         // "6.4"
  recentPattern: string        // "3 גישות ישירות השבוע, 2 הצליחו"
  hasEnoughData: boolean       // false אם < 5 גישות
}
```

## איך מזריקים לפרומפט

```ts
function injectProfile(basePrompt: string, profile: UserProfile | null): string {
  if (!profile || !profile.hasEnoughData) {
    return basePrompt + '\n\nהמשתמש חדש — עדיין אין מספיק נתונים. תן עצות כלליות.'
  }
  return basePrompt + `\n\nנתוני המשתמש:
- ביצע ${profile.totalApproaches} פניות
- הכי מצליח ב: גישה ${profile.bestType} (${profile.bestRate}%)
- הכי פחות מצליח ב: ${profile.worstType}
- ציון כימיה ממוצע: ${profile.avgChemistry}/10
- ${profile.recentPattern}`
}
```

## מתי לעדכן
- Phase 4: `buildUserContext()` נקרא לפני כל הודעת `coach`
- Phase 5: אותו context משמש ל-missions
- v2: Cache ל-5 דקות ב-Redis כדי לא לשלוף כל פעם
