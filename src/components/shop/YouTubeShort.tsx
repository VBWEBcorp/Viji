interface YouTubeShortProps {
  id: string;
  title?: string;
  className?: string;
}

export default function YouTubeShort({ id, title, className = "" }: YouTubeShortProps) {
  // Autoplay requires mute. `playlist=ID` is the official workaround to make `loop=1` loop a single video.
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&playsinline=1&modestbranding=1&rel=0&iv_load_policy=3`;

  return (
    <div className={`relative aspect-[9/16] overflow-hidden bg-[var(--brand-cream)] ${className}`}>
      <iframe
        src={src}
        title={title || "Vidéo"}
        allow="autoplay; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="absolute inset-0 w-full h-full pointer-events-none"
        // Scale up to crop YouTube's UI margins on the sides, like a true Short.
        style={{ transform: "scale(1.4)", transformOrigin: "center" }}
      />
    </div>
  );
}
