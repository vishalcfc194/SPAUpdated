import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ModalPortal from "../components/ModalPortal";
import TableControls from "../components/TableControls";
import {
  fetchMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
} from "../features/memberships/membershipSlice";

const MembershipPlans = () => {
  const dispatch = useDispatch();
  const { items: memberships, status } = useSelector(
    (s) => s.memberships || { items: [] }
  );

  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    name: "",
    price: 0,
    timing: "",
    spa_sessions: 0,
    jacuzzi: 0,
    hamam: 0,
    therapy_details: "",
  });

  useEffect(() => {
    dispatch(fetchMemberships());
  }, [dispatch]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await dispatch(fetchMemberships()).unwrap();
    } catch (e) {
      console.error("Failed to refresh memberships");
    } finally {
      setIsRefreshing(false);
    }
  };

  const openAddPlan = () => {
    setEditing(null);
    setForm({
      name: "",
      price: 0,
      timing: "",
      spa_sessions: 0,
      jacuzzi: 0,
      hamam: 0,
      therapy_details: "",
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      name: m.name || "",
      price: m.price || 0,
      timing: m.timing || "",
      spa_sessions: m.spa_sessions || 0,
      jacuzzi: m.jacuzzi || 0,
      hamam: m.hamam || 0,
      therapy_details: m.therapy_details || "",
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
  };

  const submit = async (e) => {
    e.preventDefault();
    const planData = {
      name: form.name,
      price: Number(form.price),
      timing: form.timing,
      spa_sessions: Number(form.spa_sessions) || 0,
      jacuzzi: Number(form.jacuzzi) || 0,
      hamam: Number(form.hamam) || 0,
      therapy_details: form.therapy_details || "",
    };

    try {
      if (editing) {
        await dispatch(
          updateMembership({ id: editing._id || editing.id, data: planData })
        ).unwrap();
      } else {
        await dispatch(createMembership(planData)).unwrap();
      }
      setShow(false);
      document.body.classList.remove("modal-open-blur");
    } catch (err) {
      console.error("Error saving membership plan", err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>
          Membership Plans{" "}
          {status === "loading" && (
            <small className="text-muted">(loading...)</small>
          )}
        </h3>
        <button className="btn btn-primary" onClick={openAddPlan}>
          + Add Plan
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
                    totalPages={Math.ceil(
                      memberships.filter(
                        (m) =>
                          (m.name || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          (m.timing || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      ).length / itemsPerPage
                    )}
                    totalItems={
                      memberships.filter(
                        (m) =>
                          (m.name || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          (m.timing || "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase())
                      ).length
                    }
                  />
                </th>
              </tr>
              <tr>
                <th>Name</th>
                <th>Timing</th>
                <th>SPA</th>
                <th>Jacuzzi</th>
                <th>Hamam</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filtered = memberships.filter(
                  (m) =>
                    (m.name || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    (m.timing || "")
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                );

                if (filtered.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-3">
                        {memberships.length === 0
                          ? "No membership plans yet"
                          : "No results on this page"}
                      </td>
                    </tr>
                  );
                }

                const start = (currentPage - 1) * itemsPerPage;
                const paginatedPlans = filtered.slice(
                  start,
                  start + itemsPerPage
                );

                return paginatedPlans.map((m, idx) => (
                  <tr key={m._id || m.id || idx}>
                    <td>
                      <div>{m.name}</div>
                      <small className="text-muted">{m.therapy_details}</small>
                    </td>
                    <td>{m.timing || "-"}</td>
                    <td>{m.spa_sessions || "-"}</td>
                    <td>{m.jacuzzi || "-"}</td>
                    <td>{m.hamam || "-"}</td>
                    <td>₹{m.price}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          dispatch(deleteMembership(m._id || m.id))
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {show && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog modal-xl modal-dialog-centered">
                <form
                  onSubmit={submit}
                  className="modal-content shadow-sm rounded"
                >
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <div>
                      <h5 className="modal-title mb-0">
                        {form.name
                          ? editing
                            ? "Edit Membership Plan"
                            : "Create Membership Plan"
                          : "Create Membership Plan"}
                      </h5>
                      <small className="text-muted">
                        Add or edit membership plan details
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => {
                        setShow(false);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    />
                  </div>
                  <div className="modal-body">
                    <div className="container-fluid">
                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <label className="form-label">Plan Name</label>
                          <input
                            className="form-control form-control-lg"
                            type="text"
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            placeholder="e.g., Cindrella Silver"
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Price (₹)</label>
                          <input
                            className="form-control form-control-lg"
                            type="number"
                            value={form.price}
                            onChange={(e) =>
                              setForm({ ...form, price: e.target.value })
                            }
                            placeholder="5999"
                          />
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-12">
                          <label className="form-label">Timing</label>
                          <input
                            className="form-control form-control-lg"
                            type="text"
                            value={form.timing}
                            onChange={(e) =>
                              setForm({ ...form, timing: e.target.value })
                            }
                            placeholder="e.g., 60 Min."
                          />
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-4">
                          <label className="form-label">SPA Sessions</label>
                          <input
                            className="form-control form-control-lg"
                            type="number"
                            value={form.spa_sessions}
                            onChange={(e) =>
                              setForm({ ...form, spa_sessions: e.target.value })
                            }
                            placeholder="5"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Jacuzzi</label>
                          <input
                            className="form-control form-control-lg"
                            type="number"
                            value={form.jacuzzi}
                            onChange={(e) =>
                              setForm({ ...form, jacuzzi: e.target.value })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Hamam</label>
                          <input
                            className="form-control form-control-lg"
                            type="number"
                            value={form.hamam}
                            onChange={(e) =>
                              setForm({ ...form, hamam: e.target.value })
                            }
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Therapy Details</label>
                        <textarea
                          className="form-control"
                          value={form.therapy_details}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              therapy_details: e.target.value,
                            })
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
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setShow(false);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    >
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit">
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

export default MembershipPlans;
