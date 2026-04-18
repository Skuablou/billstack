

## Problem
Der `useMonthlyTracker` Hook initialisiert `salaryConfirmed` als `false`. Erst nach dem DB-Load (1-2 Sek) wird er auf `true` gesetzt, wenn ein Salary existiert. In der Zwischenzeit rendert `MonthlyTracker.tsx` (Zeilen 221-248) kurz den "Monthly salary (net)"-Eingabeblock — das ist das Aufblitzen, das du siehst.

## Lösung
Den Salary-Eingabeblock erst rendern, wenn die Daten aus der DB geladen sind. Der Hook gibt bereits ein `loaded` Flag zurück (siehe `use-monthly-tracker.ts` Zeile 47), das wird aber im Component nicht genutzt.

### Änderung in `src/components/MonthlyTracker.tsx`

1. `loaded` aus dem Hook destrukturieren (Zeile 35-39)
2. Bedingung in Zeile 222 ändern von:
   ```
   {!salaryConfirmed && (
   ```
   zu:
   ```
   {loaded && !salaryConfirmed && (
   ```

Während `loaded === false` wird einfach nichts gezeigt — kein Flash mehr. Sobald geladen, entscheidet die korrekte Bedingung sauber.

Eine kleine, gezielte Änderung an einer Datei, kein Risiko für andere Funktionen.

