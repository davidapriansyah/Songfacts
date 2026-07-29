import { useState } from "react";
import { FaTimes, FaSignInAlt } from "react-icons/fa";
import toast from "../utils/toast";

export default function JoinRoomModal({ isOpen, onClose, onJoin }) {
  const [code, setCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      toast.error("Please enter a valid 6-character room code");
      return;
    }
    setIsJoining(true);
    try {
      await onJoin(code.trim().toUpperCase());
      setCode("");
      onClose();
    } catch (error) {
      // Error handled in context
    } finally {
      setIsJoining(false);
    }
  }

  function handleInputChange(e) {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <FaSignInAlt className="text-accent" />
            </div>
            <h2 className="text-xl font-bold text-white">Join Room</h2>
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
              Room Code
            </label>
            <input
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="Enter 6-character code"
              className="w-full px-4 py-3 bg-dark-700 border border-white/10 rounded-xl text-white text-center text-2xl tracking-[0.3em] font-mono placeholder-gray-500 focus:outline-none focus:border-primary transition-colors uppercase"
              autoFocus
              maxLength={6}
            />
            <p className="mt-2 text-xs text-gray-500 text-center">
              Ask your friend for the room code
            </p>
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
              disabled={isJoining || code.length !== 6}
              className="flex-1 px-4 py-3 bg-accent text-white rounded-xl hover:bg-primary transition-all font-medium disabled:opacity-50"
            >
              {isJoining ? "Joining..." : "Join Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
