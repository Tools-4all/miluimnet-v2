// נגן וידאו עם כפתורים שבנינו בעצמנו (סעיף 26), במקום הכפתורים המובנים של הדפדפן.
// useRef נותן גישה לאלמנט ה-<video>, ודרכו מפעילים את הפונקציות שלו: play, pause, currentTime
import { useRef, useState } from 'react'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function VideoPlayer({ src }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [error, setError] = useState(false)

  function togglePlay() {
    const video = videoRef.current
    if (video.paused) video.play()
    else video.pause()
  }

  function toggleMute() {
    videoRef.current.muted = !muted
    setMuted(!muted)
  }

  // הזזת פס ההתקדמות קופצת למקום אחר בסרטון
  function handleSeek(e) {
    videoRef.current.currentTime = Number(e.target.value)
    setCurrent(Number(e.target.value))
  }

  if (error) return <p className="card-meta">לא הצלחנו לטעון את הסרטון.</p>

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        onClick={togglePlay}
        // אירועים של אלמנט הווידאו מעדכנים את ה-state, וה-state מצייר את הכפתורים
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)}
        onTimeUpdate={(e) => setCurrent(e.target.currentTime)}
        onError={() => setError(true)}
      />
      <div className="video-controls">
        <button type="button" onClick={togglePlay} aria-label={playing ? 'השהיה' : 'ניגון'}>
          {playing ? '❚❚' : '▶'}
        </button>
        <span className="video-time">
          {formatTime(current)} / {formatTime(duration)}
        </span>
        <input
          type="range"
          className="video-progress"
          min="0"
          max={duration || 0}
          step="0.1"
          value={current}
          onChange={handleSeek}
          aria-label="מיקום בסרטון"
        />
        <button type="button" onClick={toggleMute} aria-label={muted ? 'הפעלת קול' : 'השתקה'}>
          {muted ? '🔇' : '🔊'}
        </button>
        <button type="button" onClick={() => videoRef.current.requestFullscreen?.()} aria-label="מסך מלא">
          ⛶
        </button>
      </div>
    </div>
  )
}

export default VideoPlayer
