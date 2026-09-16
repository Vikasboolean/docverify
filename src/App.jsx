import { Routes, Route } from "react-router-dom";
import { PublicLayout, DashboardLayout } from "./components/Layouts";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyDocument from "./pages/VerifyDocument";
import VerificationResult from "./pages/VerificationResult";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path="/verify" element={<ProtectedRoute><VerifyDocument /></ProtectedRoute>} />
        <Route path="/result/:id" element={<ProtectedRoute><VerificationResult /></ProtectedRoute>} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
