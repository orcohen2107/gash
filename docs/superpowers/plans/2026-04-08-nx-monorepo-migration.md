# Nx Monorepo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing root-level Expo app into an Nx monorepo with `apps/mobile` (Expo), `apps/server` (Next.js on Vercel), and four shared libs — so all AI agents, Supabase data calls, and Claude API calls live on the server, never on the client.

**Architecture:** Nx workspace uses npm workspaces to share `@gash/types`, `@gash/schemas`, `@gash/constants`, and `@gash/api-client` across apps. The mobile app talks to Supabase Auth directly (OTP/JWT) and to the Next.js server for everything else. The server holds service role keys and all agent logic.

**Tech Stack:** Nx, npm workspaces, Expo ~52 (unchanged), Next.js 15 App Router, Anthropic SDK (`@anthropic-ai/sdk`), Zod (already installed), Supabase JS v2 (already installed), TypeScript strict.

**Design spec:** `docs/superpowers/specs/2026-04-08-nx-monorepo-migration-design.md`

---

## File Map

### New files (created in this plan)
```
nx.json
tsconfig.base.json
apps/mobile/project.json
apps/mobile/tsconfig.json             (replaces root tsconfig.json)
apps/server/package.json
apps/server/next.config.ts
apps/server/tsconfig.json
apps/server/project.json
apps/server/.env.example
apps/server/app/layout.tsx            (required by Next.js App Router)
apps/server/app/api/coach/route.ts
apps/server/app/api/coach/onboarding/route.ts
apps/server/app/api/coach/reply/route.ts
apps/server/app/api/coach/opener/route.ts
apps/server/app/api/approaches/route.ts
apps/server/app/api/approaches/[id]/route.ts
apps/server/app/api/insights/route.ts
apps/server/lib/auth.ts
apps/server/lib/supabase.ts
apps/server/lib/claude.ts
apps/server/lib/agents/router.ts
apps/server/lib/agents/coach.ts
apps/server/lib/agents/onboarding.ts
apps/server/lib/agents/reply-coach.ts
apps/server/lib/agents/situation-opener.ts
apps/server/lib/agents/approach-feedback.ts
apps/server/lib/agents/debrief.ts
apps/server/lib/agents/boost.ts
apps/server/lib/agents/insights.ts
apps/server/__tests__/agents/router.test.ts
libs/types/package.json
libs/types/tsconfig.json
libs/types/src/index.ts               (migrated from types/index.ts)
libs/schemas/package.json
libs/schemas/tsconfig.json
libs/schemas/src/index.ts
libs/constants/package.json
libs/constants/tsconfig.json
libs/constants/src/index.ts
libs/api-client/package.json
libs/api-client/tsconfig.json
libs/api-client/src/index.ts
libs/api-client/src/client.ts
libs/api-client/src/endpoints/coach.ts
libs/api-client/src/endpoints/approaches.ts
libs/api-client/src/endpoints/insights.ts
```

### Moved files (Expo app → apps/mobile/)
```
app/          → apps/mobile/app/
components/   → apps/mobile/components/
stores/       → apps/mobile/stores/
lib/          → apps/mobile/lib/
__tests__/    → apps/mobile/__tests__/
app.json      → apps/mobile/app.json
jest.config.js → apps/mobile/jest.config.js
jest-setup.js  → apps/mobile/jest-setup.js
babel.config.js → apps/mobile/babel.config.js  (if exists)
```

### Modified files
```
package.json          (root — add workspaces, nx, new scripts)
apps/mobile/tsconfig.json  (extend tsconfig.base.json)
apps/mobile/stores/useChatStore.ts   (use @gash/api-client)
apps/mobile/stores/useLogStore.ts    (use @gash/api-client)
apps/mobile/stores/useStatsStore.ts  (use @gash/api-client)
```

### Deleted files
```
types/index.ts              (content moved to libs/types/src/index.ts)
supabase/functions/ask-coach/index.ts   (replaced by Next.js routes)
```

---

## Task 1: Nx Workspace Init + apps/mobile Migration

**Goal:** Turn the current project root into an Nx workspace. Move all Expo files to `apps/mobile/`. Expo Go must still work identically after this task.

**Files:**
- Create: `nx.json`
- Create: `tsconfig.base.json`
- Modify: `package.json` (root)
- Create: `apps/mobile/project.json`
- Create: `apps/mobile/tsconfig.json`
- Move: all Expo source files to `apps/mobile/`

---

- [ ] **Step 1: Install Nx and workspace tooling**

```bash
npm install --save-dev nx@latest
```

Expected: `nx` appears in `devDependencies` in `package.json`.

---

- [ ] **Step 2: Create `nx.json`**

Create file at project root:

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "defaultBase": "main",
  "workspaceLayout": {
    "appsDir": "apps",
    "libsDir": "libs"
  },
  "targetDefaults": {
    "build": { "cache": true },
    "test": { "cache": true },
    "lint": { "cache": true }
  },
  "projects": {
    "mobile": "apps/mobile",
    "server": "apps/server",
    "types": "libs/types",
    "schemas": "libs/schemas",
    "constants": "libs/constants",
    "api-client": "libs/api-client"
  }
}
```

---

- [ ] **Step 3: Create `tsconfig.base.json` at root**

This is the shared TypeScript config. All apps and libs extend it.

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "strictNullChecks": true,
    "paths": {
      "@gash/types": ["libs/types/src/index.ts"],
      "@gash/schemas": ["libs/schemas/src/index.ts"],
      "@gash/constants": ["libs/constants/src/index.ts"],
      "@gash/api-client": ["libs/api-client/src/index.ts"]
    }
  }
}
```

---

- [ ] **Step 4: Update root `package.json`**

Add `workspaces` and update `scripts`. Replace the existing scripts block:

```json
{
  "name": "gash",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "libs/*"],
  "scripts": {
    "mobile": "nx run mobile:start",
    "server": "nx run server:dev",
    "test": "nx run-many -t test",
    "lint": "nx run-many -t lint"
  },
  "devDependencies": {
    "nx": "latest",
    "typescript": "^5.3.0"
  }
}
```

Keep all existing `dependencies` and `devDependencies` — only add to them, don't remove.

---

- [ ] **Step 5: Create `apps/mobile/` directory and move Expo files**

```bash
mkdir -p apps/mobile
# Move all Expo source directories
mv app apps/mobile/app
mv components apps/mobile/components
mv stores apps/mobile/stores
mv lib apps/mobile/lib
mv __tests__ apps/mobile/__tests__
# Move config files
mv app.json apps/mobile/app.json
mv jest.config.js apps/mobile/jest.config.js
mv jest-setup.js apps/mobile/jest-setup.js
# Move babel config if it exists
[ -f babel.config.js ] && mv babel.config.js apps/mobile/babel.config.js
# Move types (will migrate to libs/types in Task 2, but keep a copy for now)
cp -r types apps/mobile/types
```

