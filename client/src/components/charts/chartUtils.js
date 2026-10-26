// כלי עזר משותפים לגרפים
import * as d3 from 'd3'

// חודש בעברית: "2026-09" -> "ספט׳"
export function monthLabel(key) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('he-IL', { month: 'short' })
}

// מציג את חלונית המידע (tooltip) ליד העכבר.
// הטקסט נכנס עם text() ולא עם html() - כי שמות של קבוצות נכתבים על ידי משתמשים,
// ו-html() היה מריץ קוד שמישהו הכניס לשם (XSS). בגרסה 1 זה היה באג.
export function showTooltip(tooltipEl, event, container, title, line) {
  const [x, y] = d3.pointer(event, container)
  const tooltip = d3.select(tooltipEl).style('opacity', 1).style('left', `${x}px`).style('top', `${y - 12}px`)
  tooltip.selectAll('*').remove()
  tooltip.append('strong').text(title)
  tooltip.append('div').text(line)
}

export function hideTooltip(tooltipEl) {
  d3.select(tooltipEl).style('opacity', 0)
}

// קווי רשת אופקיים עדינים + ציר Y משמאל
export function drawYAxis(g, y, innerW) {
  g.append('g')
    .attr('class', 'chart-grid')
    .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(''))
    .call((sel) => sel.select('.domain').remove())
  g.append('g').attr('class', 'chart-axis').call(d3.axisLeft(y).ticks(5).tickSizeOuter(0))
}
