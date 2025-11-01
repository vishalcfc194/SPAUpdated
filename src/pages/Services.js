import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalPortal from "../components/ModalPortal";
import {
  fetchServices,
  createService,
  updateService,
  deleteService,
} from "../features/services/serviceSlice";

const Services = () => {
  const dispatch = useDispatch();
  const { items: services, status } = useSelector(
    (s) => s.services || { items: [] }
  );
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    durationMinutes: 60,
  });

  useEffect(() => {
    dispatch(fetchServices());
    const id = setInterval(() => dispatch(fetchServices()), 5000);
    return () => clearInterval(id);
  }, [dispatch]);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", description: "", price: 0, durationMinutes: 60 });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      title: s.title || s.name,
      description: s.description || "",
      price: s.price || 0,
      durationMinutes: s.durationMinutes || 60,
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
    };
    if (editing) {
      await dispatch(
        updateService({ id: editing._id || editing.id, data: payload })
      );
    } else {
      await dispatch(createService(payload));
    }
    setShow(false);
    document.body.classList.remove("modal-open-blur");
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h3>
          Services{" "}
          {status === "loading" && (
            <small className="text-muted">(updating...)</small>
          )}
        </h3>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Service
        </button>
      </div>

      <div className="row g-3 mt-3">
        {services.map((s) => (
          <div className="col-sm-6 col-md-4 col-lg-3" key={s._id || s.id}>
            <div className="card service-card p-3 h-100">
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6 className="mb-1">{s.title || s.name}</h6>
                  <div className="small text-muted">
                    {s.durationMinutes
                      ? s.durationMinutes + " mins"
                      : s.duration}
                  </div>
                </div>
                <div className="text-end">
                  <div className="fw-bold">₹{s.price || "Call"}</div>
                </div>
              </div>
              <div className="mt-3 d-flex justify-content-between">
                <div>
                  <button className="btn btn-sm btn-outline-success me-2">
                    Select
                  </button>
                </div>
                <div>
                  <button
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => openEdit(s)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => dispatch(deleteService(s._id || s.id))}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {show && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block">
              <div className="modal-dialog modal-lg-custom">
                <form className="modal-content" onSubmit={submit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editing ? "Edit Service" : "Add Service"}
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
                      <label className="form-label">Title</label>
                      <input
                        className="form-control"
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-control"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
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
                      <label className="form-label">Duration (minutes)</label>
                      <input
                        className="form-control"
                        type="number"
                        value={form.durationMinutes}
                        onChange={(e) =>
                          setForm({ ...form, durationMinutes: e.target.value })
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

export default Services;