---

- [ ] **Step 6: Create `apps/mobile/tsconfig.json`**

This replaces the root `tsconfig.json` for the mobile app:

```json
{
  "extends": ["expo/tsconfig", "../../tsconfig.base.json"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@gash/types": ["../../libs/types/src/index.ts"],
      "@gash/schemas": ["../../libs/schemas/src/index.ts"],
      "@gash/constants": ["../../libs/constants/src/index.ts"],
      "@gash/api-client": ["../../libs/api-client/src/index.ts"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "**/*.spec.ts", "**/*.test.ts"]
}
```

Note: `@/*` alias stays pointing to `apps/mobile/*` so existing internal imports keep working.

---

- [ ] **Step 7: Create `apps/mobile/project.json`**

```json
{
  "name": "mobile",
  "projectType": "application",
  "root": "apps/mobile",
  "sourceRoot": "apps/mobile",
  "targets": {
    "start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "expo start",
        "cwd": "apps/mobile"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "jest",
        "cwd": "apps/mobile"
      }
    }
  }
}
```

---

- [ ] **Step 8: Update `apps/mobile/jest.config.js`**

The paths change because Jest runs from `apps/mobile/` now. Open `apps/mobile/jest.config.js` and update `setupFilesAfterFramework` and `moduleNameMapper` if they reference root-relative paths. Typical fix:

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: ['./jest-setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@gash/types$': '<rootDir>/../../libs/types/src/index.ts',
    '^@gash/schemas$': '<rootDir>/../../libs/schemas/src/index.ts',
    '^@gash/constants$': '<rootDir>/../../libs/constants/src/index.ts',
    '^@gash/api-client$': '<rootDir>/../../libs/api-client/src/index.ts',
  },
}
```

---

- [ ] **Step 9: Verify Expo Go still works**

```bash
cd apps/mobile && npx expo start
```

Expected: QR code appears, app loads in Expo Go, all 5 tabs are visible, RTL layout intact. If any import fails, the error will point to a missing path — fix by updating that specific import.

---

- [ ] **Step 10: Commit**

```bash
git add nx.json tsconfig.base.json apps/mobile/ package.json
git commit -m "feat(infra): initialize Nx workspace, move Expo app to apps/mobile"
```

---

## Task 2: libs Scaffold

**Goal:** Create the four shared libs (`types`, `schemas`, `constants`, `api-client` shell). Migrate existing types and constants. Update all stores to use `@gash/types`.

**Files:**
- Create: `libs/types/`, `libs/schemas/`, `libs/constants/` (full structure)
- Create: `libs/api-client/` (package + tsconfig only — implementation in Task 4)
- Modify: all files importing `@/types`
- Delete: `apps/mobile/types/index.ts` (after migration)

---

- [ ] **Step 1: Create `libs/types/` structure**

```bash
mkdir -p libs/types/src
```

Create `libs/types/package.json`:

```json
{
  "name": "@gash/types",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

Create `libs/types/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src/**/*.ts"]
}
```

---

- [ ] **Step 2: Migrate types to `libs/types/src/index.ts`**

Copy the content from `apps/mobile/types/index.ts` and add the new request/response types needed by the API:

```ts
// libs/types/src/index.ts

// ─── Domain types ───────────────────────────────────────────────────────────

export type ApproachType = 'direct' | 'situational' | 'humor' | 'online'
export type FollowUpType = 'meeting' | 'text' | 'instagram' | 'nothing'

export interface Approach {
  id: string
  user_id: string
  date: string
  location: string | null
  approach_type: ApproachType
  opener: string | null
  response: string | null
  chemistry_score: number | null
  follow_up: FollowUpType | null
  notes: string | null
  created_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface WeeklyMission {
  id: string
  title: string
  description: string
  target_count: number
  week_identifier: string
}

export interface OnboardingData {
  initialStyle: ApproachType
  mainChallenge: string
  preferredLocations: string[]
}

export interface UserInsights {
  user_id: string
  weekly_mission: WeeklyMission | null
  missions_completed: number
  streak: number
  last_analysis_at: string | null
  onboarding_data: OnboardingData | null
  updated_at: string
}

// ─── API Request/Response types ─────────────────────────────────────────────

export interface CoachRequest {
  message: string
}

export interface CoachResponse {
  reply: string
  messageId: string
}

export interface OnboardingRequest {
  message: string
  step: 1 | 2 | 3 | 4
}

export interface OnboardingResponse {
  reply: string
  step: 1 | 2 | 3 | 4
  profile?: OnboardingData
}

export interface ReplyCoachRequest {
  screenshot?: string
  messages?: string[]
}

export interface ReplyCoachResponse {
  analysis: string
  suggestions: string[]
}

export interface OpenerRequest {
  location: string
  context?: string
}

export interface OpenerResponse {
  openers: string[]
  followUp: string
}

export interface CreateApproachRequest {
  date: string
  location?: string
  approach_type: ApproachType
  opener?: string
  response?: string
  chemistry_score?: number
  follow_up?: FollowUpType
  notes?: string
}

export interface ApproachFeedbackResponse {
  approach: Approach
  feedback: string
}

export interface InsightsResponse {
  insights: string[]
  weekly_mission: WeeklyMission
}

// ─── User context (passed to agents) ────────────────────────────────────────

export interface UserProfile {
  totalApproaches: number
  bestType: ApproachType | null
  worstType: ApproachType | null
  bestRate: number
  avgChemistry: number
  recentPattern: string
}
```

---

- [ ] **Step 3: Install `@gash/types` so it's available to all apps**

```bash
cd /path/to/gash/root && npm install
```

npm workspaces will symlink `@gash/types` into `node_modules/@gash/types`.

---

- [ ] **Step 4: Update imports in `apps/mobile/stores/useChatStore.ts`**

Replace:
```ts
import type { ChatMessage } from '@/types'
```
With:
```ts
import type { ChatMessage } from '@gash/types'
```

---

- [ ] **Step 5: Search and update all remaining `@/types` imports in mobile**

```bash
grep -r "from '@/types'" apps/mobile --include="*.ts" --include="*.tsx" -l
```

For each file found, replace `from '@/types'` with `from '@gash/types'`.

Run the app to verify no import errors:
```bash
cd apps/mobile && npx expo start --no-dev --minify
```
Expected: builds without errors.

---

- [ ] **Step 6: Delete the old types file**

```bash
rm -rf apps/mobile/types
```

---

- [ ] **Step 7: Create `libs/schemas/`**

```bash
mkdir -p libs/schemas/src
```

`libs/schemas/package.json`:
```json
{
  "name": "@gash/schemas",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

`libs/schemas/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src/**/*.ts"]
}
```

`libs/schemas/src/index.ts`:
```ts
import { z } from 'zod'

