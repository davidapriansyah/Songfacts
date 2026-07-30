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
    setIsPlaying,
    queue,
    queueOpen,
    addToQueue,
    removeFromQueue,
    clearQueue,
    toggleQueue,
    onSongEnd,
  } = usePlayer();

  const navigate = useNavigate();

  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const progressInterval = useRef(null);

  const videoId = currentSong?.youtubeId || currentSong?.videoId;

  useEffect(() => {
    if (!containerRef.current || !videoId) return;
    setReady(false);
    setProgress(0);
    setDuration(0);

    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy();
    }

    containerRef.current.innerHTML = "";

    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    function createPlayer() {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
        },
        events: {
          onReady: () => {
            setReady(true);
            setDuration(playerRef.current.getDuration());
          },
          onStateChange: (e) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setDuration(playerRef.current.getDuration());
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            } else if (e.data === window.YT.PlayerState.ENDED) {
              setProgress(0);
              setReady(false);
              onSongEnd();
            }
          },
        },
      });
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId, playKey]);

  useEffect(() => {
    if (!ready || !playerRef.current) return;

    if (isPlaying) {
      playerRef.current.playVideo();
      progressInterval.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime) {
          setProgress(playerRef.current.getCurrentTime());
        }
      }, 500);
    } else {
      playerRef.current.pauseVideo();
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, ready]);

  function handleClose() {
    if (playerRef.current && playerRef.current.destroy) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setProgress(0);
    setDuration(0);
    setReady(false);
    stopSong();
  }

  function handleProgressClick(e) {
    if (!playerRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    const seekTo = percent * duration;
    playerRef.current.seekTo(seekTo, true);
    setProgress(seekTo);
  }

  if (!currentSong) return null;

  const thumbId = currentSong.youtubeId || currentSong.videoId;
  const thumbnail =
    currentSong.albumCover ||
    `https://img.youtube.com/vi/${thumbId}/default.jpg`;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div ref={containerRef} className="hidden" />

      {queueOpen && (
        <div className="absolute bottom-full right-0 w-80 max-w-full max-h-[40vh] bg-dark-800 border border-white/10 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="text-white font-semibold text-sm">
              Queue{" "}
              <span className="text-gray-500 font-normal">({queue.length})</span>
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
              onClick={() => currentSong.id && navigate(`/funfact/${currentSong.id}`)}
              onError={(e) => {
                e.target.src = `https://img.youtube.com/vi/${thumbId}/default.jpg`;
              }}
            />
            <div
              className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => currentSong.id && navigate(`/funfact/${currentSong.id}`)}
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
                  if (playerRef.current && playerRef.current.stopVideo) {
                    playerRef.current.stopVideo();
                  }
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
    </div>
  );
}
