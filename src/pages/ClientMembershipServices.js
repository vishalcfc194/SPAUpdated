import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalPortal from "../components/ModalPortal";
import {
  fetchClientMembershipServices,
  createClientMembershipService,
  updateClientMembershipService,
  deleteClientMembershipService,
} from "../features/clientMembershipServices/clientMembershipServiceSlice";
import { fetchClients } from "../features/clients/clientSlice";
import { fetchMemberships } from "../features/memberships/membershipSlice";

const ClientMembershipServices = () => {
  const dispatch = useDispatch();
  const { items: services } = useSelector(
    (s) => s.clientMembershipServices || { items: [] }
  );
  const clients = useSelector((s) => s.clients.items || []);
  const memberships = useSelector((s) => s.memberships.items || []);

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    client: "",
    membership: "",
    service_taken: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    dispatch(fetchClientMembershipServices());
    dispatch(fetchClients());
    dispatch(fetchMemberships());
  }, [dispatch]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      client: "",
      membership: "",
      service_taken: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      client: s.client?._id || s.client || "",
      membership: s.membership?._id || s.membership || "",
      service_taken: s.service_taken || "",
      date: s.date
        ? s.date.split("T")[0]
        : new Date().toISOString().split("T")[0],
      notes: s.notes || "",
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const closeModal = () => {
    setShow(false);
    document.body.classList.remove("modal-open-blur");
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await dispatch(
          updateClientMembershipService({
            id: editing._id || editing.id,
            data: form,
          })
        ).unwrap();
      } else {
        await dispatch(createClientMembershipService(form)).unwrap();
      }
      closeModal();
    } catch (err) {
      console.error("Error:", err);
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find((c) => (c._id || c.id) === clientId);
    return client ? client.name : "Unknown";
  };

  const getMembershipName = (membershipId) => {
    const membership = memberships.find(
      (m) => (m._id || m.id) === membershipId
    );
    return membership ? membership.name : "Unknown";
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Client Membership Services</h3>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Service Log
        </button>
      </div>

      <div className="card mt-3 p-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Client</th>
                <th>Membership</th>
                <th>Service Taken</th>
                <th>Date</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    No service logs yet
                  </td>
                </tr>
              )}
              {services.map((s) => (
                <tr key={s._id || s.id}>
                  <td>{getClientName(s.client?._id || s.client)}</td>
                  <td>
                    {getMembershipName(s.membership?._id || s.membership)}
                  </td>
                  <td>{s.service_taken || "-"}</td>
                  <td>
                    {s.date
                      ? new Date(s.date).toISOString().split("T")[0]
                      : "-"}
                  </td>
                  <td>{s.notes || "-"}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={() => openEdit(s)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() =>
                        dispatch(deleteClientMembershipService(s._id || s.id))
                      }
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
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog modal-dialog-centered">
                <form
                  onSubmit={submit}
                  className="modal-content p-3 shadow-sm rounded"
                >
                  <div className="modal-header border-0">
                    <h5 className="modal-title">
                      {editing ? "Edit Service Log" : "Add Service Log"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeModal}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Client</label>
                      <select
                        className="form-select"
                        value={form.client}
                        onChange={(e) =>
                          setForm({ ...form, client: e.target.value })
                        }
                        required
                      >
                        <option value="">Select client</option>
                        {clients.map((c) => (
                          <option key={c._id || c.id} value={c._id || c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Membership</label>
                      <select
                        className="form-select"
                        value={form.membership}
                        onChange={(e) =>
                          setForm({ ...form, membership: e.target.value })
                        }
                        required
                      >
                        <option value="">Select membership</option>
                        {memberships.map((m) => (
                          <option key={m._id || m.id} value={m._id || m.id}>
                            {m.name} — ₹{m.price}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Service Taken</label>
                      <input
                        className="form-control"
                        type="text"
                        placeholder="e.g., SPA 60 Min, Jacuzzi, Hamam"
                        value={form.service_taken}
                        onChange={(e) =>
                          setForm({ ...form, service_taken: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date</label>
                      <input
                        className="form-control"
                        type="date"
                        value={form.date}
                        onChange={(e) =>
                          setForm({ ...form, date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Notes</label>
                      <textarea
                        className="form-control"
                        placeholder="Optional notes"
                        value={form.notes}
                        onChange={(e) =>
                          setForm({ ...form, notes: e.target.value })
                        }
                        rows={3}
                      ></textarea>
                    </div>
                  </div>
                  <div className="modal-footer border-0">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editing ? "Update" : "Add"}
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

export default ClientMembershipServices;
