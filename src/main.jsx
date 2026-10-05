import React from "react";
import { createRoot } from "react-dom/client";
import AttendanceDashboard from "./pages/AttendanceDashboard.jsx";
import { AuthProvider } from "./lib/auth.jsx";
import "./styles/attendance.css";
import "./styles/login.css";

createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <AttendanceDashboard />
  </AuthProvider>
);

