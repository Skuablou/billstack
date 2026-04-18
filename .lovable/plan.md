
Das Problem: Die X-Achse zeigt aktuell ALLE Tage des Monats (1-31) mit `interval={0}`. Bei 390px Viewport-Breite und ~30 Ticks ergibt das ~10px pro Tag – die Zahlen überlappen oder werden gequetscht und wirken "falsch".

Du willst aber, dass die Achse den ganzen Monat zeigt (1 bis 30/31), passend zum Kalender im Tracker.

## Lösung

Statt zu versuchen alle 30 Tage in 390px zu quetschen, zeige ich saubere Wochen-Marker:
**Tage 1, 5, 10, 15, 20, 25, 30/31** (7 Ticks, gut lesbar, deckt den ganzen Monat ab)

So passt es immer rein, egal welcher Monat, und man sieht klar Anfang/Mitte/Ende.

### Änderungen in `src/pages/Reports.tsx`

X-Achse vom "Monthly spend vs budget" Chart:
- `ticks` → `[1, 5, 10, 15, 20, 25, thisMonthDays]` (letzter Tag dynamisch je nach Monat: 28/30/31)
- `fontSize` zurück auf `10` (besser lesbar weil weniger Ticks)
- `interval={0}` bleibt, damit Recharts nichts wegfiltert
- `minTickGap` auf sinnvollen Wert

Das ist eine kleine, gezielte Änderung an einem Chart.
