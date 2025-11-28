import React, { useEffect, useState } from "react";
import ModalPortal from "../components/ModalPortal";
import TableControls from "../components/TableControls";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} from "../features/staff/staffSlice";

const Staff = () => {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    active: true,
  });
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const dispatch = useDispatch();
  const staff = useSelector((state) => state.staff.items || []);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await dispatch(fetchStaff()).unwrap();
    } catch (e) {
      console.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    const id = setInterval(() => handleRefresh(), 30000);
    return () => {
      clearInterval(id);
      document.body.classList.remove("modal-open-blur");
    };
  }, [dispatch]);

  // Filter and paginate
  const filtered = staff.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone || "").includes(searchTerm) ||
      (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedStaff = filtered.slice(start, start + itemsPerPage);

  const add = (e) => {
    e.preventDefault();
    if (editing) {
      dispatch(updateStaff({ id: editing._id || editing.id, data: form }));
      setEditing(null);
    } else {
      dispatch(createStaff(form));
    }
    setShow(false);
    document.body.classList.remove("modal-open-blur");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Staff</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            setShow(true);
            document.body.classList.add("modal-open-blur");
          }}
        >
          + Add Staff
        </button>
      </div>

      <div className="card mt-3 p-3">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th colSpan={6}>
                  <TableControls
                    searchTerm={searchTerm}
                    onSearchChange={(term) => {
                      setSearchTerm(term);
                      setCurrentPage(1);
                    }}
                    onRefresh={handleRefresh}
                    onRefreshLoading={isRefreshing}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                  />
                </th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    No staff found
                  </td>
                </tr>
              )}
              {paginatedStaff.map((s) => (
                <tr key={s._id || s.id}>
                  <td>{s.name}</td>
                  <td>{s.role}</td>
                  <td>{s.phone || "-"}</td>
                  <td>{s.email || "-"}</td>
                  <td>
                    <span
                      className={`badge ${
                        s.active ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {s.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => {
                        setEditing(s);
                        setForm({
                          name: s.name || "",
                          role: s.role || "",
                          phone: s.phone || "",
                          email: s.email || "",
                          active:
                            typeof s.active === "boolean"
                              ? s.active
                              : s.status !== "Inactive",
                        });
                        setShow(true);
                        document.body.classList.add("modal-open-blur");
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => dispatch(deleteStaff(s._id || s.id))}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block">
              <div className="modal-dialog modal-lg-custom">
                <form className="modal-content" onSubmit={add}>
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <h5 className="modal-title">
                      {editing ? "Edit Staff" : "Add Staff"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShow(false);
                        document.body.classList.remove("modal-open-blur");
                        setEditing(null);
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
                        placeholder="Enter full name"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        placeholder="Enter Role"
                        value={form.role}
                        onChange={(e) =>
                          setForm({ ...form, role: e.target.value })
                        }
                        required
                      >
                        <option value="">Select role</option>
                        <option>Therapist</option>
                        <option>Reception</option>
                        <option>Manager</option>
                        <option>Cleaner</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Phone</label>
                      <input
                        className="form-control"
                        placeholder="Enter Phone"
                        value={form.phone}
                        onChange={(e) =>
                          setForm({ ...form, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Email</label>
                      <input
                        className="form-control"
                        placeholder="Enter Email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        type="email"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        placeholder="Status"
                        value={form.active ? "Active" : "Inactive"}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            active: e.target.value === "Active",
                          })
                        }
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div
                    className="modal-footer"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShow(false);
                        document.body.classList.remove("modal-open-blur");
                        setEditing(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editing ? "Save" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Staff;
