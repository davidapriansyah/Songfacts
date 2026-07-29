import Toastify from "toastify-js";

const toast = {
  success: (text) => {
    Toastify({
      text,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
        boxShadow: "0 10px 40px rgba(139, 92, 246, 0.3)",
        fontWeight: "600",
        fontSize: "14px",
      },
    }).showToast();
  },
  error: (text) => {
    Toastify({
      text,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(135deg, #EF4444, #DC2626)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
        boxShadow: "0 10px 40px rgba(239, 68, 68, 0.3)",
        fontWeight: "600",
        fontSize: "14px",
      },
    }).showToast();
  },
  info: (text) => {
    Toastify({
      text,
      duration: 3000,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
        boxShadow: "0 10px 40px rgba(59, 130, 246, 0.3)",
        fontWeight: "600",
        fontSize: "14px",
      },
    }).showToast();
  },
};

export default toast;
