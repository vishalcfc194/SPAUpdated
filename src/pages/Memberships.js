import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import ModalPortal from "../components/ModalPortal";
import TableControls from "../components/TableControls";
import {
  fetchMemberships,
  createMembership,
  updateMembership,
  deleteMembership,
} from "../features/memberships/membershipSlice";
import {
  fetchBills,
  createBill,
  deleteBill,
} from "../features/bills/billSlice";
import {
  fetchClientMembershipServices,
  createClientMembershipService,
  deleteClientMembershipService,
} from "../features/clientMembershipServices/clientMembershipServiceSlice";
import { fetchClients } from "../features/clients/clientSlice";

const Memberships = () => {
  const dispatch = useDispatch();
  const { items: memberships, status } = useSelector(
    (s) => s.memberships || { items: [] }
  );
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [planMode, setPlanMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    price: 0,
    durationMonths: 1,
    benefits: "",
    sessions: 0,
    sessionDuration: 60,
    details: "",
  });
  const bills = useSelector((s) => s.bills.items || []);
  const services = useSelector((s) => s.clientMembershipServices.items || []);
  const clients = useSelector((s) => s.clients?.items || []);
  const [managePurchase, setManagePurchase] = useState(null);
  const [manageServices, setManageServices] = useState(null);
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [selectedExtras, setSelectedExtras] = useState({});
  const [serviceCheckboxes, setServiceCheckboxes] = useState({});
  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    serviceLabel: "",
    date: new Date().toISOString().split("T")[0],
    fromTime: "",
    toTime: "",
    notes: "",
  });
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        dispatch(fetchMemberships()).unwrap(),
        dispatch(fetchBills()).unwrap(),
        dispatch(fetchClientMembershipServices()).unwrap(),
        dispatch(fetchClients()).unwrap(),
      ]);
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

  // Filter and paginate membership clients
  const membershipBills = bills.filter((b) =>
    (b.items || []).some((it) => it.itemType === "membership")
  );
  const filtered = membershipBills.filter(
    (b) =>
      (b.clientName || b.client || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (b.clientPhone || "").includes(searchTerm)
  );
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paginatedBills = filtered.slice(start, start + itemsPerPage);

  // When opening manageServices, initialize checkbox state from logged services
  useEffect(() => {
    if (!manageServices) {
      setServiceCheckboxes({});
      return;
    }

    const item =
      (manageServices.items || []).find((it) => it.itemType === "membership") ||
      {};
    const plan =
      memberships.find(
        (m) => (m._id || m.id) === (item.membership || item.membershipId)
      ) || {};

    const spaSessions = Number(item.spa_sessions || plan.spa_sessions || 0);
    const jacuzziSessions = Number(item.jacuzzi || plan.jacuzzi || 0);
    const hamamSessions = Number(item.hamam || plan.hamam || 0);

    const serviceList = [];
    for (let i = 1; i <= spaSessions; i++)
      serviceList.push({
        id: `spa_${i}`,
        label: `SPA Session ${i}`,
        type: "SPA",
      });
    for (let i = 1; i <= jacuzziSessions; i++)
      serviceList.push({
        id: `jacuzzi_${i}`,
        label: `Jacuzzi ${i}`,
        type: "Jacuzzi",
      });
    for (let i = 1; i <= hamamSessions; i++)
      serviceList.push({
        id: `hamam_${i}`,
        label: `Hamam ${i}`,
        type: "Hamam",
      });

    // Build a deterministic checked map by consuming serviceList entries
    // for each logged service. Match by exact label first, then by type.
    const checked = {};
    const matchedServices = (services || []).filter(
      (s) =>
        String(s.membershipBill?._id || s.membershipBill) ===
        String(manageServices._id || manageServices.id)
    );

    // Track which serviceList indices are already consumed (so duplicates don't mark the same checkbox)
    const consumed = new Set();

    matchedServices.forEach((s) => {
      const label = s.serviceLabel || s.service_label || s.service_taken || "";

      // try exact label match on first unused entry
      let idx = serviceList.findIndex(
        (sl, i) => !consumed.has(i) && label && sl.label === label
      );

      // fallback: match by type (SPA/Jacuzzi/Hamam) on first unused entry
      if (idx === -1 && s.serviceName) {
        idx = serviceList.findIndex(
          (sl, i) => !consumed.has(i) && sl.type === s.serviceName
        );
      }

      if (idx !== -1) {
        consumed.add(idx);
        checked[serviceList[idx].id] = true;
      }
    });

    setServiceCheckboxes(checked);
  }, [manageServices, services, memberships]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      client: "",
      phone: "",
      address: "",
      membershipId: "",
      staff: "",
      amount: "",
      discount: 0,
      date: new Date().toISOString().slice(0, 10),
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
    setPlanMode(false);
  };

  const openAddPlan = () => {
    // redirect to dedicated Membership Plans page
    navigate("/membership-plans");
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
    });
    setShow(true);
    document.body.classList.add("modal-open-blur");
    setPlanMode(true);
  };

  const submit = async (e) => {
    e.preventDefault();

    // Check if this is a membership plan edit/create or a purchase
    if (planMode) {
      // This is a membership plan (no strict validation enforced here)
      const planData = {
        name: form.name,
        price: Number(form.price),
        timing: form.timing,
        spa_sessions: Number(form.spa_sessions) || 0,
        jacuzzi: Number(form.jacuzzi) || 0,
        hamam: Number(form.hamam) || 0,
      };

      try {
        if (editing) {
          await dispatch(
            updateMembership({
              id: editing._id || editing.id,
              data: planData,
            })
          ).unwrap();
        } else {
          await dispatch(createMembership(planData)).unwrap();
        }
        setShow(false);
        setPlanMode(false);
        document.body.classList.remove("modal-open-blur");
      } catch (err) {
        console.error("Error saving membership plan", err);
      }
    } else {
      // This is a membership purchase
      const membership =
        memberships.find((m) => (m._id || m.id) === form.membershipId) || {};
      const item = {
        itemType: "membership",
        membership: form.membershipId,
        membershipId: form.membershipId,
        title: membership.name,
        price: Number(membership.price || form.amount || 0),
        sessions: Number(membership.sessions || 0),
        spa_sessions: Number(membership.spa_sessions || 0),
        jacuzzi: Number(membership.jacuzzi || 0),
        hamam: Number(membership.hamam || 0),
      };
      const payload = {
        clientName: form.client,
        clientPhone: form.phone,
        clientAddress: form.address || "",
        items: [item],
        total: Number(membership.price || form.amount || 0),
        dateFrom: form.date,
      };
      try {
        await dispatch(createBill(payload)).unwrap();
        setShow(false);
        setPlanMode(false);
        document.body.classList.remove("modal-open-blur");
      } catch (err) {
        console.error("Error creating membership bill", err);
      }
    }
  };

  // Format date to "15 Jan 2025" format
  const formatDateLong = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (n) => {
    return `₹${Math.round(Number(n || 0))}.00`;
  };

  return (
    <div>
      {/* Membership Clients Section - FIRST */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Membership Clients</h3>
        <button className="btn btn-primary" onClick={openAdd}>
          + Add Bill
        </button>
      </div>

      {/* Controls: Search, Refresh, Pagination */}
      <div className="card p-3 mb-4">
        <div className="table-responsive">
          <table className="table table-striped">
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
                <th>Client Details</th>
                <th>Plan & Purchase Date</th>
                <th className="text-center text-bold">Amount</th>
                <th className="text-center">Last Service</th>
                <th>Services</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.filter((b) =>
                (b.items || []).some((it) => it.itemType === "membership")
              ).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-3">
                    No membership clients yet
                  </td>
                </tr>
              )}
              {paginatedBills.map((p) => {
                const item =
                  (p.items || []).find((it) => it.itemType === "membership") ||
                  {};
                const plan =
                  memberships.find(
                    (m) =>
                      (m._id || m.id) === (item.membership || item.membershipId)
                  ) || {};

                // Calculate allocated, used, remaining based on SPA/Jacuzzi/Hamam
                const spaSessions = Number(
                  item.spa_sessions || plan.spa_sessions || 0
                );
                const jacuzziSessions = Number(
                  item.jacuzzi || plan.jacuzzi || 0
                );
                const hamamSessions = Number(item.hamam || plan.hamam || 0);
                const totalAllocated =
                  spaSessions + jacuzziSessions + hamamSessions;

                const used = (services || []).filter((s) => {
                  const sBillId = String(
                    s.membershipBill?._id || s.membershipBill || ""
                  );
                  const pId = String(p._id || p.id || "");
                  return sBillId === pId;
                }).length;
                const remaining = Math.max(0, totalAllocated - used);

                const planName =
                  plan.name ||
                  item.title ||
                  (item.membership && typeof item.membership === "object"
                    ? item.membership.name || item.membership.title
                    : item.membership) ||
                  "Membership";

                const purchaseDate = formatDateLong(
                  p.dateFrom || p.createdAt || p.date
                );

                // find services logged against this membership bill and compute latest date
                const servicesForBill = (services || []).filter((s) => {
                  const sBillId = String(
                    s.membershipBill?._id || s.membershipBill || ""
                  );
                  const pId = String(p._id || p.id || "");
                  return sBillId === pId;
                });

                let latestServiceTs = 0;
                servicesForBill.forEach((s) => {
                  const ts = s.date
                    ? Date.parse(s.date)
                    : s.createdAt
                    ? Date.parse(s.createdAt)
                    : NaN;
                  if (!isNaN(ts) && ts > latestServiceTs) latestServiceTs = ts;
                });

                return (
                  <tr key={p._id || p.id}>
                    <td>
                      <div className="fw-bold">{p.clientName || p.client}</div>
                      <small className="text-muted">
                        {p.clientPhone || "-"}
                      </small>
                    </td>
                    <td>
                      <div>{planName}</div>
                      <small className="text-muted">{purchaseDate}</small>
                    </td>
                    <td className="text-center align-middle">
                      {formatCurrency(p.total || item.price || 0)}
                    </td>
                    <td className="text-center align-middle">
                      {latestServiceTs
                        ? formatDateLong(new Date(latestServiceTs))
                        : "-"}
                    </td>
                    <td>
                      <div className="small">
                        <div>
                          Allocated: <strong>{totalAllocated}</strong>
                        </div>
                        <div>
                          Used: <strong>{used}</strong>
                        </div>
                        <div>
                          Remaining:{" "}
                          <strong
                            className={
                              remaining === 0 ? "text-danger" : "text-success"
                            }
                          >
                            {remaining}
                          </strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => {
                            setManageServices(p);
                            setServiceCheckboxes({});
                            document.body.classList.add("modal-open-blur");
                          }}
                        >
                          Manage Services
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this membership purchase?"
                              )
                            ) {
                              dispatch(deleteBill(p._id || p.id));
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="d-flex justify-content-center gap-2 mb-4">
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ← Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`btn btn-sm ${
                currentPage === i + 1 ? "btn-primary" : "btn-outline-secondary"
              }`}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="btn btn-sm btn-outline-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Services Section */}
      <div className="mb-4">
        <h3>Services</h3>
        <div className="card p-3">
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Service Name</th>
                  <th>Used Count</th>
                  <th>Last Used</th>
                </tr>
              </thead>
              <tbody>
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted py-3">
                      No services logged yet
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const servicesSummary = {};
                    services.forEach((s) => {
                      const name = s.serviceName || "Unknown";
                      if (!servicesSummary[name])
                        servicesSummary[name] = { count: 0, lastDate: null };
                      servicesSummary[name].count++;
                      const sDate = s.date || s.createdAt;
                      const sTs = sDate ? Date.parse(sDate) : 0;
                      const lastTs = servicesSummary[name].lastDate
                        ? Date.parse(servicesSummary[name].lastDate)
                        : 0;
                      if (sTs > lastTs) servicesSummary[name].lastDate = sDate;
                    });
                    return Object.entries(servicesSummary).map(
                      ([name, data]) => (
                        <tr key={name}>
                          <td>{name}</td>
                          <td>{data.count}</td>
                          <td>{formatDateLong(data.lastDate)}</td>
                        </tr>
                      )
                    );
                  })()
                )}
              </tbody>
            </table>
          </div>
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
                          : "Purchase Membership"}
                      </h5>
                      <small className="text-muted">
                        {form.name
                          ? "Add or edit membership plan details"
                          : "Create a new membership purchase"}
                      </small>
                    </div>
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
                    <div className="container-fluid">
                      {/* MEMBERSHIP PLAN FORM */}
                      {form.name ? (
                        <>
                          {/* Plan Details */}
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
                                placeholder="e.g., Cream/Gel/Premium Oil Therapy"
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

                          {/* Timing Row */}
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

                          {/* Sessions */}
                          <div className="row g-2 mb-3">
                            <div className="col-md-4">
                              <label className="form-label">SPA Sessions</label>
                              <input
                                className="form-control form-control-lg"
                                type="number"
                                value={form.spa_sessions}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    spa_sessions: e.target.value,
                                  })
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
                        </>
                      ) : (
                        <>
                          {/* MEMBERSHIP PURCHASE FORM */}
                          {/* Row 1: Client Details */}
                          <div className="row g-2 mb-3">
                            <div className="col-md-4">
                              <label className="form-label">Client name</label>
                              <input
                                className="form-control form-control-lg"
                                value={form.client}
                                placeholder="Client full name"
                                onChange={(e) =>
                                  setForm({ ...form, client: e.target.value })
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">
                                Mobile number
                              </label>
                              <input
                                className="form-control form-control-lg"
                                value={form.phone}
                                placeholder="Mobile number"
                                onChange={(e) =>
                                  setForm({ ...form, phone: e.target.value })
                                }
                              />
                            </div>
                            <div className="col-md-4">
                              <label className="form-label">Address</label>
                              <input
                                className="form-control form-control-lg"
                                value={form.address}
                                placeholder="Address"
                                onChange={(e) =>
                                  setForm({ ...form, address: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          {/* Row 2: Membership Selection */}
                          <div className="row g-2 mb-3 align-items-end">
                            <div className="col-md-6">
                              <label className="form-label">
                                Select Membership Plan
                              </label>
                              <select
                                className="form-select form-select-lg"
                                value={form.membershipId}
                                onChange={(e) => {
                                  const membership =
                                    memberships.find(
                                      (m) => (m._id || m.id) === e.target.value
                                    ) || {};
                                  setForm({
                                    ...form,
                                    membershipId: e.target.value,
                                    amount: membership.price || "",
                                  });
                                }}
                              >
                                <option value="">Select membership</option>
                                {memberships.map((m) => (
                                  <option
                                    key={m._id || m.id}
                                    value={m._id || m.id}
                                  >
                                    {m.name} — ₹{m.price}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-md-6">
                              <label className="form-label">Date</label>
                              <input
                                className="form-control"
                                type="date"
                                value={form.date}
                                onChange={(e) =>
                                  setForm({ ...form, date: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          {/* Row 3: Membership Details */}
                          {form.membershipId &&
                            (() => {
                              const selected =
                                memberships.find(
                                  (m) => (m._id || m.id) === form.membershipId
                                ) || {};
                              return (
                                <div className="alert alert-info mb-3">
                                  <div className="row mb-2">
                                    <div className="col-md-3">
                                      <strong>Sessions:</strong>{" "}
                                      {selected.sessions || 0}
                                    </div>
                                    <div className="col-md-3">
                                      <strong>Duration:</strong>{" "}
                                      {selected.sessionDuration || 0} min
                                    </div>
                                    <div className="col-md-3">
                                      <strong>Price:</strong> ₹
                                      {selected.price || 0}
                                    </div>
                                    <div className="col-md-3">
                                      <strong>Validity:</strong>{" "}
                                      {selected.durationMonths || 1} month(s)
                                    </div>
                                  </div>
                                  {selected.details && (
                                    <div className="small">
                                      <strong>Features:</strong>
                                      <ul className="mb-0 mt-1">
                                        {selected.details
                                          .split("\n")
                                          .map((d, i) => (
                                            <li key={i}>{d}</li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                          {/* Row 4: Amount Display */}
                          <div className="row">
                            <div className="col-12 d-flex justify-content-end">
                              <div style={{ minWidth: 220 }}>
                                <label className="form-label">Total (₹)</label>
                                <input
                                  className="form-control form-control-lg text-end"
                                  readOnly
                                  value={form.amount}
                                />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="modal-footer border-0"
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
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={
                        planMode ? false : !form.client || !form.membershipId
                      }
                      title={
                        planMode ? "Update plan" : "Generate membership bill"
                      }
                    >
                      {planMode ? "Update plan" : "Generate Bill"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {managePurchase && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block">
              <div className="modal-dialog modal-lg-custom">
                <div className="modal-content">
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <h5 className="modal-title">Manage Membership</h5>
                    <button
                      className="btn-close"
                      onClick={() => {
                        setManagePurchase(null);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-2">
                      <strong>Client:</strong>{" "}
                      {managePurchase.clientName || managePurchase.client} (
                      {managePurchase.clientPhone || ""})
                    </div>
                    <div className="mb-2">
                      <strong>Plan:</strong>{" "}
                      {(() => {
                        const it =
                          managePurchase.items && managePurchase.items[0];
                        if (!it) return "Membership";
                        if (it.title) return it.title;
                        if (it.membership) {
                          if (typeof it.membership === "object")
                            return (
                              it.membership.name ||
                              it.membership.title ||
                              "Membership"
                            );
                          return it.membership;
                        }
                        return "Membership";
                      })()}
                    </div>
                    <hr />
                    {(() => {
                      const item =
                        (managePurchase.items || []).find(
                          (it) => it.itemType === "membership"
                        ) || {};
                      const plan =
                        memberships.find(
                          (m) =>
                            (m._id || m.id) ===
                            (item.membership || item.membershipId)
                        ) || {};
                      const total = Number(item.sessions || plan.sessions || 0);
                      const used = bills.reduce(
                        (acc, bb) =>
                          acc +
                          ((bb.items || []).some(
                            (it) =>
                              it.itemType === "service" &&
                              it.membershipPurchaseId ===
                                (managePurchase._id || managePurchase.id)
                          )
                            ? 1
                            : 0),
                        0
                      );
                      const remaining = Math.max(0, total - used);
                      const arr = Array.from(
                        { length: total },
                        (_, i) => i + 1
                      );
                      return (
                        <div>
                          <div className="mb-2">
                            Remaining {remaining} / {total}
                          </div>
                          <div className="mb-2">
                            <div className="small">Mark session(s) used:</div>
                            {arr.map((n) => {
                              const disabled = n <= used;
                              return (
                                <div key={n} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`sess_${n}`}
                                    disabled={disabled}
                                    checked={selectedSessions.includes(n)}
                                    onChange={(e) => {
                                      if (e.target.checked)
                                        setSelectedSessions((prev) => [
                                          ...prev,
                                          n,
                                        ]);
                                      else
                                        setSelectedSessions((prev) =>
                                          prev.filter((x) => x !== n)
                                        );
                                    }}
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`sess_${n}`}
                                  >
                                    Session #{n}{" "}
                                    {disabled ? "(already used)" : ""}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          {plan.details && (
                            <div className="mb-2">
                              <div className="small">Extras / Features</div>
                              {plan.details.split("\n").map((d, idx) => (
                                <div key={idx} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`extra_${idx}`}
                                    checked={!!selectedExtras[idx]}
                                    onChange={(e) =>
                                      setSelectedExtras((prev) => ({
                                        ...prev,
                                        [idx]: e.target.checked,
                                      }))
                                    }
                                  />
                                  <label
                                    className="form-check-label"
                                    htmlFor={`extra_${idx}`}
                                  >
                                    {d}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <div
                    className="modal-footer"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setManagePurchase(null);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        // create usage bills for selected sessions and extras
                        try {
                          for (const n of selectedSessions) {
                            const payload = {
                              clientName:
                                managePurchase.clientName ||
                                managePurchase.client,
                              clientPhone: managePurchase.clientPhone || "",
                              items: [
                                {
                                  itemType: "service",
                                  description: `Membership session #${n}`,
                                  price: 0,
                                  membershipPurchaseId:
                                    managePurchase._id || managePurchase.id,
                                },
                              ],
                              total: 0,
                              dateFrom: new Date().toISOString().slice(0, 10),
                            };
                            await dispatch(createBill(payload)).unwrap();
                          }
                          // extras as single bill
                          const extras = Object.keys(selectedExtras).filter(
                            (k) => selectedExtras[k]
                          );
                          if (extras.length > 0) {
                            const payload = {
                              clientName:
                                managePurchase.clientName ||
                                managePurchase.client,
                              clientPhone: managePurchase.clientPhone || "",
                              items: [
                                {
                                  itemType: "service",
                                  description: `Membership extras: ${extras
                                    .map(
                                      (i) => (plan.details || "").split("\n")[i]
                                    )
                                    .join(", ")}`,
                                  price: 0,
                                  membershipPurchaseId:
                                    managePurchase._id || managePurchase.id,
                                },
                              ],
                              total: 0,
                              dateFrom: new Date().toISOString().slice(0, 10),
                            };
                            await dispatch(createBill(payload)).unwrap();
                          }
                        } catch (e) {}
                        setManagePurchase(null);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    >
                      Save usage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Manage Services Modal */}
      {manageServices && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block">
              <div className="modal-dialog modal-lg">
                <div className="modal-content">
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <h5 className="modal-title">Manage Services Used</h5>
                    <button
                      className="btn-close"
                      onClick={() => {
                        setManageServices(null);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <strong>Client:</strong>{" "}
                      {manageServices.clientName || manageServices.client}
                      <br />
                      <strong>Phone:</strong>{" "}
                      {manageServices.clientPhone || "-"}
                    </div>
                    <hr />
                    <div className="mb-3">
                      <h6>Available Services to Mark as Used:</h6>
                      {(() => {
                        const item =
                          (manageServices.items || []).find(
                            (it) => it.itemType === "membership"
                          ) || {};
                        const plan =
                          memberships.find(
                            (m) =>
                              (m._id || m.id) ===
                              (item.membership || item.membershipId)
                          ) || {};

                        const spaSessions = Number(
                          item.spa_sessions || plan.spa_sessions || 0
                        );
                        const jacuzziSessions = Number(
                          item.jacuzzi || plan.jacuzzi || 0
                        );
                        const hamamSessions = Number(
                          item.hamam || plan.hamam || 0
                        );

                        const used = (services || []).filter((s) => {
                          const sBillId = String(
                            s.membershipBill?._id || s.membershipBill || ""
                          );
                          const mBillId = String(
                            manageServices._id || manageServices.id || ""
                          );
                          return sBillId === mBillId;
                        }).length;

                        const serviceList = [];

                        // Add SPA sessions
                        for (let i = 1; i <= spaSessions; i++) {
                          serviceList.push({
                            id: `spa_${i}`,
                            label: `SPA Session ${i}`,
                            type: "SPA",
                          });
                        }

                        // Add Jacuzzi sessions
                        for (let i = 1; i <= jacuzziSessions; i++) {
                          serviceList.push({
                            id: `jacuzzi_${i}`,
                            label: `Jacuzzi ${i}`,
                            type: "Jacuzzi",
                          });
                        }

                        // Add Hamam sessions
                        for (let i = 1; i <= hamamSessions; i++) {
                          serviceList.push({
                            id: `hamam_${i}`,
                            label: `Hamam ${i}`,
                            type: "Hamam",
                          });
                        }

                        if (serviceList.length === 0) {
                          return (
                            <p className="text-muted small">
                              No services in this membership plan
                            </p>
                          );
                        }

                        return (
                          <div>
                            <div className="mb-2 small text-muted">
                              Total Available: {serviceList.length} | Used:{" "}
                              {used}
                            </div>
                            <div className="row g-2">
                              {serviceList.map((svc) => (
                                <div key={svc.id} className="col-md-6 col-lg-4">
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={svc.id}
                                      checked={!!serviceCheckboxes[svc.id]}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // Open service form for this service
                                          setSelectedServiceId(svc.id);
                                          setServiceForm({
                                            serviceName: svc.type,
                                            serviceLabel: svc.label,
                                            date: new Date()
                                              .toISOString()
                                              .split("T")[0],
                                            fromTime: "",
                                            toTime: "",
                                            notes: "",
                                          });
                                          setShowServiceForm(true);
                                        } else {
                                          setServiceCheckboxes((prev) => ({
                                            ...prev,
                                            [svc.id]: false,
                                          }));
                                        }
                                      }}
                                    />
                                    <label
                                      className="form-check-label small"
                                      htmlFor={svc.id}
                                    >
                                      {svc.label}
                                    </label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Service Form Modal (opens when a checkbox is clicked) */}
                    {showServiceForm && manageServices && (
                      <ModalPortal>
                        <div className="modal-backdrop show">
                          <div className="modal d-block" tabIndex={-1}>
                            <div className="modal-dialog modal-dialog-centered">
                              <div className="modal-content shadow-sm rounded">
                                <div
                                  className="modal-header"
                                  style={{ backgroundColor: "#f2f2f2" }}
                                >
                                  <h5 className="modal-title">
                                    Log Service Usage
                                  </h5>
                                  <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                      setShowServiceForm(false);
                                      setSelectedServiceId(null);
                                    }}
                                  ></button>
                                </div>
                                <div className="modal-body">
                                  <div className="mb-3">
                                    <label className="form-label">
                                      Service
                                    </label>
                                    <input
                                      className="form-control"
                                      readOnly
                                      value={serviceForm.serviceLabel}
                                    />
                                  </div>
                                  <div className="mb-3">
                                    <label className="form-label">Date</label>
                                    <input
                                      type="date"
                                      className="form-control"
                                      value={serviceForm.date}
                                      onChange={(e) =>
                                        setServiceForm((prev) => ({
                                          ...prev,
                                          date: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                  <div className="row g-2">
                                    <div className="col-md-6">
                                      <label className="form-label">
                                        From Time
                                      </label>
                                      <input
                                        type="time"
                                        className="form-control"
                                        value={serviceForm.fromTime}
                                        onChange={(e) =>
                                          setServiceForm((prev) => ({
                                            ...prev,
                                            fromTime: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label">
                                        To Time
                                      </label>
                                      <input
                                        type="time"
                                        className="form-control"
                                        value={serviceForm.toTime}
                                        onChange={(e) =>
                                          setServiceForm((prev) => ({
                                            ...prev,
                                            toTime: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div
                                  className="modal-footer border-0"
                                  style={{ backgroundColor: "#f2f2f2" }}
                                >
                                  <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                      setShowServiceForm(false);
                                      setSelectedServiceId(null);
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    className="btn btn-primary"
                                    onClick={async () => {
                                      try {
                                        // Find client ID by name
                                        const clientRecord = clients.find(
                                          (c) =>
                                            c.name ===
                                            (manageServices.clientName ||
                                              manageServices.client)
                                        );
                                        const clientId =
                                          clientRecord?._id || clientRecord?.id;

                                        if (!clientId) {
                                          alert(
                                            "Unable to find client. Please refresh the page and try again."
                                          );
                                          return;
                                        }

                                        const result = await dispatch(
                                          createClientMembershipService({
                                            client: clientId,
                                            membership: (
                                              manageServices.items || []
                                            ).find(
                                              (it) =>
                                                it.itemType === "membership"
                                            )?.membership,
                                            membershipBill: manageServices._id,
                                            serviceName:
                                              serviceForm.serviceName,
                                            serviceLabel:
                                              serviceForm.serviceLabel,
                                            date: serviceForm.date,
                                            fromTime: serviceForm.fromTime,
                                            toTime: serviceForm.toTime,
                                            notes: serviceForm.notes,
                                          })
                                        ).unwrap();

                                        // Mark checkbox as checked immediately
                                        setServiceCheckboxes((prev) => ({
                                          ...prev,
                                          [selectedServiceId]: true,
                                        }));

                                        // Dispatch fetch to ensure UI updates
                                        dispatch(
                                          fetchClientMembershipServices()
                                        );

                                        setShowServiceForm(false);
                                        setSelectedServiceId(null);
                                      } catch (err) {
                                        console.error(
                                          "Error logging service",
                                          err
                                        );
                                      }
                                    }}
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </ModalPortal>
                    )}

                    {/* Services Log Table */}
                    <hr />
                    <div className="mb-3">
                      <h6>Service Usage History:</h6>
                      <div className="table-responsive">
                        <table className="table table-sm table-striped">
                          <thead>
                            <tr>
                              <th>Service Name</th>
                              <th>Date</th>
                              <th>From Time</th>
                              <th>To Time</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {services
                              .filter((s) => {
                                const sBillId = String(
                                  s.membershipBill?._id ||
                                    s.membershipBill ||
                                    ""
                                );
                                const mBillId = String(
                                  manageServices._id || manageServices.id || ""
                                );
                                return sBillId === mBillId;
                              })
                              .map((s) => (
                                <tr key={s._id || s.id}>
                                  <td>{s.serviceName}</td>
                                  <td>{formatDateLong(s.date)}</td>
                                  <td>{s.fromTime || "-"}</td>
                                  <td>{s.toTime || "-"}</td>
                                  <td>
                                    <button
                                      className="btn btn-sm btn-danger"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "Delete this service record?"
                                          )
                                        ) {
                                          dispatch(
                                            deleteClientMembershipService(
                                              s._id || s.id
                                            )
                                          );
                                        }
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        {services.filter((s) => {
                          const sBillId = String(
                            s.membershipBill?._id || s.membershipBill || ""
                          );
                          const mBillId = String(
                            manageServices._id || manageServices.id || ""
                          );
                          return sBillId === mBillId;
                        }).length === 0 && (
                          <p className="text-muted small">
                            No services logged yet
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="modal-footer"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setManageServices(null);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    >
                      Close
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        // Mark selected services and close
                        setManageServices(null);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default Memberships;
