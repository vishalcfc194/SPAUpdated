import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalPortal from "../components/ModalPortal";
import TableControls from "../components/TableControls";
import {
  fetchClients,
  createClient,
  updateClient,
  deleteClient,
} from "../features/clients/clientSlice";

const Clients = () => {
  const dispatch = useDispatch();
  const clients = useSelector((s) => s.clients.items || []);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    membership: "",
    notes: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await dispatch(fetchClients()).unwrap();
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
  const filtered = clients.filter(
    (c) =>
      (c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || "").includes(searchTerm) ||
      (c.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filtered.slice(start, start + itemsPerPage);

  const openAdd = () => {
    setEditing(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      membership: "",
      notes: "",
    });
    setShowModal(true);
    document.body.classList.add("modal-open-blur");
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      membership:
        c.membership && c.membership._id
          ? c.membership._id
          : c.membership || "",
      notes: c.notes || "",
    });
    setShowModal(true);
    document.body.classList.add("modal-open-blur");
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await dispatch(
          updateClient({ id: editing._id || editing.id, data: form })
        ).unwrap();
      } else {
        await dispatch(createClient(form)).unwrap();
      }
      setShowModal(false);
      document.body.classList.remove("modal-open-blur");
    } catch (err) {
      // slice toasts will show errors
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Clients</h3>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Client
        </button>
      </div>

      <div className="card mt-3 p-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th colSpan={7}>
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
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Membership</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-3">
                    No clients found
                  </td>
                </tr>
              )}
              {paginatedClients.map((c) => (
                <tr key={c._id || c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td>{c.address}</td>
                  <td>
                    {c.membership ? c.membership.name || c.membership : ""}
                  </td>
                  <td>{c.notes}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => openEdit(c)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => dispatch(deleteClient(c._id || c.id))}
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

      {showModal && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog modal-lg-custom">
                <form onSubmit={submit} className="modal-content">
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <h5 className="modal-title">
                      {editing ? "Edit Client" : "Add Client"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShowModal(false);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row g-2">
                      <div className="col-md-6">
                        <label className="form-label">Name</label>
                        <input
                          className="form-control"
                          value={form.name}
                          placeholder="Enter full name"
                          required
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Phone</label>
                        <input
                          className="form-control"
                          placeholder="Enter Phone Number"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-md-6">
                        <label className="form-label">Email</label>
                        <input
                          className="form-control"
                          placeholder="Enter Email Address"
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Address</label>
                        <input
                          className="form-control"
                          placeholder="Enter Address"
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-md-6">
                        <label className="form-label">Membership</label>
                        <input
                          className="form-control"
                          value={form.membership}
                          onChange={(e) =>
                            setForm({ ...form, membership: e.target.value })
                          }
                          placeholder="membership id or name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Notes</label>
                        <input
                          className="form-control"
                          placeholder="Enter Notes"
                          value={form.notes}
                          onChange={(e) =>
                            setForm({ ...form, notes: e.target.value })
                          }
                        />
                      </div>
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
                        setShowModal(false);
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

export default Clients;
