// The web player now plays directly through the YouTube embed (IFrame API),
// so it no longer needs server-side stream resolution/remux warm-ups. These
// helpers are kept as no-ops so call sites (PlayerContext/HomePage/GenrePage)
// keep working without hitting the backend.
export function getCachedStreamUrl(videoId) {
  void videoId;
  return null;
}

export async function resolveStreamUrl(videoId) {
  void videoId;
  return null;
}

// No-op: playback no longer needs server-side warm-ups.
export function warmStreamUrls(songs, limit = 2) {
  void songs;
  void limit;
}