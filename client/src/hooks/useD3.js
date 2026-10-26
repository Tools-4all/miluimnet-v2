// מחבר בין React ל-D3: React מחזיק את אלמנט ה-<svg>, ו-D3 מצייר בתוכו.
// draw(svg) רץ בכל פעם שהנתונים משתנים, ותמיד על svg נקי (בלי הציור הקודם).
//   const svgRef = useD3((svg) => { ...ציור עם D3... }, [data])
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

export function useD3(draw, deps) {
  const ref = useRef(null)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove() // מנקים ציור קודם (למשל אחרי רענון נתונים)
    draw(svg)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
