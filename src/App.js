import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import Memberships from "./pages/Memberships";
import MembershipPlans from "./pages/MembershipPlans";
import Clients from "./pages/Clients";
import Login from "./pages/Login";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  React.useEffect(() => {
    // close sidebar on small screens by default
    if (window.innerWidth < 768) setSidebarOpen(false);
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <div className="app d-flex">
      {isAuthenticated && <Sidebar open={sidebarOpen} />}
      {/* overlay only visible on small screens via CSS when sidebar is open */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="content flex-grow-1">
        {isAuthenticated && (
          <Topbar toggleSidebar={() => setSidebarOpen((s) => !s)} />
        )}
        <main className="p-4">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <ProtectedRoute>
                  <Clients />
                </ProtectedRoute>
              }
            />

            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <Services />
                </ProtectedRoute>
              }
            />

            <Route
              path="/memberships"
              element={
                <ProtectedRoute>
                  <Memberships />
                </ProtectedRoute>
              }
            />

            <Route
              path="/membership-plans"
              element={
                <ProtectedRoute>
                  <MembershipPlans />
                </ProtectedRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <ProtectedRoute>
                  <Staff />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
