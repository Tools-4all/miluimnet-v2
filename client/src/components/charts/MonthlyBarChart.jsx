// גרף עמודות עם D3: ערך אחד לכל חודש (למשל מספר הפוסטים).
//
// מושגים של D3:
//   scale - פונקציה שהופכת נתון לפיקסלים (למשל 52 פוסטים -> גובה 240px)
//   axis  - ציר עם קווי סימון, שנוצר מתוך scale
//   selectAll().data().join() - "חיבור נתונים": אלמנט SVG אחד לכל פריט במערך
import { useRef } from 'react'
import * as d3 from 'd3'
import { useD3 } from '../../hooks/useD3.js'
import { drawYAxis, hideTooltip, monthLabel, showTooltip } from './chartUtils.js'

const WIDTH = 640
const HEIGHT = 300
const MARGIN = { top: 24, right: 16, bottom: 36, left: 40 }

// עמודה עם פינות מעוגלות רק למעלה (הקצה של הנתון), וישרה בבסיס
function roundedTopBar(x, y, w, h, r) {
  if (h <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} V${y + rr} Q${x},${y} ${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h} Z`
}

// data: [{ month: '2026-09', value: 52 }], label: מה הערך (לחלונית המידע)
function MonthlyBarChart({ data, label, color = 'var(--primary)' }) {
  const tooltipRef = useRef(null)

  const svgRef = useD3(
    (svg) => {
      const innerW = WIDTH - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
      const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      // ציר X: חודש -> מיקום. padding יוצר רווח בין העמודות
      const x = d3.scaleBand().domain(data.map((d) => d.month)).range([0, innerW]).padding(0.3)
      // ציר Y: ערך -> גובה. nice() מעגל את המקסימום למספר נוח
      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) || 1])
        .nice()
        .range([innerH, 0])

      drawYAxis(g, y, innerW)
      g.append('g')
        .attr('class', 'chart-axis')
        .attr('transform', `translate(0,${innerH})`)
        .call(d3.axisBottom(x).tickFormat(monthLabel).tickSizeOuter(0))

      // העמודות: path אחד לכל חודש
      const bars = g
        .selectAll('path.bar')
        .data(data)
        .join('path')
        .attr('class', 'bar')
        .style('fill', color)
        .attr('d', (d) => roundedTopBar(x(d.month), y(d.value), x.bandwidth(), innerH - y(d.value), 4))

      // אזור ריחוף שקוף ורחב יותר מהעמודה - קל יותר לכוון עם העכבר
      g.selectAll('rect.hit')
        .data(data)
        .join('rect')
        .attr('x', (d) => x(d.month) - (x.step() - x.bandwidth()) / 2)
        .attr('width', x.step())
        .attr('height', innerH)
        .attr('fill', 'transparent')
        .on('mouseenter', (event, d) => {
          bars.attr('opacity', (b) => (b.month === d.month ? 1 : 0.45))
          showTooltip(tooltipRef.current, event, svg.node().parentNode, `${monthLabel(d.month)} ${d.month.slice(0, 4)}`, `${label}: ${d.value}`)
        })
        .on('mouseleave', () => {
          bars.attr('opacity', 1)
          hideTooltip(tooltipRef.current)
        })

      // תווית ערך רק על החודש הכי גבוה (לא מספר על כל עמודה)
      const peak = d3.greatest(data, (d) => d.value)
      if (peak?.value > 0) {
        g.append('text')
          .attr('class', 'chart-label')
          .attr('x', x(peak.month) + x.bandwidth() / 2)
          .attr('y', y(peak.value) - 6)
          .attr('text-anchor', 'middle')
          .text(peak.value)
      }
    },
    [data, label, color],
  )

  return (
    <div className="chart" dir="ltr">
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={label} />
      <div ref={tooltipRef} className="chart-tooltip" dir="rtl" />
    </div>
  )
}

export default MonthlyBarChart
