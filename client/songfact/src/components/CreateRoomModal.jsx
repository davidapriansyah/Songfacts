import { useState } from "react";
import { FaTimes, FaUsers, FaCopy, FaCheck } from "react-icons/fa";
import toast from "../utils/toast";

export default function CreateRoomModal({ isOpen, onClose, onCreate }) {
  const [roomName, setRoomName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomName.trim()) {
      toast.error("Please enter a room name");
      return;
    }
    setIsCreating(true);
    try {
      await onCreate(roomName.trim());
      setRoomName("");
      onClose();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <FaUsers className="text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Room</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g., Music Session with Friends"
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 text-gray-400 rounded-xl hover:bg-white/10 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:bg-accent transition-all font-medium disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
