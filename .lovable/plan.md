
# Splash Screen + Onboarding Walkthrough + Start Activity

Dein Fiverr-Entwickler hat recht: Für die Google Play Store Zulassung brauchst du native-wirkende Screens bevor die eigentliche App (WebView) geladen wird. Ich erstelle diese als Web-Seiten innerhalb deiner App, die im TWA genauso wie native Screens aussehen.

## Was gebaut wird

### 1. Splash Screen (`/start`)
- Vollbild-Splash mit BillStack Logo und animiertem Ladeindikator
- Wird 2-3 Sekunden angezeigt, dann automatisch weiter zum Walkthrough
- Dunkler Hintergrund mit dem BillStack Branding (#8100FF)

### 2. Onboarding Walkthrough (`/start` - Schritt 2)
- 3 Slides die man durchswipen kann:
  - **Slide 1**: "Alle Rechnungen an einem Ort" - mit Icon
  - **Slide 2**: "Jahresübersicht & Sparziele" - mit Icon
  - **Slide 3**: "Erinnerungen & nie wieder verpassen" - mit Icon
- Dot-Indicator unten, Skip-Button oben rechts
- Animierte Übergänge zwischen den Slides

### 3. Start Activity (nach dem Walkthrough)
- Großer **"Start"** Button in der Mitte
- BillStack Logo oben
- Klick auf Start navigiert zur Landing/Auth Seite (die eigentliche App)

## Technische Details

### Neue Datei
- `src/pages/Start.tsx` — Enthält alle 3 Phasen (Splash → Walkthrough → Start Button) als State-Machine

### Geänderte Dateien
- `src/App.tsx` — Neue Route `/start` hinzufügen, Default-Route für nicht-eingeloggte User auf `/start` statt `/landing` setzen
- `src/pages/Landing.tsx` — Nicht-eingeloggte User die direkt `/landing` aufrufen werden normal behandelt

### Logik
- `localStorage` speichert ob der User den Walkthrough schon gesehen hat (`billstack_walkthrough_seen`)
- Beim ersten Besuch: `/start` → Splash → Walkthrough → Start → Landing/Auth
- Bei weiteren Besuchen: Direkt zur Landing-Seite (kein Walkthrough mehr)

Kein Backend/Datenbank-Änderungen nötig.
