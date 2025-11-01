import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalPortal from "../components/ModalPortal";
import {
  fetchMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
} from "../features/memberships/membershipSlice";

const Memberships = () => {
  const dispatch = useDispatch();
  const { items: memberships, status } = useSelector(
    (s) => s.memberships || { items: [] }
  );
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    durationMonths: 1,
    benefits: "",
  });

  useEffect(() => {
    dispatch(fetchMemberships());
    const id = setInterval(() => dispatch(fetchMemberships()), 5000);
    return () => clearInterval(id);
  }, [dispatch]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", price: 0, durationMonths: 1, benefits: "" });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name,
      price: m.price || 0,
      durationMonths: m.durationMonths || 1,
      benefits: (m.benefits || []).join(", "),
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      price: Number(form.price),
      durationMonths: Number(form.durationMonths),
      benefits: form.benefits
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
    };
    if (editing) {
      await dispatch(
        updateMembership({ id: editing._id || editing.id, data: payload })
      );
    } else {
      await dispatch(createMembership(payload));
    }
    setShow(false);
    document.body.classList.remove("modal-open-blur");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h3>
          Membership Plans{" "}
          {status === "loading" && (
            <small className="text-muted">(updating...)</small>
          )}
        </h3>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Plan
        </button>
      </div>

      <div className="card mt-3 p-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Duration (months)</th>
                <th>Benefits</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {memberships.length === 0 && (
                <tr>
                  <td colSpan={5}>No membership plans yet</td>
                </tr>
              )}
              {memberships.map((m) => (
                <tr key={m._id || m.id}>
                  <td>{m.name}</td>
                  <td>₹{m.price}</td>
                  <td>{m.durationMonths}</td>
                  <td>{(m.benefits || []).join(", ")}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => openEdit(m)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => dispatch(deleteMembership(m._id || m.id))}
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
                <form className="modal-content" onSubmit={submit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editing ? "Edit Plan" : "Add Plan"}
                    </h5>
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
                      <label className="form-label">Price</label>
                      <input
                        className="form-control"
                        type="number"
                        value={form.price}
                        onChange={(e) =>
                          setForm({ ...form, price: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Duration (months)</label>
                      <input
                        className="form-control"
                        type="number"
                        value={form.durationMonths}
                        onChange={(e) =>
                          setForm({ ...form, durationMonths: e.target.value })
                        }
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">
                        Benefits (comma separated)
                      </label>
                      <input
                        className="form-control"
                        value={form.benefits}
                        onChange={(e) =>
                          setForm({ ...form, benefits: e.target.value })
                        }
                      />
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
                      Save
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

export default Memberships;
