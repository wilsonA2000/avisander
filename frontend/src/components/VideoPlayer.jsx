// Video player simple: detecta YouTube/Vimeo y usa iframe. Si es mp4/webm usa <video>.

function isYouTube(url) { return /(?:youtube\.com|youtu\.be)/.test(url) }
function youTubeEmbed(url) {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)?.[1]
  return id ? `https://www.youtube.com/embed/${id}` : null
}
function isVimeo(url) { return /vimeo\.com/.test(url) }
function vimeoEmbed(url) {
  const id = url.match(/vimeo\.com\/(\d+)/)?.[1]
  return id ? `https://player.vimeo.com/video/${id}` : null
}

function VideoPlayer({ src, title, poster }) {
  if (!src) return null
  if (isYouTube(src)) {
    const embed = youTubeEmbed(src)
    if (!embed) return null
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        <iframe
          src={embed}
          title={title || 'Video'}
          className="w-full h-full"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    )
  }
  if (isVimeo(src)) {
    const embed = vimeoEmbed(src)
    if (!embed) return null
    return (
      <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
        <iframe src={embed} title={title || 'Video'} className="w-full h-full" allowFullScreen />
      </div>
    )
  }
  return (
    <video controls poster={poster} className="w-full rounded-xl bg-black aspect-video">
      <source src={src} />
      Tu navegador no soporta video HTML5.
    </video>
  )
}

export default VideoPlayer