export const ApproachTypeSchema = z.enum(['direct', 'situational', 'humor', 'online'])
export const FollowUpTypeSchema = z.enum(['meeting', 'text', 'instagram', 'nothing'])

export const CreateApproachSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'תאריך לא תקין'),
  location: z.string().max(100).optional(),
  approach_type: ApproachTypeSchema,
  opener: z.string().max(500).optional(),
  response: z.string().max(500).optional(),
  chemistry_score: z.number().int().min(1).max(10).optional(),
  follow_up: FollowUpTypeSchema.optional(),
  notes: z.string().max(1000).optional(),
})

export const CoachRequestSchema = z.object({
  message: z.string().min(1).max(2000),
})

export const OnboardingRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  step: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
})

export const ReplyCoachRequestSchema = z.object({
  messages: z.array(z.string()).max(20).optional(),
})

export const OpenerRequestSchema = z.object({
  location: z.string().min(1).max(100),
  context: z.string().max(200).optional(),
})

export type CreateApproachInput = z.infer<typeof CreateApproachSchema>
export type CoachRequestInput = z.infer<typeof CoachRequestSchema>
export type OnboardingRequestInput = z.infer<typeof OnboardingRequestSchema>
export type ReplyCoachRequestInput = z.infer<typeof ReplyCoachRequestSchema>
export type OpenerRequestInput = z.infer<typeof OpenerRequestSchema>
```

---

- [ ] **Step 8: Create `libs/constants/`**

```bash
mkdir -p libs/constants/src
```

`libs/constants/package.json`:
```json
{
  "name": "@gash/constants",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

`libs/constants/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src/**/*.ts"]
}
```

`libs/constants/src/index.ts`:
```ts
import type { ApproachType, FollowUpType } from '@gash/types'

export const APPROACH_TYPE_LABELS: Record<ApproachType, string> = {
  direct: 'ישירה',
  situational: 'סיטואציונלית',
  humor: 'הומוריסטית',
  online: 'אונליין',
}

export const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  meeting: 'פגישה',
  text: 'הודעה',
  instagram: 'אינסטגרם',
  nothing: 'לא כלום',
}

export const CHEMISTRY_MIN = 1
export const CHEMISTRY_MAX = 10
export const CHAT_HISTORY_WINDOW = 15
export const MAX_INSIGHTS_APPROACHES = 30
```

---

- [ ] **Step 9: Create `libs/api-client/` skeleton (implementation in Task 4)**

```bash
mkdir -p libs/api-client/src/endpoints
```

`libs/api-client/package.json`:
```json
{
  "name": "@gash/api-client",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

`libs/api-client/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist" },
  "include": ["src/**/*.ts"]
}
```

`libs/api-client/src/index.ts` (stub, replaced in Task 4):
```ts
export {}
```

---

- [ ] **Step 10: Run `npm install` to register all libs as workspace packages**

```bash
npm install
```

Expected: `node_modules/@gash/types`, `@gash/schemas`, `@gash/constants`, `@gash/api-client` all symlinked.

---

- [ ] **Step 11: Verify Expo still works with updated imports**

```bash
cd apps/mobile && npx expo start
```

Expected: App loads in Expo Go with no TypeScript errors.

---

- [ ] **Step 12: Commit**

```bash
git add libs/ apps/mobile/stores/ apps/mobile/jest.config.js
git commit -m "feat(libs): scaffold types, schemas, constants, api-client libs; migrate @/types to @gash/types"
```

---

## Task 3: apps/server — Next.js + All Agents

**Goal:** Create the Next.js server with all 8 AI agents and 7 API routes. All Claude API calls live here. Server verifies JWT on every request.

**Files:** `apps/server/` — full structure (see File Map above)

**Note on agent prompts:** The full Hebrew prompts live in `.planning/agents-prompts.md`. Read that file before implementing each agent function — the prompts are already written and just need to be wrapped in TypeScript functions.

---

- [ ] **Step 1: Create `apps/server/` and install Next.js**

```bash
mkdir -p apps/server/app/api/coach/onboarding
mkdir -p apps/server/app/api/coach/reply
mkdir -p apps/server/app/api/coach/opener
mkdir -p apps/server/app/api/approaches
mkdir -p apps/server/app/api/insights
mkdir -p apps/server/lib/agents
mkdir -p apps/server/__tests__/agents
```

`apps/server/package.json`:
```json
{
  "name": "@gash/server",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3001",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.36.3",
    "@supabase/supabase-js": "^2.102.1",
    "@gash/types": "*",
    "@gash/schemas": "*",
    "@gash/constants": "*",
    "next": "^15.1.0",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "~18.3.1",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.11",
    "ts-jest": "^29.0.0",
    "typescript": "^5.3.0"
  }
}
```

```bash
cd apps/server && npm install
```

---

- [ ] **Step 2: Create `apps/server/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@gash/types": ["../../libs/types/src/index.ts"],
      "@gash/schemas": ["../../libs/schemas/src/index.ts"],
      "@gash/constants": ["../../libs/constants/src/index.ts"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

- [ ] **Step 3: Create `apps/server/next.config.ts`**

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@gash/types', '@gash/schemas', '@gash/constants'],
}

export default nextConfig
```

---

- [ ] **Step 4: Create minimal `apps/server/app/layout.tsx`**

Required by Next.js App Router:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

---

- [ ] **Step 5: Create `apps/server/lib/supabase.ts`**

Server-side Supabase client — uses service role key (never exposed to client):

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client: bypasses RLS — use only server-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// User-scoped client for verifying JWTs
export const createUserClient = (accessToken: string) =>
  createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
```

---

- [ ] **Step 6: Create `apps/server/lib/auth.ts`**

JWT verification middleware used by every API route:

```ts
import { createUserClient } from './supabase'
import type { User } from '@supabase/supabase-js'

export async function verifyAuth(request: Request): Promise<User | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.replace('Bearer ', '')
  const client = createUserClient(token)
  const { data: { user }, error } = await client.auth.getUser()

  if (error || !user) return null
  return user
}

export function unauthorizedResponse() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

- [ ] **Step 7: Create `apps/server/lib/claude.ts`**

Thin wrapper around Anthropic SDK:

```ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY!,
})

export const HAIKU = 'claude-haiku-4-5-20251001'
export const SONNET = 'claude-sonnet-4-6'

export async function callClaude(options: {
  model: string
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
}): Promise<string> {
  const response = await anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens ?? 1024,
    system: options.system,
    messages: options.messages,
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}

