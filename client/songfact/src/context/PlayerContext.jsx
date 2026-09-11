import { createContext, useContext, useState, useCallback, useRef } from "react";
import api from "../services/api";
import { resolveStreamUrl } from "../services/stream";

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueOpen, setQueueOpen] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const recsMapRef = useRef({});
  const currentSongRef = useRef(null);
  const queueRef = useRef([]);
  const onSongEndRef = useRef(null);
  const sourceListRef = useRef([]);
  const sourceModeRef = useRef("random");

  // Keep queueRef in sync with queue state
  const setQueueSynced = useCallback((action) => {
    setQueue((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      queueRef.current = next;
      return next;
    });
  }, []);

  const playSong = useCallback((song, list, index, mode) => {
    if (currentSongRef.current?.id === song.id) {
      setPlayKey((k) => k + 1);
    }
    if (list && list.length > 0 && index !== undefined) {
      sourceListRef.current = list;
      sourceModeRef.current = mode || "random";
      // Warm the stream URL cache for upcoming tracks so auto-advance starts
      // instantly (no yt-dlp resolve delay on the next song).
      list.slice(index + 1, index + 4).forEach((track) => {
        const vid = track.videoId || track.youtubeId;
        if (vid) resolveStreamUrl(vid).catch(() => {});
      });
    } else {
      sourceModeRef.current = mode || "random";
    }
    setCurrentSong(song);
    currentSongRef.current = song;
    setIsPlaying(true);
  }, []);

  // Remember a playback context (used for auto-advance) without starting playback
  const setPlaySource = useCallback((list, mode) => {
    if (list && list.length > 0) {
      sourceListRef.current = list;
      sourceModeRef.current = mode || "random";
    } else {
      sourceListRef.current = [];
      sourceModeRef.current = "random";
    }
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const stopSong = useCallback(() => {
    setCurrentSong(null);
    currentSongRef.current = null;
    setIsPlaying(false);
    setQueueSynced([]);
    recsMapRef.current = {};
  }, [setQueueSynced]);

  const addToQueue = useCallback((song) => {
    if (!song.id && !song.videoId) return;
    setQueueSynced((prev) => {
      const key = song.id || song.videoId;
      if (prev.some((s) => (s.id || s.videoId) === key)) return prev;
      return [...prev, song];
    });
  }, [setQueueSynced]);

  const removeFromQueue = useCallback((index) => {
    setQueueSynced((prev) => prev.filter((_, i) => i !== index));
  }, [setQueueSynced]);

  const clearQueue = useCallback(() => {
    setQueueSynced([]);
  }, [setQueueSynced]);

  const isSongInQueue = useCallback((songId) => {
    if (!songId) return false;
    return queueRef.current.some((s) => (s.id || s.videoId) === songId);
  }, []);

  const toggleQueue = useCallback(() => {
    setQueueOpen((prev) => !prev);
  }, []);

  const playNextFromList = useCallback((songs, currentIndex) => {
    const nextSongs = songs
      .slice(currentIndex + 1)
      .filter((s) => s.id || s.videoId);

    // Shuffle using Fisher-Yates
    for (let i = nextSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nextSongs[i], nextSongs[j]] = [nextSongs[j], nextSongs[i]];
    }

    setQueueSynced((prev) => [...nextSongs, ...prev]);
  }, [setQueueSynced]);

  const setRecommendations = useCallback((songId, recs) => {
    recsMapRef.current[songId] = recs;
  }, []);

  const replaceQueue = useCallback((songs) => {
    setQueueSynced(songs);
  }, [setQueueSynced]);

  // Auto-advance, same behavior as the mobile app:
  // 1) manual user queue → 2) sequential source list (favorites) → 3) random from source list
  onSongEndRef.current = async () => {
    // Fire-and-forget persist of a YouTube-only song so auto-advance never
    // waits (and never risks a background-tab autoplay rejection on the save).
    const ensureSaved = (song) => {
      if (song.id || !song.videoId) {
        return Promise.resolve(song);
      }
      return Promise.resolve(
        api
          .post("/songs/save-from-cache", {
            videoId: song.videoId,
            title: song.title,
            artist: song.artist,
            albumCover: song.albumCover,
          }, {
            skipAuthRedirect: true,
          })
          .then(({ data }) => ({ ...song, ...data }))
          .catch(() => song)
      );
    };

    const playTrack = (track) => {
      setCurrentSong(track);
      currentSongRef.current = track;
      setIsPlaying(true);
    };

    // 1. Manual queue first — only ever filled by explicit "Add to Queue"
    const queueSnapshot = queueRef.current;
    if (queueSnapshot.length > 0) {
      const [next, ...rest] = queueSnapshot;
      queueRef.current = rest;
      setQueueSynced(rest);
      playTrack(await ensureSaved(next));
      return;
    }

    const sourceList = sourceListRef.current;
    const lastSong = currentSongRef.current;
    const lastKey = lastSong ? lastSong.id || lastSong.youtubeId || lastSong.videoId : null;

    // 2. Sequential from source list (used by favorites)
    if (sourceModeRef.current === "sequential" && sourceList.length > 0) {
      const idx = lastKey
        ? sourceList.findIndex((s) => (s.id || s.youtubeId || s.videoId) === lastKey)
        : -1;
      const nextIndex = idx >= 0 ? idx + 1 : 0;
      if (nextIndex < sourceList.length) {
        playTrack(await ensureSaved(sourceList[nextIndex]));
        return;
      }
      // sequential list exhausted → fall through to random
    }

    // 3. Random from source list (keeps genre/list flavor, like mobile)
    if (sourceList.length > 0) {
      const candidates = sourceList.filter(
        (s) => (s.id || s.youtubeId || s.videoId) !== lastKey
      );
      const pool = candidates.length > 0 ? candidates : sourceList;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      playTrack(await ensureSaved(pick));
      return;
    }

    // 4. Nothing left to play — stop
    setIsPlaying(false);
  };

  const onSongEnd = useCallback(() => {
    onSongEndRef.current?.();
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        playSong,
        playKey,
        togglePlay,
        stopSong,
        setIsPlaying,
        queue,
        queueOpen,
        addToQueue,
        removeFromQueue,
        clearQueue,
        isSongInQueue,
        toggleQueue,
        onSongEnd,
        playNextFromList,
        setPlaySource,
        setRecommendations,
        replaceQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
