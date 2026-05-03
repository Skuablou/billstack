
Onboarding-Flow für neu registrierte User mit 4 Schritten.

## Plan

### 1. DB-Migration
Neue Spalte `onboarding_completed BOOLEAN DEFAULT false` in `monthly_tracker_settings` hinzufügen, um zu tracken ob Onboarding fertig ist.

### 2. Neue Komponente: `src/pages/Onboarding.tsx`
4 Screens mit Progress Bar (1/4, 2/4, 3/4, 4/4):

**Screen 1 — Monatliches Netto-Einkommen**
- Number input
- Speichert in `monthly_tracker_settings.salary`

**Screen 2 — Arbeitstage pro Woche**
- 7 Toggle-Buttons (Mo-So) + Stunden pro Tag
- Speichert in `monthly_tracker_settings.active_days` + `hours`

**Screen 3 — Top monatliche Rechnungen**
- Liste mit Name + Betrag (max 3-5 Zeilen, dynamisch addbar)
- Speichert als rows in `subscriptions` (billing_cycle="Monthly")

**Screen 4 — Sparziel**
- Name, Zielbetrag, Zieldatum, Intervall
- Speichert in `savings_goals`

Jeder Screen hat:
- Großen Titel + Erklärungstext
- Skip-Button (oben rechts) + Weiter-Button (unten)
- Progress Bar oben
- Primary-Farbe #8100FF, Space Grotesk

Nach Schritt 4 → `onboarding_completed = true` setzen → `navigate("/")`

### 3. Routing in `src/App.tsx`
- Neue Route `/onboarding`
- `ProtectedRoute` erweitern: nach Auth-Check prüfen ob `onboarding_completed`. Falls nicht → redirect zu `/onboarding` (außer wenn schon auf `/onboarding`)

### 4. Onboarding-Status Hook
`src/hooks/use-onboarding-status.ts` — liest `onboarding_completed` aus `monthly_tracker_settings`. Falls keine Row existiert → `false`.

### Wichtig
- Alle Inputs optional/skippable, kein Zwang
- Beim Skip einfach zum nächsten Screen ohne Save
- Bei Skip von ALLEN Screens trotzdem `onboarding_completed = true` setzen damit es nicht wieder erscheint
- Sprache: Deutsch (User-Präferenz aus Memory)
- Existierende User: bekommen Onboarding NICHT (Migration setzt Default false aber wir filtern: wenn `salary > 0` oder Daten existieren → als completed markieren via Migration-SQL)

### Files
- NEU: `src/pages/Onboarding.tsx`
- NEU: `src/hooks/use-onboarding-status.ts`
- EDIT: `src/App.tsx` (Route + Redirect-Logik)
- DB: Migration für neue Spalte + Backfill für existierende User
