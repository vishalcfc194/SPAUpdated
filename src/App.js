import React, { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Billing from "./pages/Billing";
import Services from "./pages/Services";
import Staff from "./pages/Staff";
import Memberships from "./pages/Memberships";
import Clients from "./pages/Clients";

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

  return (
    <div className="app d-flex">
      <Sidebar open={sidebarOpen} />
      {/* overlay only visible on small screens via CSS when sidebar is open */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "show" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className="content flex-grow-1">
        <Topbar toggleSidebar={() => setSidebarOpen((s) => !s)} />
        <main className="p-4">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/services" element={<Services />} />
            <Route path="/memberships" element={<Memberships />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
