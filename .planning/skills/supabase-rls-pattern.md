# Skill: Supabase RLS Patterns

## RLS בסיסי — כל טבלה

```sql
-- approaches
alter table approaches enable row level security;
create policy "user owns rows" on approaches
  using (auth.uid() = user_id);

-- chat_messages
alter table chat_messages enable row level security;
create policy "user owns rows" on chat_messages
  using (auth.uid() = user_id);
```

## שליפות נפוצות

```ts
// הכל של המשתמש הנוכחי — RLS מסנן אוטומטית
const { data } = await supabase.from('approaches').select('*')

// עם סינון + מיון
const { data } = await supabase
  .from('approaches')
  .select('*')
  .eq('approach_type', 'direct')
  .gte('date', '2026-01-01')
  .order('date', { ascending: false })
  .limit(30)

// search by location
const { data } = await supabase
  .from('approaches')
  .select('*')
  .ilike('location', `%${query}%`)
```

## insert + get back
```ts
const { data, error } = await supabase
  .from('approaches')
  .insert({ approach_type: 'direct', chemistry_score: 7, ... })
  .select()
  .single()
```

## realtime subscription
```ts
const channel = supabase
  .channel('approaches-changes')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'approaches' },
    (payload) => useLogStore.getState().addApproach(payload.new)
  )
  .subscribe()

// cleanup
return () => supabase.removeChannel(channel)
```

## Edge Function — supabase client עם JWT של המשתמש
```ts
// חובה — אחרת RLS לא עובד ב-Edge Function
const supabase = createClient(url, anonKey, {
  global: { headers: { Authorization: req.headers.get('Authorization')! } }
})
```
