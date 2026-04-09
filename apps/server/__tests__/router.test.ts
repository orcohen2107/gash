import { detectIntent } from '../lib/agents/router'

describe('detectIntent', () => {
  it('detects boost intent when user is about to approach', () => {
    expect(detectIntent('אני עומד לפנות אליה עכשיו')).toBe('boost')
    expect(detectIntent('הולך לדבר איתה')).toBe('boost')
    expect(detectIntent('עכשיו אפנה אליה')).toBe('boost')
  })

  it('detects reply-coach intent when user shares a message', () => {
    expect(detectIntent('היא שלחה לי: "היי מה קורה"')).toBe('reply-coach')
    expect(detectIntent('קיבלתי ממנה הודעה')).toBe('reply-coach')
    expect(detectIntent('ענתה לי תגיד לי מה להגיד')).toBe('reply-coach')
  })

  it('detects situation-opener intent when user asks for openers', () => {
    expect(detectIntent('תן לי פתיחה לרכבת')).toBe('situation-opener')
    expect(detectIntent('מה לפתוח בבר')).toBe('situation-opener')
    expect(detectIntent('איך לפתוח שיחה בקפה')).toBe('situation-opener')
  })

  it('falls through to coach for general messages', () => {
    expect(detectIntent('שלום')).toBe('coach')
    expect(detectIntent('תודה')).toBe('coach')
    expect(detectIntent('מה אתה חושב על זה')).toBe('coach')
  })
})