// For JSON agents: uses prefill to force JSON output
export async function callClaudeJSON<T>(options: {
  model: string
  system: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
}): Promise<T> {
  const messagesWithPrefill = [
    ...options.messages,
    { role: 'assistant' as const, content: '{' },
  ]

  const response = await anthropic.messages.create({
    model: options.model,
    max_tokens: options.maxTokens ?? 1024,
    system: options.system,
    messages: messagesWithPrefill,
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type')
  return JSON.parse('{' + block.text) as T
}
```

---

- [ ] **Step 8: Write failing test for agent router**

`apps/server/__tests__/agents/router.test.ts`:

```ts
import { detectIntent } from '../../lib/agents/router'

describe('detectIntent', () => {
  it('returns boost for approach-intent phrases', () => {
    expect(detectIntent('יש פה בחורה מגניבה, מה לעשות?')).toBe('boost')
    expect(detectIntent('אני עומד ללכת אליה')).toBe('boost')
  })

  it('returns debrief for low-chemistry context', () => {
    expect(detectIntent('היה ממש גרוע, היא הסתלקה')).toBe('debrief')
    expect(detectIntent('ניסיתי ולא הלך, הרגשתי נכשל')).toBe('debrief')
  })

  it('returns coach as default', () => {
    expect(detectIntent('שלום, מה שלומך?')).toBe('coach')
    expect(detectIntent('תן לי טיפ לפתיחה')).toBe('coach')
  })
})
```

---

- [ ] **Step 9: Run test to verify it fails**

```bash
cd apps/server && npx jest __tests__/agents/router.test.ts
```

Expected: FAIL — `detectIntent` not defined.

---

- [ ] **Step 10: Create `apps/server/lib/agents/router.ts`**

```ts
export type AgentType = 'coach' | 'boost' | 'debrief'

const BOOST_PATTERNS = [
  /יש פה/,
  /עומד ל/,
  /הולך ל/,
  /רוצה לפנות/,
  /מה לעשות עכשיו/,
  /יש בחורה/,
  /ראיתי אותה/,
]

const DEBRIEF_PATTERNS = [
  /לא הלך/,
  /נכשל/,
  /גרוע/,
  /היא הסתלקה/,
  /דחתה/,
  /ממש רע/,
  /הרגשתי נורא/,
]

export function detectIntent(message: string): AgentType {
  const lower = message.toLowerCase()

  if (BOOST_PATTERNS.some((p) => p.test(lower))) return 'boost'
  if (DEBRIEF_PATTERNS.some((p) => p.test(lower))) return 'debrief'
  return 'coach'
}
```

---

- [ ] **Step 11: Run test to verify it passes**

```bash
cd apps/server && npx jest __tests__/agents/router.test.ts
```

Expected: PASS — 3 tests passing.

---

- [ ] **Step 12: Create the 8 agent files**

For each agent: read the corresponding prompt from `.planning/agents-prompts.md` and wrap it in a TypeScript function.

**`apps/server/lib/agents/coach.ts`:**
```ts
import { callClaude, HAIKU } from '../claude'
import { supabaseAdmin } from '../supabase'
import type { UserProfile, ChatMessage } from '@gash/types'

export async function buildUserProfile(userId: string): Promise<UserProfile> {
  const { data: approaches } = await supabaseAdmin
    .from('approaches')
    .select('approach_type, chemistry_score, follow_up')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (!approaches || approaches.length === 0) {
    return { totalApproaches: 0, bestType: null, worstType: null, bestRate: 0, avgChemistry: 0, recentPattern: 'משתמש חדש' }
  }

  const typeCounts: Record<string, { total: number; success: number }> = {}
  let chemTotal = 0

  for (const a of approaches) {
    const t = a.approach_type
    if (!typeCounts[t]) typeCounts[t] = { total: 0, success: 0 }
    typeCounts[t].total++
    if (a.follow_up && a.follow_up !== 'nothing') typeCounts[t].success++
    if (a.chemistry_score) chemTotal += a.chemistry_score
  }

  const typeRates = Object.entries(typeCounts).map(([type, { total, success }]) => ({
    type,
    rate: Math.round((success / total) * 100),
  }))

  typeRates.sort((a, b) => b.rate - a.rate)

  const recentTypes = approaches.slice(0, 5).map((a) => a.approach_type)
  const recentPattern = recentTypes.length > 0
    ? `לאחרונה עשה הרבה גישות ${recentTypes[0]}`
    : 'אין מספיק נתונים'

  return {
    totalApproaches: approaches.length,
    bestType: (typeRates[0]?.type as any) ?? null,
    worstType: (typeRates[typeRates.length - 1]?.type as any) ?? null,
    bestRate: typeRates[0]?.rate ?? 0,
    avgChemistry: Math.round(chemTotal / approaches.length),
    recentPattern,
  }
}

function buildSystemPrompt(profile: UserProfile): string {
  if (profile.totalApproaches < 5) {
    return `אתה גש — מאמן דייטינג אישי. המשתמש עדיין חדש ואין לך נתונים עליו.
תן עצות כלליות טובות וישיר. עודד אותו לתעד גישות — אחרי 5 תיעודים תוכל לתת עצות מותאמות אישית.
שפה: עברית, ישיר, קצר.`
  }

  return `אתה גש — המאמן הדייטינג האישי שלי. אתה מכיר אותי, יודע מה עבד לי ומה לא, ומדבר איתי בגובה העיניים.

מה שאתה יודע עליי:
- ביצעתי ${profile.totalApproaches} פניות עד היום
- הגישה שעובדת לי הכי טוב: ${profile.bestType} — הצלחה של ${profile.bestRate}%
- הגישה שפחות עובדת לי: ${profile.worstType}
- ציון כימיה ממוצע שלי: ${profile.avgChemistry}/10
- מה קרה לאחרונה: ${profile.recentPattern}

הסגנון שלך בתשובות:
- ישיר ולעניין — לא מרצה, לא מטיף
- מצחיק כשזה מתאים, רציני כשצריך
- מכיר ישראל לעומק: בסיס, רכבת, קפה, שוק, אוניברסיטה, מועדון, חוף
- תמיד נותן משהו קונקרטי לעשות — לא "תהיה עצמך"
- כשאני שואל "מה להגיד" — תן משפט מוכן, לא תיאוריה
- לא מדרבן משחקי כוח או מניפולציה — מתמקד בחיבור אמיתי

אורך תשובה: 2-4 משפטים. אם אני מבקש אפשרויות — תן 3 בדיוק, ממוספרות.
שפה: עברית בלבד. סלנג ישראלי מותר ומעודד.`
}

export async function runCoachAgent(
  userId: string,
  message: string
): Promise<string> {
  // Fetch last 15 messages for context window
  const { data: history } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(15)

  const messages: { role: 'user' | 'assistant'; content: string }[] = [
    ...(history ?? []).reverse(),
    { role: 'user', content: message },
  ]

  const profile = await buildUserProfile(userId)
  const system = buildSystemPrompt(profile)

  return callClaude({ model: HAIKU, system, messages })
}
```

**`apps/server/lib/agents/boost.ts`:**
```ts
import { callClaude, HAIKU } from '../claude'

const SYSTEM = `אתה גש — המאמן. המשתמש עומד לגשת עכשיו.
תן לו 2 משפטים בלבד: ביטחון + פתיחה מוכנה.
דוגמה: "אתה מוכן לזה. לך אליה ואמור: 'סליחה, חייב לבוא לומר לך שאת מדהימה, איך קוראים לך?'"
שפה: עברית, ישיר, ללא הסברים.`

export async function runBoostAgent(message: string): Promise<string> {
  return callClaude({
    model: HAIKU,
    system: SYSTEM,
    messages: [{ role: 'user', content: message }],
    maxTokens: 200,
  })
}
```

**`apps/server/lib/agents/debrief.ts`:**
```ts
import { callClaude, HAIKU } from '../claude'

const SYSTEM = `אתה גש — המאמן. המשתמש עבר גישה לא מוצלחת (כימיה ≤4 או תגובה שלילית).
שלב 1: שאל שאלה קצרה אחת כדי להבין מה קרה בדיוק.
שלב 2 (בקריאה הבאה): תן אבחנה קצרה ושלב אחד קונקרטי לשיפור.
שפה: עברית, אמפתי אך ישיר, לא מרצה.`

export async function runDebriefAgent(
  messages: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
  return callClaude({ model: HAIKU, system: SYSTEM, messages })
}
```

**`apps/server/lib/agents/approach-feedback.ts`:**
```ts
import { callClaudeJSON, HAIKU } from '../claude'
import type { ApproachType } from '@gash/types'

const SYSTEM = `אתה גש — המאמן. המשתמש זה עתה תיעד גישה.
החזר JSON בלבד: {"feedback":"...","tip":"..."}
feedback: משפט אחד בעברית המעריך את הגישה (מחמיא אך אמיתי)
tip: טיפ קצר לשיפור בגישה הבאה מאותו סוג
שפה: עברית, קצר וישיר.`

interface ApproachFeedbackData {
  feedback: string
  tip: string
}

export async function runApproachFeedbackAgent(approach: {
  approach_type: ApproachType
  chemistry_score: number | null
  follow_up: string | null
  opener: string | null
}): Promise<ApproachFeedbackData> {
  const message = `גישה: ${approach.approach_type}, כימיה: ${approach.chemistry_score ?? '?'}/10, תוצאה: ${approach.follow_up ?? 'לא ידוע'}, פתיחה: ${approach.opener ?? 'לא צוין'}`

  return callClaudeJSON<ApproachFeedbackData>({
    model: HAIKU,
    system: SYSTEM,
    messages: [{ role: 'user', content: message }],
    maxTokens: 300,
  })
}
```

**`apps/server/lib/agents/situation-opener.ts`:**
```ts
import { callClaudeJSON, HAIKU } from '../claude'

const SYSTEM = `אתה גש — המאמן. המשתמש נמצא במיקום מסוים ורוצה פתיחות.
החזר JSON בלבד: {"openers":["...","...","..."],"followUp":"..."}
openers: 3 פתיחות שונות — ישירה, סיטואציונלית, הומוריסטית
followUp: שאלת המשך אחת אחרי שהיא מגיבה חיובית
שפה: עברית, ישראלי, לא קלישאות.`

interface OpenerData {
  openers: string[]
  followUp: string
}

export async function runSituationOpenerAgent(location: string, context?: string): Promise<OpenerData> {
  const message = `מיקום: ${location}${context ? `, הקשר: ${context}` : ''}`

  return callClaudeJSON<OpenerData>({
    model: HAIKU,
    system: SYSTEM,
    messages: [{ role: 'user', content: message }],
    maxTokens: 400,
  })
}
```

**`apps/server/lib/agents/insights.ts`:**
```ts
import { callClaudeJSON, HAIKU } from '../claude'
import { supabaseAdmin } from '../supabase'
import type { WeeklyMission } from '@gash/types'

const SYSTEM = `אתה גש — המאמן. נתח את הנתונים של המשתמש.
החזר JSON בלבד: {"insights":["...","..."],"weekly_mission":{"title":"...","description":"...","target_count":5,"week_identifier":"..."}}
insights: 2 תובנות אישיות בעברית מהנתונים
weekly_mission: משימה שבועית מותאמת לנתונים
שפה: עברית, ממוקד, נתוני.`

interface InsightsData {
  insights: string[]
  weekly_mission: Omit<WeeklyMission, 'id'>
}

export async function runInsightsAgent(userId: string): Promise<InsightsData> {
  const { data: approaches } = await supabaseAdmin
    .from('approaches')
    .select('approach_type, chemistry_score, follow_up, date')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30)

  const summary = JSON.stringify(approaches ?? [])

  return callClaudeJSON<InsightsData>({
    model: HAIKU,
    system: SYSTEM,
    messages: [{ role: 'user', content: `נתוני הגישות האחרונות: ${summary}` }],
    maxTokens: 500,
  })
}
```

**`apps/server/lib/agents/reply-coach.ts`:**
```ts
import { callClaudeJSON, SONNET } from '../claude'

const SYSTEM = `אתה גש — המאמן. נתח שיחת טקסט ותן 3 תגובות.
החזר JSON בלבד: {"analysis":"...","suggestions":["...","...","..."]}
analysis: 1-2 משפטים על הדינמיקה בשיחה
suggestions: 3 תגובות שונות — ישירה, קלה, מסקרנת
שפה: עברית, ישראלי, לא פורמלי.`

interface ReplyCoachData {
  analysis: string
  suggestions: string[]
}

export async function runReplyCoachAgent(messages: string[]): Promise<ReplyCoachData> {
  const thread = messages.map((m, i) => `${i % 2 === 0 ? 'הוא' : 'היא'}: ${m}`).join('\n')

  return callClaudeJSON<ReplyCoachData>({
    model: SONNET,
    system: SYSTEM,
    messages: [{ role: 'user', content: thread }],
    maxTokens: 600,
  })
}
```

**`apps/server/lib/agents/onboarding.ts`:**
```ts
import { callClaude, callClaudeJSON, HAIKU } from '../claude'
import type { OnboardingData } from '@gash/types'

const STEPS: Record<number, string> = {
  1: 'שלב 1: "מה קורה אחי! אני גש, המאמן שלך. ספר לי — מה הביא אותך לפה?"',
  2: 'שלב 2: שאל על הסגנון — "אתה יותר ישיר או יותר הומוריסטי בדרך כלל?"',
  3: 'שלב 3: שאל על האתגר — "מה הכי מאתגר אותך? הפתיחה? ההמשך? שיחת טקסט?"',
  4: 'שלב 4: שאל איפה + סכם JSON',
}

const BASE_SYSTEM = `אתה גש. המשתמש חדש — מכיר אותו ב-4 שאלות קצרות.
אתה לא מראיין — שיחה קצרה ונעימה. כל שאלה נובעת מהתשובה הקודמת.`

const JSON_SUFFIX = `\n\nסכם את המשתמש והחזר JSON בלבד: {"initialStyle":"direct|humor|situational|mixed","mainChallenge":"opening|continuation|texting|confidence","preferredLocations":[...],"motivation":"...","onboardingComplete":true}`

export async function runOnboardingAgent(
  messages: { role: 'user' | 'assistant'; content: string }[],
  step: 1 | 2 | 3 | 4
): Promise<{ reply: string; profile?: OnboardingData }> {
  const system = BASE_SYSTEM + '\n' + STEPS[step] + (step === 4 ? JSON_SUFFIX : '')

  if (step === 4) {
    const profile = await callClaudeJSON<OnboardingData & { onboardingComplete: boolean }>({
      model: HAIKU,
      system,
      messages,
      maxTokens: 400,
    })
    return { reply: 'סיימנו! אני מוכן לעזור לך.', profile }
  }

  const reply = await callClaude({ model: HAIKU, system, messages })
  return { reply }
}
```

---

- [ ] **Step 13: Create API routes**

**`apps/server/app/api/coach/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../lib/auth'
import { detectIntent } from '../../../lib/agents/router'
import { runCoachAgent } from '../../../lib/agents/coach'
import { runBoostAgent } from '../../../lib/agents/boost'
import { runDebriefAgent } from '../../../lib/agents/debrief'
import { supabaseAdmin } from '../../../lib/supabase'
import { CoachRequestSchema } from '@gash/schemas'

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = CoachRequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const { message } = parsed.data
  const intent = detectIntent(message)

  // Fetch recent messages for debrief context
  let reply: string
  if (intent === 'boost') {
    reply = await runBoostAgent(message)
  } else if (intent === 'debrief') {
    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(4)
    const messages = [...(history ?? []).reverse(), { role: 'user' as const, content: message }]
    reply = await runDebriefAgent(messages)
  } else {
    reply = await runCoachAgent(user.id, message)
  }

  // Persist both messages
  const now = new Date().toISOString()
  await supabaseAdmin.from('chat_messages').insert([
    { user_id: user.id, role: 'user', content: message, created_at: now },
    { user_id: user.id, role: 'assistant', content: reply, created_at: new Date(Date.now() + 1).toISOString() },
  ])

  return Response.json({ reply, messageId: crypto.randomUUID() })
}
```

**`apps/server/app/api/approaches/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../lib/auth'
import { supabaseAdmin } from '../../../lib/supabase'
import { runApproachFeedbackAgent } from '../../../lib/agents/approach-feedback'
import { CreateApproachSchema } from '@gash/schemas'

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = supabaseAdmin
    .from('approaches')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (type) query = query.eq('approach_type', type)
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ approaches: data })
}

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = CreateApproachSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data: approach, error } = await supabaseAdmin
    .from('approaches')
    .insert({ ...parsed.data, user_id: user.id })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const feedbackData = await runApproachFeedbackAgent(approach)

  return Response.json({ approach, feedback: feedbackData.feedback, tip: feedbackData.tip })
}
```

**`apps/server/app/api/approaches/[id]/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { CreateApproachSchema } from '@gash/schemas'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = CreateApproachSchema.partial().safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('approaches')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ approach: data })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const { error } = await supabaseAdmin
    .from('approaches')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
