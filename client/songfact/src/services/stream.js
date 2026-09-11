import api from "./api";

// The direct googlevideo URLs that yt-dlp resolves are DASH fragments which
// Chrome's <audio> cannot decode, so the player always uses the app's own
// proxy endpoint (/songs/stream?videoId=..&token=..) where the server remuxes
// the audio into a progressive format. The resolve call below is kept purely
// as a server-side warm-up (download + remux) for the next track.
export function getCachedStreamUrl(videoId) {
  return null;
}

export async function resolveStreamUrl(videoId) {
  if (!videoId) return null;
  try {
    // skipAuthRedirect: a stale/expired token while advancing in a background
    // tab must NOT bounce the page to /login (which would "reload the list"
    // and kill playback). Warm-up failures are harmless.
    await api.get("/songs/stream-url", {
      params: { videoId },
      skipAuthRedirect: true,
    });
  } catch (error) {
    console.error("Failed to warm stream:", error);
  }
  return null;
}