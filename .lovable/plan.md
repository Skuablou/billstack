
Der User möchte zwei Anpassungen am "Monthly spend vs budget" Chart in `src/pages/Reports.tsx`:

1. **Danger Zone zu groß**: Aktuell erstreckt sich die Danger Zone von `budget` bis `income` (wenn income > budget). Das nimmt viel visuelle Fläche ein. Lösung: Die Danger Zone sollte schmaler/dezenter werden — z.B. nur ein dünner Streifen direkt über der Budget-Linie, oder die Stripes weniger dicht/transparenter.

2. **Spending-Linie nicht spezifisch genug**: Die grüne "spent" Area ist als kumulative Tageslinie gezeichnet, aber wirkt zu glatt/unauffällig. Sie soll deutlicher/präziser sein — vermutlich dickere Linie, kräftigere Farbe und sichtbare Datenpunkte (Dots) damit man pro Tag genau sieht wo gespendet wurde.

## Plan

**Datei:** `src/pages/Reports.tsx` (nur der "Monthly spend vs budget" Chart-Block)

### 1. Danger Zone dezenter machen
- Stripes-Pattern transparenter: `rgba(239,68,68,0.04)` Background, Linien `rgba(239,68,68,0.35)` mit `strokeWidth=1` statt 2
- Pattern-Größe von 6x6 auf 8x8 erhöhen → weniger dicht
- So bleibt die Zone sichtbar, dominiert aber nicht mehr

### 2. Spending-Linie spezifischer
- `strokeWidth` von 2.5 → 3
- Sichtbare Dots pro Tag: `dot={{ fill: "#10b981", r: 2.5, strokeWidth: 0 }}`
- `activeDot={{ r: 5, fill: "#10b981", stroke: "#0f0f1e", strokeWidth: 2 }}` für Hover-Highlight
- Area-Fill etwas kräftiger: `rgba(16,185,129,0.18)` statt 0.12
- Damit sieht man jeden Tag als Punkt → klar wo Ausgaben stattfanden

### Nicht ändern
- Budget-Linie (lila gestrichelt) bleibt
- Income ReferenceLine bleibt
- Fixed-Cost-Linie (orange) bleibt
- Legende, Achsen, Tooltip bleiben unverändert
- Zweiter Chart (This vs Last Month) und Pie Chart unverändert