```

**`apps/server/app/api/coach/onboarding/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase'
import { runOnboardingAgent } from '../../../../lib/agents/onboarding'
import { OnboardingRequestSchema } from '@gash/schemas'

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = OnboardingRequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const { message, step } = parsed.data

  const { data: history } = await supabaseAdmin
    .from('chat_messages')
    .select('role, content')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(10)

  const messages = [...(history ?? []), { role: 'user' as const, content: message }]
  const result = await runOnboardingAgent(messages, step)

  if (result.profile) {
    await supabaseAdmin
      .from('user_insights')
      .upsert({ user_id: user.id, onboarding_data: result.profile, updated_at: new Date().toISOString() })
  }

  return Response.json({ reply: result.reply, step, profile: result.profile ?? null })
}
```

**`apps/server/app/api/coach/reply/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../../lib/auth'
import { runReplyCoachAgent } from '../../../../lib/agents/reply-coach'
import { ReplyCoachRequestSchema } from '@gash/schemas'

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = ReplyCoachRequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const result = await runReplyCoachAgent(parsed.data.messages ?? [])
  return Response.json(result)
}
```

**`apps/server/app/api/coach/opener/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../../lib/auth'
import { runSituationOpenerAgent } from '../../../../lib/agents/situation-opener'
import { OpenerRequestSchema } from '@gash/schemas'

