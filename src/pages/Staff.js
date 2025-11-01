import React, { useEffect, useState } from "react";
import ModalPortal from "../components/ModalPortal";
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
    contact: "",
    status: "Active",
  });
  const [editing, setEditing] = useState(null);

  const dispatch = useDispatch();
  const staff = useSelector((state) => state.staff.items || []);

  useEffect(() => {
    dispatch(fetchStaff());
    const id = setInterval(() => dispatch(fetchStaff()), 5000);
    return () => {
      clearInterval(id);
      document.body.classList.remove("modal-open-blur");
    };
  }, [dispatch]);

  const add = (e) => {
    e.preventDefault();
    if (editing) {
      dispatch(updateStaff({ id: editing._id || editing.id, data: form }));
      setEditing(null);
    } else {
      dispatch(createStaff(form));
    }
    setShow(false);
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
                <th>Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr>
                  <td colSpan={4}>No staff yet</td>
                </tr>
              )}
              {staff.map((s) => (
                <tr key={s._id || s.id}>
                  <td>{s.name}</td>
                  <td>{s.role}</td>
                  <td>{s.contact}</td>
                  <td>{s.status}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => {
                        setEditing(s);
                        setForm({
                          name: s.name || "",
                          role: s.role || "",
                          contact: s.contact || "",
                          status: s.status || "Active",
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
                  <div className="modal-header">
                    <h5 className="modal-title">Add Staff</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShow(false);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <label className="form-label">Name</label>
                      <input
                        className="form-control"
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
                      <label className="form-label">Contact</label>
                      <input
                        className="form-control"
                        value={form.contact}
                        onChange={(e) =>
                          setForm({ ...form, contact: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.value })
                        }
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShow(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Add
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
