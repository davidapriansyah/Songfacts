import { createContext, useContext, useState, useCallback, useRef } from "react";
import api from "../services/api";

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

  // Keep queueRef in sync with queue state
  const setQueueSynced = useCallback((action) => {
    setQueue((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      queueRef.current = next;
      return next;
    });
  }, []);

  const playSong = useCallback((song) => {
    if (currentSongRef.current?.id === song.id) {
      setPlayKey((k) => k + 1);
    }
    setCurrentSong(song);
    currentSongRef.current = song;
    setIsPlaying(true);
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
    if (!song.id) return;
    setQueueSynced((prev) => {
      if (prev.some((s) => s.id === song.id)) return prev;
      return [...prev, song];
    });
  }, [setQueueSynced]);

  const removeFromQueue = useCallback((index) => {
    setQueueSynced((prev) => prev.filter((_, i) => i !== index));
  }, [setQueueSynced]);

  const clearQueue = useCallback(() => {
    setQueueSynced([]);
  }, [setQueueSynced]);

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

  // Always use the latest queue via ref
  onSongEndRef.current = async () => {
    const queueSnapshot = queueRef.current;
    if (queueSnapshot.length > 0) {
      const [next, ...rest] = queueSnapshot;

      if (!next.id && next.videoId) {
        try {
          const { data } = await api.post("/songs/save-from-cache", {
            videoId: next.videoId,
            title: next.title,
            artist: next.artist,
            albumCover: next.albumCover,
          });
          Object.assign(next, data);
        } catch {}
      }

      setCurrentSong(next);
      currentSongRef.current = next;
      setIsPlaying(true);
      queueRef.current = rest;
      setQueueSynced(rest);
      return;
    }

    const lastSong = currentSongRef.current;
    if (lastSong?.id || lastSong?.videoId) {
      const key = lastSong.id || lastSong.videoId;
      const recs = recsMapRef.current[key] || recsMapRef.current[lastSong.id];
      if (recs && recs.length > 0) {
        const [first, ...rest] = recs;

        if (!first.id && first.videoId) {
          try {
            const { data } = await api.post("/songs/save-from-cache", {
              videoId: first.videoId,
              title: first.title,
              artist: first.artist,
              albumCover: first.albumCover,
            });
            Object.assign(first, data);
          } catch {}
        }

        setCurrentSong(first);
        currentSongRef.current = first;
        setIsPlaying(true);
        queueRef.current = rest;
        setQueueSynced(rest);
        return;
      }
    }

    // Queue & recs empty — fetch a random song from DB
    try {
      const playedIds = currentSongRef.current?.id ? [currentSongRef.current.id] : [];
      const { data: randomSong } = await api.get(`/songs/random?exclude=${playedIds.join(',')}`);
      if (randomSong) {
        setCurrentSong(randomSong);
        currentSongRef.current = randomSong;
        setIsPlaying(true);
        return;
      }
    } catch {}

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
        toggleQueue,
        onSongEnd,
        playNextFromList,
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
