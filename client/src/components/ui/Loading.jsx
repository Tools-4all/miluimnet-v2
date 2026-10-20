// הודעת "טוען..." אחידה בכל האתר
function Loading({ text = 'טוען...' }) {
  return <p className="loading">{text}</p>
}

export default Loading