export async function POST(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const body = await req.json()
  const parsed = OpenerRequestSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 })

  const result = await runSituationOpenerAgent(parsed.data.location, parsed.data.context)
  return Response.json(result)
}
```

**`apps/server/app/api/insights/route.ts`:**
```ts
import { NextRequest } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '../../../lib/auth'
import { supabaseAdmin } from '../../../lib/supabase'
import { runInsightsAgent } from '../../../lib/agents/insights'

export async function GET(req: NextRequest) {
  const user = await verifyAuth(req)
  if (!user) return unauthorizedResponse()

  const result = await runInsightsAgent(user.id)

  const weekId = `${new Date().getFullYear()}-W${String(Math.ceil(new Date().getDate() / 7)).padStart(2, '0')}`
  await supabaseAdmin.from('user_insights').upsert({
    user_id: user.id,
    weekly_mission: { ...result.weekly_mission, id: crypto.randomUUID(), week_identifier: weekId },
    last_analysis_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return Response.json(result)
}
```

---

- [ ] **Step 14: Create `apps/server/.env.example`**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CLAUDE_API_KEY=sk-ant-...
```

Copy to `.env.local` and fill in values from Supabase dashboard and Anthropic console.

---

- [ ] **Step 15: Verify server starts**

```bash
cd apps/server && npm run dev
```

Expected: `ready - started server on 0.0.0.0:3001` with no TypeScript errors.

Test an endpoint with curl (requires valid JWT from Supabase):
```bash
curl -X POST http://localhost:3001/api/coach \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"message":"שלום, תן לי טיפ"}'
```

Expected: `{"reply":"...","messageId":"..."}` with Hebrew text.

---

- [ ] **Step 16: Commit**

```bash
git add apps/server/
git commit -m "feat(server): Next.js API server with all 8 AI agents and 7 routes"
```

---

## Task 4: libs/api-client + Mobile Stores Wiring

**Goal:** Build the typed api-client library. Update mobile Zustand stores to use it instead of calling Supabase directly for data operations. Auth store remains unchanged.

**Files:**
- Implement: `libs/api-client/src/client.ts`, `libs/api-client/src/endpoints/*.ts`, `libs/api-client/src/index.ts`
- Modify: `apps/mobile/stores/useChatStore.ts`, `apps/mobile/stores/useLogStore.ts`, `apps/mobile/stores/useStatsStore.ts`
- Create: `apps/mobile/lib/server.ts`

---

- [ ] **Step 1: Create `apps/mobile/lib/server.ts`**

Reads the server URL from env and attaches the Supabase JWT:

```ts
import { supabase } from './supabase'

export const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL ?? 'http://localhost:3001'

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}
```

---

- [ ] **Step 2: Implement `libs/api-client/src/client.ts`**

```ts
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  serverUrl: string,
  path: string,
  method: HttpMethod,
  headers: Record<string, string>,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${serverUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(res.status, err.error ?? 'Request failed')
  }

  return res.json() as Promise<T>
}
```

---

- [ ] **Step 3: Implement `libs/api-client/src/endpoints/coach.ts`**

```ts
import { apiFetch } from '../client'
import type {
  CoachResponse,
  OnboardingResponse,
  ReplyCoachResponse,
  OpenerResponse,
} from '@gash/types'

export function coachEndpoints(serverUrl: string, getHeaders: () => Promise<Record<string, string>>) {
  return {
    async send(message: string): Promise<CoachResponse> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, '/api/coach', 'POST', headers, { message })
    },

    async onboarding(message: string, step: 1 | 2 | 3 | 4): Promise<OnboardingResponse> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, '/api/coach/onboarding', 'POST', headers, { message, step })
    },

    async replyCoach(messages: string[]): Promise<ReplyCoachResponse> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, '/api/coach/reply', 'POST', headers, { messages })
    },

    async opener(location: string, context?: string): Promise<OpenerResponse> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, '/api/coach/opener', 'POST', headers, { location, context })
    },
  }
}
```

---

- [ ] **Step 4: Implement `libs/api-client/src/endpoints/approaches.ts`**

```ts
import { apiFetch } from '../client'
import type { Approach, ApproachFeedbackResponse } from '@gash/types'
import type { CreateApproachInput } from '@gash/schemas'

export function approachesEndpoints(serverUrl: string, getHeaders: () => Promise<Record<string, string>>) {
  return {
    async list(filters?: { type?: string; from?: string; to?: string }): Promise<{ approaches: Approach[] }> {
      const headers = await getHeaders()
      const params = new URLSearchParams()
      if (filters?.type) params.set('type', filters.type)
      if (filters?.from) params.set('from', filters.from)
      if (filters?.to) params.set('to', filters.to)
      const qs = params.toString()
      return apiFetch(serverUrl, `/api/approaches${qs ? '?' + qs : ''}`, 'GET', headers)
    },

    async create(data: CreateApproachInput): Promise<ApproachFeedbackResponse> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, '/api/approaches', 'POST', headers, data)
    },

    async update(id: string, data: Partial<CreateApproachInput>): Promise<{ approach: Approach }> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, `/api/approaches/${id}`, 'PUT', headers, data)
    },

    async remove(id: string): Promise<{ success: boolean }> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, `/api/approaches/${id}`, 'DELETE', headers)
    },
  }
}
```

---

- [ ] **Step 5: Implement `libs/api-client/src/endpoints/insights.ts`**

```ts
import { apiFetch } from '../client'
import type { InsightsResponse } from '@gash/types'

export function insightsEndpoints(serverUrl: string, getHeaders: () => Promise<Record<string, string>>) {
  return {
    async get(): Promise<InsightsResponse> {
      const headers = await getHeaders()
      return apiFetch(serverUrl, '/api/insights', 'GET', headers)
    },
  }
}
```

---

- [ ] **Step 6: Implement `libs/api-client/src/index.ts`**

```ts
import { coachEndpoints } from './endpoints/coach'
import { approachesEndpoints } from './endpoints/approaches'
import { insightsEndpoints } from './endpoints/insights'

export { ApiError } from './client'

export function createGashClient(
  serverUrl: string,
  getHeaders: () => Promise<Record<string, string>>
) {
  return {
    coach: coachEndpoints(serverUrl, getHeaders),
    approaches: approachesEndpoints(serverUrl, getHeaders),
    insights: insightsEndpoints(serverUrl, getHeaders),
  }
}

export type GashClient = ReturnType<typeof createGashClient>
```

---

- [ ] **Step 7: Update `apps/mobile/stores/useChatStore.ts`**

Replace the stub implementation with real api-client calls:

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ChatMessage } from '@gash/types'
import { createGashClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '../lib/server'

const client = createGashClient(SERVER_URL, getAuthHeaders)

interface ChatStore {
  messages: ChatMessage[]
  loading: boolean
  sendMessage: (text: string) => Promise<void>
  loadHistory: () => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      loading: false,

      sendMessage: async (text: string) => {
        const userMessage: ChatMessage = {
          id: Math.random().toString(36),
          user_id: '',
          role: 'user',
          content: text,
          created_at: new Date().toISOString(),
        }
        set((s) => ({ messages: [...s.messages, userMessage], loading: true }))

        try {
          const { reply, messageId } = await client.coach.send(text)
          const aiMessage: ChatMessage = {
            id: messageId,
            user_id: '',
            role: 'assistant',
            content: reply,
            created_at: new Date().toISOString(),
          }
          set((s) => ({ messages: [...s.messages, aiMessage], loading: false }))
        } catch {
          set({ loading: false })
          throw new Error('שגיאה בשליחת ההודעה. נסה שוב.')
        }
      },

      loadHistory: async () => {
        // Chat history is managed by the server; local store is the source of truth
        // for the current session. Reload from persisted AsyncStorage on mount.
      },
    }),
    {
      name: 'gash-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    }
  )
)
```

---

- [ ] **Step 8: Update `apps/mobile/stores/useLogStore.ts`**

Replace any direct Supabase data calls with api-client (this store is a stub from Phase 1 — implement it for real here):

```ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Approach } from '@gash/types'
import type { CreateApproachInput } from '@gash/schemas'
import { createGashClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '../lib/server'

const client = createGashClient(SERVER_URL, getAuthHeaders)

interface LogStore {
  approaches: Approach[]
  loading: boolean
  lastFeedback: string | null
  loadApproaches: (filters?: { type?: string; from?: string; to?: string }) => Promise<void>
  addApproach: (data: CreateApproachInput) => Promise<void>
  editApproach: (id: string, data: Partial<CreateApproachInput>) => Promise<void>
  deleteApproach: (id: string) => Promise<void>
}

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      approaches: [],
      loading: false,
      lastFeedback: null,

      loadApproaches: async (filters) => {
        set({ loading: true })
        try {
          const { approaches } = await client.approaches.list(filters)
          set({ approaches, loading: false })
        } catch {
          set({ loading: false })
        }
      },

      addApproach: async (data) => {
        const { approach, feedback } = await client.approaches.create(data)
        set((s) => ({ approaches: [approach, ...s.approaches], lastFeedback: feedback }))
      },

      editApproach: async (id, data) => {
        const { approach } = await client.approaches.update(id, data)
        set((s) => ({
          approaches: s.approaches.map((a) => (a.id === id ? approach : a)),
        }))
      },

      deleteApproach: async (id) => {
        await client.approaches.remove(id)
        set((s) => ({ approaches: s.approaches.filter((a) => a.id !== id) }))
      },
    }),
    {
      name: 'gash-log',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ approaches: state.approaches }),
    }
  )
)
```

---

- [ ] **Step 9: Update `apps/mobile/stores/useStatsStore.ts`**

Replace stub with api-client call for insights:

```ts
import { create } from 'zustand'
import type { UserInsights } from '@gash/types'
import { createGashClient } from '@gash/api-client'
import { SERVER_URL, getAuthHeaders } from '../lib/server'

