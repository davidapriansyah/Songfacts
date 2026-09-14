import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import {
  FaPlay,
  FaPause,
  FaTimes,
  FaListUl,
  FaTrash,
  FaStepForward,
} from "react-icons/fa";

// Load the YouTube IFrame API once and reuse the promise across mounts.
let ytApiPromise = null;
function loadYouTubeIframeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prev) prev();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytApiPromise;
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Player() {
  const {
    currentSong,
    isPlaying,
    playKey,
    togglePlay,
    stopSong,
    queue,
    queueOpen,
    removeFromQueue,
    clearQueue,
    toggleQueue,
    onSongEnd,
  } = usePlayer();

  const navigate = useNavigate();

  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const pendingVideoIdRef = useRef(null);
  const currentVideoIdRef = useRef(null);
  const isPlayingRef = useRef(false);
  const onSongEndRef = useRef(null);
  const advancingRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  isPlayingRef.current = isPlaying;
  onSongEndRef.current = onSongEnd;

  const videoId = currentSong?.youtubeId || currentSong?.videoId;

  const loadVideoIntoPlayer = (videoId) => {
    const player = playerRef.current;
    if (!player || !playerReadyRef.current) {
      pendingVideoIdRef.current = videoId;
      return;
    }
    advancingRef.current = false;
    currentVideoIdRef.current = videoId;
    player.loadVideoById(videoId, 0, "default");
    player.playVideo();
  };

  // Boot the hidden YouTube embed once, then drive it purely via the API.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeIframeApi().then((YT) => {
      if (cancelled) return;
      playerRef.current = new YT.Player("yt-player-holder", {
        height: "100%",
        width: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerReadyRef.current = true;
            if (pendingVideoIdRef.current) {
              loadVideoIntoPlayer(pendingVideoIdRef.current);
              pendingVideoIdRef.current = null;
            }
          },
          onStateChange: (e) => {
            // 0 = ended → auto-advance via the same PlayerContext logic as the
            // mobile app (manual queue → sequential → random).
            if (e.data === 0 && !advancingRef.current) {
              advancingRef.current = true;
              onSongEndRef.current?.();
            }
          },
          onError: () => {
            // Video unplayable (age-restricted / not embeddable / private) →
            // skip to the next track instead of freezing playback.
            if (advancingRef.current) return;
            advancingRef.current = true;
            onSongEndRef.current?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the selected song into the embed (and restart it via playKey).
  useEffect(() => {
    if (!videoId) return;
    advancingRef.current = false;
    loadVideoIntoPlayer(videoId);
  }, [videoId, playKey]);

  // Keep progress/duration fresh while a song is active; stop playback when
  // the player is closed (currentSong = null).
  useEffect(() => {
    if (!currentSong) {
      if (playerReadyRef.current) playerRef.current?.stopVideo();
      return;
    }
    setProgress(0);
    setDuration(0);
    const tick = () => {
      const player = playerRef.current;
      if (!player || !playerReadyRef.current) return;
      setProgress(player.getCurrentTime() || 0);
      const d = player.getDuration();
      if (d && !isNaN(d)) setDuration(d);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [currentSong]);

  // Drive play/pause from the UI (any later background resume is handled by
  // the gesture/visibility listeners below).
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !playerReadyRef.current) return;
    if (isPlaying) player.playVideo();
    else player.pauseVideo();
  }, [isPlaying]);

  // Recovery for autoplay edge cases: a play() issued by the API can be
  // dropped when it lands outside the click's user-activation window, or when
  // an advance happens while the tab is hidden. Any following interaction or
  // refocus pulls playback back up.
  useEffect(() => {
    const ensurePlaying = () => {
      const player = playerRef.current;
      if (!player || !playerReadyRef.current) return;
      if (!isPlayingRef.current) return;
      const state = player.getPlayerState();
      if (state === 2 || state === 5 || state === -1) player.playVideo();
    };
    const onVisibility = () => {
      if (!document.hidden) ensurePlaying();
    };
    const onGesture = () => {
      if (document.visibilityState === "hidden") return;
      ensurePlaying();
    };
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerdown", onGesture);
    document.addEventListener("keydown", onGesture);
    window.addEventListener("focus", onGesture);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onGesture);
      document.removeEventListener("keydown", onGesture);
      window.removeEventListener("focus", onGesture);
    };
  }, []);

  function handleClose() {
    if (playerReadyRef.current) playerRef.current?.stopVideo();
    setProgress(0);
    setDuration(0);
    stopSong();
  }

  function handleProgressClick(e) {
    const player = playerRef.current;
    if (!player || !playerReadyRef.current) return;
    const seconds = player.getDuration();
    if (!seconds) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.min(1, Math.max(0, x / rect.width));
    const seekTo = percent * seconds;
    player.seekTo(seekTo, true);
    setProgress(seekTo);
  }

  const thumbId = currentSong?.youtubeId || currentSong?.videoId;
  const thumbnail = currentSong?.albumCover
    ? currentSong.albumCover
    : `https://img.youtube.com/vi/${thumbId}/default.jpg`;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Hidden YouTube embed host — kept mounted so playback/buffering
          persists while the mini player is hidden or the view navigates. */}
      <div
        id="yt-player-holder"
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          opacity: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {!currentSong ? null : (
        <>
          {queueOpen && (
            <div className="absolute bottom-full right-0 w-80 max-w-full max-h-[40vh] bg-dark-800 border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <h3 className="text-white font-semibold text-sm">
                  Queue{" "}
                  <span className="text-gray-500 font-normal">
                    ({queue.length})
                  </span>
                </h3>
                <div className="flex items-center gap-2">
                  {queue.length > 0 && (
                    <button
                      onClick={clearQueue}
                      className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={toggleQueue}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">
                    No songs in queue
                  </div>
                ) : (
                  queue.map((song, index) => (
                    <div
                      key={`${song.id}-${index}`}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 transition-colors group"
                    >
                      <img
                        src={
                          song.albumCover ||
                          `https://img.youtube.com/vi/${song.youtubeId || song.videoId}/default.jpg`
                        }
                        alt={song.title}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{song.title}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {song.artist}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromQueue(index)}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <FaTrash size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="bg-dark-800 border-t border-white/5 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center gap-4 py-2 max-sm:gap-2 max-sm:py-1">
                <img
                  src={thumbnail}
                  alt={currentSong.title}
                  className="w-12 h-12 rounded object-cover shadow-lg cursor-pointer hover:opacity-80 transition-opacity max-sm:hidden"
                  onClick={() =>
                    currentSong.id && navigate(`/funfact/${currentSong.id}`)
                  }
                  onError={(e) => {
                    e.target.src = `https://img.youtube.com/vi/${thumbId}/default.jpg`;
                  }}
                />
                <div
                  className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    currentSong.id && navigate(`/funfact/${currentSong.id}`)
                  }
                >
                  <h4 className="text-white font-medium text-sm truncate">
                    {currentSong.title}
                  </h4>
                  <p className="text-gray-400 text-xs truncate">
                    {currentSong.artist}
                  </p>
                </div>
                <div className="flex items-center gap-2 max-sm:gap-1">
                  <button
                    onClick={toggleQueue}
                    className={`w-9 h-9 max-sm:w-7 max-sm:h-7 flex items-center justify-center transition-colors rounded-lg relative ${
                      queueOpen
                        ? "text-primary bg-primary/10"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                    title="Queue"
                  >
                    <FaListUl size={14} className="max-sm:text-[11px]" />
                    {queue.length > 0 && (
                      <span className="absolute -top-1 -right-1 text-[9px] text-white bg-primary w-4 h-4 max-sm:w-3 max-sm:h-3 rounded-full flex items-center justify-center font-bold">
                        {queue.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      advancingRef.current = false;
                      onSongEnd();
                    }}
                    className="w-9 h-9 max-sm:w-7 max-sm:h-7 flex items-center justify-center text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                    title="Skip to next"
                  >
                    <FaStepForward size={13} className="max-sm:text-[11px]" />
                  </button>
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 max-sm:w-8 max-sm:h-8 bg-primary rounded-full flex items-center justify-center hover:bg-accent transition-all"
                  >
                    {isPlaying ? (
                      <FaPause className="text-white text-sm max-sm:text-xs" />
                    ) : (
                      <FaPlay className="text-white text-sm ml-0.5 max-sm:text-xs" />
                    )}
                  </button>
                  <button
                    onClick={handleClose}
                    className="w-9 h-9 max-sm:w-7 max-sm:h-7 flex items-center justify-center text-gray-400 hover:text-red-400 transition-colors rounded-lg hover:bg-white/10"
                  >
                    <FaTimes className="max-sm:text-[11px]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pb-2 max-sm:gap-1 max-sm:pb-1">
                <span className="text-xs text-gray-500 w-10 text-right tabular-nums">
                  {formatTime(progress)}
                </span>
                <div
                  className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer group relative"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-primary rounded-full relative transition-all"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <span className="text-xs text-gray-500 w-10 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}