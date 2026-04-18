
User möchte: Wenn man im Chart auf einen Tag hovert, soll der Preis-Wert auch links an der Y-Achse angezeigt werden (als horizontale Hilfslinie/Marker), nicht nur im Tooltip.

In Recharts wird das über den `Tooltip` mit `cursor` (vertikale Linie ist schon da) erweitert um eine **horizontale ReferenceLine** auf Höhe des gehoverten Wertes + Label links an der Y-Achse.

## Plan

**Datei:** `src/pages/Reports.tsx` — nur "Monthly spend vs budget" Chart

### Umsetzung
1. Neuen State `hoveredValue: number | null` hinzufügen
2. Tooltip-Content (oder via `onMouseMove` am ComposedChart) liest den `spent`-Wert des aktiven Tages und setzt `hoveredValue`
3. Bei `onMouseLeave` → `setHoveredValue(null)`
4. Conditional `<ReferenceLine y={hoveredValue} />` rendern mit:
   - gestrichelte horizontale Linie in grün (`#10b981`, strokeDasharray "3 3")
   - `label`-Prop mit Position `left` → zeigt `€{value}` direkt an der Y-Achse links
   - Label-Style: grüner Hintergrund-Pill oder einfacher grüner Text

### Technik
- `ComposedChart` akzeptiert `onMouseMove={(state) => state?.activePayload?.[0] && setHoveredValue(state.activePayload[0].value)}` und `onMouseLeave`
- ReferenceLine-Label: `label={{ value: \`${currency}${Math.round(hoveredValue)}\`, position: "left", fill: "#10b981", fontSize: 10 }}`

### Nicht ändern
- Tooltip selbst, Y-Achsen-Ticks, Legende, anderen Charts bleiben unverändert
