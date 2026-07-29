import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import api from "../services/api";
import toast from "../utils/toast";

const SOCKET_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : window.location.origin;

const RoomContext = createContext(null);

export function RoomProvider({ children }) {
  const [room, setRoom] = useState(null);
  const [members, setMembers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchResults, setSearchResults] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const roomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  const addNotification = useCallback((message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  // WebSocket connect/disconnect
  const connectSocket = useCallback((roomCode) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const token = localStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      socket.emit("join-room", { roomCode });
    });

    socket.on("song:changed", (data) => {
      setCurrentSong(data.currentSong);
      setIsPlaying(data.isPlaying);
      setCurrentTime(data.currentTime || 0);
    });

    socket.on("playback:updated", (data) => {
      if (data.currentTime !== undefined) setCurrentTime(data.currentTime);
      if (data.isPlaying !== undefined) setIsPlaying(data.isPlaying);
      if (data.duration !== undefined) setDuration(data.duration);
    });

    socket.on("queue:updated", (data) => {
      setQueue(data.queue || []);
    });

    socket.on("member:joined", (data) => {
      setMembers(data.members || []);
      if (data.notification) addNotification(data.notification, "info");
    });

    socket.on("member:left", (data) => {
      setMembers(data.members || []);
      // If this user became the new leader, refetch room to update isLeader and access controls
      if (data.newLeaderId) {
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.sub === data.newLeaderId && roomRef.current) {
              fetchRoom(roomRef.current.code).catch(() => {});
            }
          } catch {}
        }
      }
    });

    socket.on("member:kicked", (data) => {
      setMembers(data.members || []);
    });

    socket.on("room:deleted", () => {
      addNotification("Room has been dissolved", "info");
      setRoom(null);
      setMembers([]);
      setQueue([]);
      setCurrentSong(null);
      setIsPlaying(false);
      setCurrentTime(0);
    });

    socketRef.current = socket;
  }, [addNotification]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("leave-room");
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const fetchRoom = useCallback(async (code) => {
    try {
      setIsLoading(true);
      const { data } = await api.get(`/rooms/${code}`);
      setRoom(data);
      setMembers(data.members || []);
      setQueue(data.queue || []);

      if (data.currentSong) {
        setCurrentSong(data.currentSong);
      }

      setIsPlaying(data.isPlaying);
      setCurrentTime(data.currentTime || 0);
      return data;
    } catch (error) {
      console.error("Failed to fetch room:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createRoom = useCallback(async (name) => {
    try {
      setIsLoading(true);
      const { data } = await api.post("/rooms", { name });
      setRoom(data);
      setMembers(data.members || []);
      setQueue(data.queue || []);
      addNotification("Room created! Share the code with your friends.", "success");
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create room";
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const joinRoom = useCallback(async (code) => {
    try {
      setIsLoading(true);
      const { data } = await api.post(`/rooms/${code}/join`);
      setRoom(data);
      setMembers(data.members || []);
      setQueue(data.queue || []);

      if (data.currentSong) {
        setCurrentSong(data.currentSong);
      }

      setIsPlaying(data.isPlaying);
      addNotification("Joined the room!", "success");
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to join room";
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  const leaveRoom = useCallback(async () => {
    if (!roomRef.current) return;
    try {
      disconnectSocket();
      await api.post(`/rooms/${roomRef.current.code}/leave`);
    } catch (error) {
      console.error("Failed to leave room:", error);
    } finally {
      setRoom(null);
      setMembers([]);
      setQueue([]);
      setCurrentSong(null);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [disconnectSocket]);

  const playSongInRoom = useCallback(async (songData) => {
    if (!roomRef.current || !roomRef.current.isLeader) return;
    try {
      await api.put(`/rooms/${roomRef.current.code}/play`, {
        songId: songData.id || null,
        videoId: songData.youtubeId || songData.videoId || null,
        title: songData.title,
        artist: songData.artist,
        thumbnail: songData.albumCover || songData.thumbnail,
        duration: songData.duration?.toString(),
      });
      setCurrentSong(songData);
      setIsPlaying(true);
      setCurrentTime(0);
    } catch (error) {
      toast.error("Failed to play song");
    }
  }, []);

  const updatePlayback = useCallback(async (data) => {
    if (!roomRef.current || !roomRef.current.isLeader) return;
    try {
      await api.put(`/rooms/${roomRef.current.code}/playback`, data);
      if (data.currentTime !== undefined) setCurrentTime(data.currentTime);
      if (data.isPlaying !== undefined) setIsPlaying(data.isPlaying);
    } catch (error) {
      console.error("Failed to update playback:", error);
    }
  }, []);

  const addToQueue = useCallback(async (songData) => {
    if (!roomRef.current || !roomRef.current.isLeader) return;
    try {
      await api.post(`/rooms/${roomRef.current.code}/queue`, {
        songId: songData.id || null,
        videoId: songData.youtubeId || songData.videoId || null,
        title: songData.title,
        artist: songData.artist,
        thumbnail: songData.albumCover || songData.thumbnail,
        duration: songData.duration?.toString(),
      });
      toast.success("Added to queue");
    } catch (error) {
      toast.error("Failed to add to queue");
    }
  }, []);

  const removeFromQueue = useCallback(async (queueId) => {
    if (!roomRef.current || !roomRef.current.isLeader) return;
    try {
      await api.delete(`/rooms/${roomRef.current.code}/queue/${queueId}`);
    } catch (error) {
      toast.error("Failed to remove from queue");
    }
  }, []);

  const clearQueue = useCallback(async () => {
    if (!roomRef.current || !roomRef.current.isLeader) return;
    try {
      await api.delete(`/rooms/${roomRef.current.code}/queue`);
      toast.success("Queue cleared");
    } catch (error) {
      toast.error("Failed to clear queue");
    }
  }, []);

  const playNext = useCallback(async () => {
    if (!roomRef.current || !roomRef.current.isLeader) return;
    try {
      await api.post(`/rooms/${roomRef.current.code}/queue/next`);
    } catch (error) {
      toast.error("No songs in queue");
    }
  }, []);

  const searchSongs = useCallback(async (query) => {
    if (!roomRef.current) return;
    try {
      const { data } = await api.get(`/rooms/${roomRef.current.code}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data);
      return data;
    } catch (error) {
      toast.error("Search failed");
      return [];
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, [disconnectSocket]);

  return (
    <RoomContext.Provider
      value={{
        room,
        members,
        queue,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        searchResults,
        notifications,
        isLoading,
        createRoom,
        joinRoom,
        leaveRoom,
        fetchRoom,
        playSongInRoom,
        updatePlayback,
        addToQueue,
        removeFromQueue,
        clearQueue,
        playNext,
        searchSongs,
        setSearchResults,
        connectSocket,
        disconnectSocket,
        addNotification,
        setCurrentSong,
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setQueue,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  return useContext(RoomContext);
}
