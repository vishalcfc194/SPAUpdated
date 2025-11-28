import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalPortal from "../components/ModalPortal";
import TableControls from "../components/TableControls";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await dispatch(fetchServices()).unwrap();
    } catch (e) {
      console.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
    const id = setInterval(() => handleRefresh(), 30000);
    return () => clearInterval(id);
  }, [dispatch]);

  // Filter and paginate
  const filtered = services.filter(
    (s) =>
      (s.title || s.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedServices = filtered.slice(start, start + itemsPerPage);

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
      <div className="d-flex justify-content-between align-items-center mb-3">
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

      {/* Table View */}
      <div className="card p-3 mb-4">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th colSpan={5}>
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
                <th>Title</th>
                <th>Description</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-3">
                    No services found
                  </td>
                </tr>
              ) : (
                paginatedServices.map((s) => (
                  <tr key={s._id || s.id}>
                    <td className="fw-bold">{s.title || s.name}</td>
                    <td className="small">{s.description || "-"}</td>
                    <td>
                      {s.durationMinutes ? s.durationMinutes + " mins" : "-"}
                    </td>
                    <td>₹{s.price || 0}</td>
                    <td>
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
                    </td>
                  </tr>
                ))
              )}
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
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
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
                        placeholder="Enter Title"
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
                        placeholder="Enter Description"
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
                        placeholder="Enter Price"
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
                        placeholder="Enter Duration"
                        type="number"
                        value={form.durationMinutes}
                        onChange={(e) =>
                          setForm({ ...form, durationMinutes: e.target.value })
                        }
                      />
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
                      }}
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
