// גרף קו עם D3: ערך אחד לכל חודש (למשל ממוצע פוסטים לקבוצה). קו אנכי עוקב אחרי העכבר
import { useRef } from 'react'
import * as d3 from 'd3'
import { useD3 } from '../../hooks/useD3.js'
import { drawYAxis, hideTooltip, monthLabel, showTooltip } from './chartUtils.js'

const WIDTH = 640
const HEIGHT = 300
const MARGIN = { top: 24, right: 24, bottom: 36, left: 40 }

// data: [{ month: '2026-09', value: 1.5 }]
function MonthlyLineChart({ data, label, color = 'var(--accent)' }) {
  const tooltipRef = useRef(null)

  const svgRef = useD3(
    (svg) => {
      const innerW = WIDTH - MARGIN.left - MARGIN.right
      const innerH = HEIGHT - MARGIN.top - MARGIN.bottom
      const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

      // scalePoint - נקודה לכל חודש לאורך הציר
      const x = d3.scalePoint().domain(data.map((d) => d.month)).range([0, innerW])
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

      // d3.line - הופך מערך נקודות למסלול של קו. curveMonotoneX - קו מעוגל שלא "עוקף" את הנתונים
      const line = d3
        .line()
        .x((d) => x(d.month))
        .y((d) => y(d.value))
        .curve(d3.curveMonotoneX)
      g.append('path').datum(data).attr('fill', 'none').style('stroke', color).attr('stroke-width', 2.5).attr('d', line)

      // נקודות על הקו, עם טבעת בצבע הרקע מסביב
      g.selectAll('circle')
        .data(data)
        .join('circle')
        .attr('cx', (d) => x(d.month))
        .attr('cy', (d) => y(d.value))
        .attr('r', 4)
        .style('fill', color)
        .style('stroke', 'var(--surface)')
        .attr('stroke-width', 2)

      // קו אנכי שעוקב אחרי העכבר + חלונית מידע על החודש הקרוב
      const crosshair = g.append('line').attr('class', 'chart-crosshair').attr('y1', 0).attr('y2', innerH).style('opacity', 0)
      g.append('rect')
        .attr('width', innerW)
        .attr('height', innerH)
        .attr('fill', 'transparent')
        .on('mousemove', (event) => {
          const [mx] = d3.pointer(event)
          // d3.least - החודש שהמרחק שלו מהעכבר הכי קטן
          const nearest = d3.least(data, (d) => Math.abs(x(d.month) - mx))
          crosshair.attr('x1', x(nearest.month)).attr('x2', x(nearest.month)).style('opacity', 1)
          showTooltip(
            tooltipRef.current,
            event,
            svg.node().parentNode,
            `${monthLabel(nearest.month)} ${nearest.month.slice(0, 4)}`,
            `${label}: ${nearest.value}`,
          )
        })
        .on('mouseleave', () => {
          crosshair.style('opacity', 0)
          hideTooltip(tooltipRef.current)
        })
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

export default MonthlyLineChart