const client = createGashClient(SERVER_URL, getAuthHeaders)

interface StatsStore {
  insights: UserInsights | null
  loading: boolean
  loadInsights: () => Promise<void>
}

export const useStatsStore = create<StatsStore>()((set) => ({
  insights: null,
  loading: false,

  loadInsights: async () => {
    set({ loading: true })
    try {
      const data = await client.insights.get()
      set({
        insights: {
          user_id: '',
          weekly_mission: data.weekly_mission,
          missions_completed: 0,
          streak: 0,
          last_analysis_at: new Date().toISOString(),
          onboarding_data: null,
          updated_at: new Date().toISOString(),
        },
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },
}))
```

---

- [ ] **Step 10: Add `EXPO_PUBLIC_SERVER_URL` to mobile `.env`**

In `apps/mobile/.env` (create if doesn't exist):
```
EXPO_PUBLIC_SERVER_URL=http://localhost:3001
```

---

- [ ] **Step 11: End-to-end smoke test**

With the Next.js server running (`cd apps/server && npm run dev`) and Expo running (`cd apps/mobile && npx expo start`):

1. Open app in Expo Go
2. Auth with phone OTP
3. Go to Coach tab, send a message
4. Expected: Hebrew reply appears with typewriter animation
5. Check server console: request logged, Claude call made

---

- [ ] **Step 12: Commit**

```bash
git add libs/api-client/ apps/mobile/stores/ apps/mobile/lib/server.ts apps/mobile/.env
git commit -m "feat(api-client): implement typed client; wire mobile stores to Next.js server"
```

---

## Task 5: Cleanup + Vercel Deploy

**Goal:** Delete Supabase Edge Functions (now redundant), configure Vercel, deploy, and point mobile to production.

---

- [ ] **Step 1: Delete Supabase Edge Function**

```bash
rm -rf supabase/functions/ask-coach
```

Verify nothing else references it:
```bash
grep -r "ask-coach" apps/mobile --include="*.ts" --include="*.tsx"
```

Expected: no results.

---

- [ ] **Step 2: Create `apps/server/vercel.json`**

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-role-key",
    "CLAUDE_API_KEY": "@claude-api-key"
  }
}
```

---

- [ ] **Step 3: Add `apps/server/project.json` Nx target for Vercel**

Add to existing `apps/server/project.json` targets:

```json
"deploy": {
  "executor": "nx:run-commands",
  "options": {
    "command": "vercel --prod",
    "cwd": "apps/server"
  }
}
```

---

- [ ] **Step 4: Deploy to Vercel**

```bash
# Install Vercel CLI if not present
npm install -g vercel

cd apps/server
vercel login
vercel link          # links to Vercel project
# Add env vars in Vercel dashboard: Settings → Environment Variables
# Add: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, CLAUDE_API_KEY
vercel --prod
```

Expected: deployment URL printed, e.g. `https://gash-server.vercel.app`

---

- [ ] **Step 5: Update mobile production env**

In `apps/mobile/.env`:
```
EXPO_PUBLIC_SERVER_URL=https://gash-server.vercel.app
```

(Keep `http://localhost:3001` for dev. Use `.env.local` for local overrides.)

---

- [ ] **Step 6: Production smoke test**

With real Vercel URL, test from Expo Go:
1. Send a chat message
2. Log an approach
3. Check dashboard insights

Expected: all three work with real Claude responses.

---

- [ ] **Step 7: Final commit**

```bash
git add supabase/ apps/server/vercel.json apps/server/project.json apps/mobile/.env
git commit -m "feat(deploy): remove Edge Functions, add Vercel config, point mobile to production server"
```

---

## Self-Review

**Spec coverage:**
- ✅ Nx monorepo structure (Task 1)
- ✅ `libs/types`, `libs/schemas`, `libs/constants`, `libs/api-client` (Task 2)
- ✅ All 8 agents: coach, boost, debrief, onboarding, reply-coach, situation-opener, approach-feedback, insights (Task 3)
- ✅ All 7 API routes: /api/coach, /api/coach/onboarding, /api/coach/reply, /api/coach/opener, /api/approaches, /api/approaches/[id], /api/insights (Task 3)
- ✅ JWT auth on every server request (Task 3 — auth.ts)
- ✅ Auth stays direct to Supabase from mobile (Task 4 — server.ts uses existing supabase session)
- ✅ Stores updated to use api-client (Task 4)
- ✅ Edge Functions deleted (Task 5)
- ✅ Vercel deploy (Task 5)
- ✅ Service role key never on client (Task 3 — supabase.ts)
- ✅ `@gash/*` path aliases consistent across all tasks

**Type consistency check:**
- `ChatMessage`, `Approach`, `UserInsights`, `WeeklyMission` — defined in Task 2, used in Tasks 3 and 4
- `CoachResponse.reply` used in Task 4 `useChatStore` — matches Task 3 `/api/coach` response `{ reply, messageId }`
- `ApproachFeedbackResponse.feedback` used in Task 4 `useLogStore` — matches Task 3 POST `/api/approaches` response
- `createGashClient` defined in Task 4 Step 6, used in Task 4 Steps 7-9 — consistent
- `getAuthHeaders` defined in Task 4 Step 1 (`apps/mobile/lib/server.ts`), imported in Steps 7-9 — consistent

**No placeholders found.**
