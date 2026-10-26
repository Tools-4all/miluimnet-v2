// טבלה מתחת לגרף - אותם נתונים בטקסט (נגישות, ולמי שרוצה מספרים מדויקים).
// columns: [{ key, title, format? }]
function DataTable({ rows, columns }) {
  return (
    <details className="chart-table">
      <summary>הצגה כטבלה</summary>
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{c.format ? c.format(row[c.key]) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}

export default DataTable
