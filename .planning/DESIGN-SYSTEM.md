# Design System Strategy: The Digital Architect

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Digital Architect."** 

For the modern Israeli man, dating isn't about luck; it's about strategy, confidence, and structure. This system moves away from the "gamified" or "cluttered" aesthetic of typical social apps, opting instead for a high-end editorial feel that mimics a premium workspace or a luxury automotive interface. 

We break the "template" look by utilizing **intentional asymmetry** and **tonal depth**. By leaning into a 100% RTL (Right-to-Left) architecture, we prioritize the natural scanning patterns of the Hebrew language, using bold, confident typography to anchor the eye and layered surfaces to create a sense of private, secure space.

---

## 2. Colors & Surface Philosophy
The palette is rooted in deep, masculine tones (`#0e0e0e`) contrasted with the hyper-modern "AI Intelligence" of Electric Teal (`#81ecff`).

### The "No-Line" Rule
To achieve a signature, premium feel, **1px solid borders are strictly prohibited for sectioning.** Conventional borders create visual noise. Instead, define boundaries through:
*   **Background Shifts:** Use `surface-container-low` sections against a `surface` background.
*   **Tonal Transitions:** Define areas by moving from `surface-container` to `surface-container-highest`.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
*   **Base:** `surface` (#0e0e0e)
*   **Secondary Content:** `surface-container-low` (#131313)
*   **Interactive Cards:** `surface-container` (#1a1a1a)
*   **Elevated Actions:** `surface-container-high` (#20201f)

### The "Glass & Gradient" Rule
For elements that represent the AI's "presence" (coaching bubbles, floating action buttons), use Glassmorphism. Apply `surface-variant` with a 60% opacity and a 16px backdrop-blur. 
**Signature Texture:** Main CTAs should not be flat. Use a subtle linear gradient from `primary` (#81ecff) to `primary-dim` (#00d4ec) at a 135-degree angle to provide a "lit from within" tech-forward glow.

---

## 3. Typography: Editorial Confidence
The typography uses a high-contrast scale to convey authority. We utilize **Plus Jakarta Sans** for Latin characters/numbers and **Inter** (or a local equivalent like **Heebo**) for Hebrew body text.

*   **Display (Large/Medium):** Use `display-lg` (3.5rem) for motivational milestones. This is the "Voice of God" in the app—bold, centered, and unapologetic.
*   **Headlines:** `headline-lg` (2rem) and `headline-md` (1.75rem) use **Plus Jakarta Sans** to feel architectural. They should always be "Extra Bold" to signify confidence.
*   **Body Text:** `body-lg` (1rem) uses **Inter**. It is optimized for readability with a generous line-height (1.6) to ensure the Hebrew script doesn't feel cramped.
*   **Labels:** `label-md` (0.75rem) is reserved for metadata, using `on-surface-variant` (#adaaaa) to sit quietly in the background.

---

## 4. Elevation & Depth: Tonal Layering
We do not use standard drop shadows. We use light.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This "recessed" look creates depth without adding "weight."
*   **Ambient Shadows:** For floating elements (like an AI tip card), use a shadow with a 32px blur, 0px offset, and 6% opacity of the `on-surface` color. It should feel like a soft glow, not a dark smudge.
*   **The Ghost Border Fallback:** If a distinction is absolutely required (e.g., in high-glare outdoor settings), use a "Ghost Border": `outline-variant` (#484847) at **15% opacity**.
*   **Glassmorphism:** Use `surface-container-highest` with a blur effect for the Bottom Navigation Bar, allowing the content to scroll behind it, maintaining the "Digital Architect" transparency.

---

## 5. Signature Components

### Buttons (The "Power" Action)
*   **Primary:** Gradient of `primary` (#81ecff) to `primary-dim` (#00d4ec). Roundedness: `md` (12px). Text: `on-primary-fixed` (Bold).
*   **Secondary:** Ghost style. No background, `Ghost Border` (15% opacity `outline-variant`), with `primary` colored text.
*   **Tertiary:** Text-only, using `secondary` (#cde6f4) for a sophisticated, understated look.

### Input Fields (The "Dialogue")
*   Forbid box-style inputs. Use a "Slab" style: A `surface-container-high` background with a `DEFAULT` (8px) top-radius and a thicker 2px bottom-accent in `primary` only when focused.

### Cards (The "Insight")
*   **Strictly no dividers.** Use 24px of vertical whitespace between content blocks.
*   Header areas within cards should use `surface-bright` (#2c2c2c) to subtly distinguish the title from the body.

### Progress Trackers (The "Growth")
*   Instead of thin lines, use thick, "Chunky" progress bars. Background: `surface-container-highest`. Progress Fill: `tertiary` (#a2aaff) to represent personal growth (distinct from the AI's Teal identity).

### Chat Bubbles (The "Coach")
*   **User:** `surface-container-high`, aligned right.
*   **AI Coach:** `primary-container` (#00e3fd) with `on-primary-container` text. Use a subtle glass blur to signify the "AI" is a different layer of reality.

---

## 6. Do's and Don'ts

### Do:
*   **Do** embrace the RTL flow by mirroring all iconography (e.g., arrows point left for "forward").
*   **Do** use `primary-fixed-dim` for icons to give them a premium, metallic sheen.
*   **Do** use "Breathing Room." If you think there's enough padding, add 8px more. Masculine luxury is defined by space.
*   **Do** use `xl` (1.5rem) corner radius for large hero containers to make the app feel approachable.

### Don't:
*   **Don't** use pure white (#ffffff) for large blocks of text; use `on-surface` for a slightly softer high-contrast experience.
*   **Don't** use 1px dividers or "hr" tags. If you need to separate content, use a background color shift to `surface-container-low`.
*   **Don't** use standard "Success Green." Use `primary` (#81ecff) for success to reinforce the brand identity, or a muted `tertiary` for completion.
*   **Don't** use harsh, small-radius corners. Anything under 8px feels "dated" or "utility-grade."

---

## Color Reference

| Role | Hex | Usage |
|------|-----|-------|
| surface | #0e0e0e | Base background |
| surface-container-low | #131313 | Secondary content |
| surface-container | #1a1a1a | Interactive cards |
| surface-container-high | #20201f | Elevated actions |
| surface-bright | #2c2c2c | Card headers |
| primary | #81ecff | Main CTA, AI accent |
| primary-dim | #00d4ec | Gradient end for buttons |
| primary-container | #00e3fd | AI chat bubbles |
| secondary | #cde6f4 | Tertiary actions |
| tertiary | #a2aaff | Progress/growth |
| on-surface | [light text] | Body text |
| on-surface-variant | #adaaaa | Labels, metadata |
| outline-variant | #484847 | Ghost borders (15% opacity) |

---

Last updated: 2026-04-08
