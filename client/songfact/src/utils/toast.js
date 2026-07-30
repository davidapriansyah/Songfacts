import Toastify from "toastify-js";

const toast = {
  success: (text) => {
    Toastify({
      text,
      duration: 3500,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(135deg, #3c8f82, #2dd4bf)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
        boxShadow: "0 10px 40px rgba(60, 143, 130, 0.3)",
        fontWeight: "600",
        fontSize: "14px",
      },
    }).showToast();
  },
  error: (text) => {
    Toastify({
      text,
      duration: 4000,
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
      duration: 3500,
      gravity: "top",
      position: "right",
      style: {
        background: "linear-gradient(135deg, #3c8f82, #5aa89a)",
        color: "#fff",
        borderRadius: "12px",
        padding: "12px 20px",
        boxShadow: "0 10px 40px rgba(60, 143, 130, 0.3)",
        fontWeight: "600",
        fontSize: "14px",
      },
    }).showToast();
  },
};

export default toast;
