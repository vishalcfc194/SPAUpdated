import React from "react";
import { NavLink } from "react-router-dom";

const Sidebar = ({ open = true }) => {
  return (
    <aside
      className={`sidebar bg-light border-end ${open ? "open" : "closed"}`}
    >
      <div className="sidebar-header p-3 text-center">
        <img src="/logo.png" alt="logo" className="logo-img" />
        <h5 className="m-0" style={{ fontFamily: "Poppins" }}>
          Cindrella The Family Spa
        </h5>
        <small className="text-muted">Queen Place, Near IDBI Bank</small>
      </div>
      <nav className="nav flex-column p-2">
        <NavLink className="nav-link" to="/dashboard">
          Dashboard
        </NavLink>
        <NavLink className="nav-link" to="/billing">
          Billing
        </NavLink>
        <NavLink className="nav-link" to="/clients">
          Clients
        </NavLink>
        <NavLink className="nav-link" to="/services">
          Services
        </NavLink>
        <NavLink className="nav-link" to="/memberships">
          Memberships
        </NavLink>
        <NavLink className="nav-link" to="/membership-plans">
          Membership Plans
        </NavLink>
        <NavLink className="nav-link" to="/staff">
          Staff
        </NavLink>
      </nav>
      <div className="sidebar-footer p-3 small text-muted">
        Contact: 7440534727
      </div>
    </aside>
  );
};

export default Sidebar;
