// גרף עמודות אופקי עם D3 - מתאים לשמות ארוכים (למשל שמות קבוצות).
// בעברית: השמות מימין, והעמודות "גדלות" מימין לשמאל.
import { useRef } from 'react'
import * as d3 from 'd3'
import { useD3 } from '../../hooks/useD3.js'
import { hideTooltip, showTooltip } from './chartUtils.js'

const WIDTH = 640
const ROW = 34 // גובה שורה לכל פריט
const MARGIN = { top: 8, right: 200, bottom: 8, left: 40 }

// עמודה אופקית שמתחילה מימין (x0) ונגמרת משמאל, עם פינות מעוגלות רק בקצה השמאלי
function roundedLeftBar(x0, y, w, h, r) {
  if (w <= 0) return ''
  const rr = Math.min(r, h / 2, w)
  const left = x0 - w
  return `M${x0},${y} H${left + rr} Q${left},${y} ${left},${y + rr} V${y + h - rr} Q${left},${y + h} ${left + rr},${y + h} H${x0} Z`
}

// data: [{ name: 'קבוצה', value: 40 }]
function HorizontalBarChart({ data, label, color = 'var(--primary)' }) {
  const tooltipRef = useRef(null)
  const height = MARGIN.top + MARGIN.bottom + data.length * ROW

  const svgRef = useD3(
    (svg) => {
      const right = WIDTH - MARGIN.right // קו הבסיס של העמודות
      const innerW = right - MARGIN.left

      const y = d3
        .scaleBand()
        .domain(data.map((d) => d.name))
        .range([MARGIN.top, height - MARGIN.bottom])
        .padding(0.28)
      const w = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) || 1])
        .range([0, innerW])

      // שורה אחת (g) לכל פריט: שם, עמודה וערך
      const rows = svg.selectAll('g.row').data(data).join('g').attr('class', 'row')

      // השם מתחיל בקצה הימני של הגרף וזורם שמאלה (כיוון עברית), עד קו הבסיס של העמודות
      rows
        .append('text')
        .attr('class', 'chart-axis-label')
        .attr('x', WIDTH - 4)
        .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('direction', 'rtl')
        .text((d) => (d.name.length > 26 ? d.name.slice(0, 25) + '…' : d.name))

      rows
        .append('path')
        .style('fill', color)
        .attr('d', (d) => roundedLeftBar(right, y(d.name), w(d.value), y.bandwidth(), 4))

      // הערך ליד קצה העמודה (מעט שורות - אז תווית לכל אחת קריאה)
      rows
        .append('text')
        .attr('class', 'chart-label')
        .attr('x', (d) => right - w(d.value) - 6)
        .attr('y', (d) => y(d.name) + y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .text((d) => d.value)

      // אזור ריחוף לכל השורה
      rows
        .append('rect')
        .attr('y', (d) => y(d.name) - (y.step() - y.bandwidth()) / 2)
        .attr('width', WIDTH)
        .attr('height', y.step())
        .attr('fill', 'transparent')
        .on('mouseenter', (event, d) => {
          rows.attr('opacity', (r) => (r.name === d.name ? 1 : 0.5))
          showTooltip(tooltipRef.current, event, svg.node().parentNode, d.name, `${label}: ${d.value}`)
        })
        .on('mouseleave', () => {
          rows.attr('opacity', 1)
          hideTooltip(tooltipRef.current)
        })
    },
    [data, label, color, height],
  )

  return (
    <div className="chart" dir="ltr">
      <svg ref={svgRef} viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={label} />
      <div ref={tooltipRef} className="chart-tooltip" dir="rtl" />
    </div>
  )
}

export default HorizontalBarChart
