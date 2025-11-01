import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBills,
  createBill,
  updateBill,
  deleteBill,
} from "../features/bills/billSlice";
import { fetchStaff } from "../features/staff/staffSlice";
import { fetchServices } from "../features/services/serviceSlice";
import { fetchMemberships } from "../features/memberships/membershipSlice";
import { createClient } from "../features/clients/clientSlice";
import { generatePDFBill } from "../utils/pdf";
import ModalPortal from "../components/ModalPortal";

const Billing = () => {
  const [billsLocal, setBillsLocal] = useState([]); // used only for PDF preview when creating
  const [staffListLocal, setStaffListLocal] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [form, setForm] = useState({
    client: "",
    phone: "",
    address: "",
    serviceId: "",
    itemType: "",
    staff: "",
    amount: 0,
    discountPercent: 0,
    date: todayISO,
    from: "",
    to: "",
  });
  const [searchText, setSearchText] = useState("");
  const [editingBill, setEditingBill] = useState(null);

  // helper: return current time as HH:MM
  const getCurrentTimeHHMM = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const parseDurationMinutes = (duration) => {
    if (!duration) return 0;
    const m = duration.match(/(\d+)/);
    return m ? Number(m[0]) : 0;
  };

  const addMinutesToTime = (timeStr, minutesToAdd) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":");
    const date = new Date();
    date.setHours(Number(h));
    date.setMinutes(Number(m) + Number(minutesToAdd));
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const dispatch = useDispatch();
  const bills = useSelector((state) => state.bills.items || []);
  const services = useSelector((state) => state.services.items || []);
  const staff = useSelector((state) => state.staff.items || []);
  const memberships = useSelector((state) => state.memberships.items || []);

  useEffect(() => {
    dispatch(fetchBills());
    dispatch(fetchStaff());
    dispatch(fetchServices());
    dispatch(fetchMemberships());
    const id = setInterval(() => dispatch(fetchBills()), 5000);
    return () => {
      clearInterval(id);
      document.body.classList.remove("modal-open-blur");
    };
  }, [dispatch]);

  const openModal = () => {
    setForm({
      client: "",
      phone: "",
      address: "",
      serviceId: "",
      itemType: "",
      staff: "",
      amount: 0,
      discountPercent: 0,
      date: todayISO,
      from: getCurrentTimeHHMM(),
      to: "",
    });
    setShowModal(true);
    document.body.classList.add("modal-open-blur");
  };

  const parseServiceDuration = (s) => {
    if (!s) return 0;
    if (s.durationMinutes) return Number(s.durationMinutes);
    // fallback to duration string if it exists
    if (s.duration) {
      const m = String(s.duration).match(/(\d+)/);
      return m ? Number(m[0]) : 0;
    }
    return 0;
  };

  const filteredItems = !form.itemType
    ? []
    : (form.itemType === "service" ? services : memberships).filter((s) => {
        if (!searchText) return true;
        const label =
          (s.title || s.name || "") +
          " " +
          (s.description || "") +
          " " +
          (s.price || "");
        return label.toLowerCase().includes(searchText.toLowerCase());
      });

  const handleItemChange = (e) => {
    const value = e.target.value; // should be string id
    const type = form.itemType || "service";
    let item = null;
    if (type === "service") {
      item = services.find(
        (s) =>
          (s._id || s.id) === value || String(s._id || s.id) === String(value)
      );
    } else {
      item = memberships.find(
        (m) =>
          (m._id || m.id) === value || String(m._id || m.id) === String(value)
      );
    }

    const price = item ? item.price : 0;
    const duration = item ? parseServiceDuration(item) : 0;
    setForm((prev) => ({
      ...prev,
      serviceId: value,
      serviceName: item ? item.title || item.name : "",
      amount: price,
      to:
        duration && prev.from ? addMinutesToTime(prev.from, duration) : prev.to,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const item = {
      itemType: form.itemType || "service",
      quantity: 1,
      price: Number(form.amount),
    };
    if (form.itemType === "membership") item.membership = form.serviceId;
    else item.service = form.serviceId;

    const subtotal = Number(form.amount) * 1;
    const discountPercent = Number(form.discountPercent) || 0;
    const discountAmount =
      (subtotal * Math.max(0, Math.min(100, discountPercent))) / 100;
    const totalAfter = Math.max(0, subtotal - discountAmount);

    const payload = {
      clientName: form.client,
      clientPhone: form.phone,
      clientAddress: form.address,
      staffName: form.staff,
      items: [item],
      subtotal,
      discountPercent,
      discountAmount,
      total: totalAfter,
      dateFrom: form.date,
      timeFrom: form.from,
      timeTo: form.to,
    };
    try {
      // auto-create client record from name/phone/address
      let clientId = null;
      if (form.client) {
        try {
          const created = await dispatch(
            createClient({
              name: form.client,
              phone: form.phone,
              address: form.address,
            })
          ).unwrap();
          clientId = created._id || created.id;
        } catch (e) {
          // if create fails, continue without client id
          clientId = null;
        }
      }

      if (clientId) payload.client = clientId;

      let result;
      if (editingBill) {
        result = await dispatch(
          updateBill({ id: editingBill._id || editingBill.id, data: payload })
        ).unwrap();
      } else {
        result = await dispatch(createBill(payload)).unwrap();
      }
      // optional: show PDF for created/updated bill
      generatePDFBill(result);
      setShowModal(false);
      setEditingBill(null);
      document.body.classList.remove("modal-open-blur");
    } catch (err) {
      // slices will show toasts; keep modal open for fixes
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <h3>Billing</h3>
        <button className="btn btn-primary" onClick={openModal}>
          + Add Bill
        </button>
      </div>

      <div className="card mt-3 p-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Item</th>
                <th>Staff</th>
                <th>Amount</th>
                <th>Discount</th>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.length === 0 && (
                <tr>
                  <td colSpan={9}>No bills yet</td>
                </tr>
              )}
              {bills.map((b) => {
                const item = b.items && b.items[0];
                let itemName = "";
                if (item) {
                  if (item.service && (item.service.title || item.service.name))
                    itemName = item.service.title || item.service.name;
                  else if (item.membership && item.membership.name)
                    itemName = item.membership.name;
                  else if (item.itemType === "service")
                    itemName =
                      services.find(
                        (s) => (s._id || s.id) === (item.service || item._id)
                      )?.title || "";
                }
                const staffName =
                  b.staffName || (b.staff && (b.staff.name || b.staff)) || "";
                const dateObj = b.date
                  ? new Date(b.date)
                  : b.dateFrom
                  ? new Date(b.dateFrom)
                  : null;
                const dateStr = dateObj
                  ? dateObj.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "";
                return (
                  <tr key={b._id || b.id}>
                    <td>{b.clientName || b.client}</td>
                    <td>{itemName}</td>
                    <td>{staffName}</td>
                    <td>₹{b.total}</td>
                    <td>{b.discountPercent ? `${b.discountPercent}%` : "-"}</td>
                    <td>{dateStr}</td>
                    <td>{b.timeFrom || b.from}</td>
                    <td>{b.timeTo || b.to}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => generatePDFBill(b)}
                        title="Open PDF"
                      >
                        📄
                      </button>
                      <button
                        className="btn btn-sm btn-outline-success me-1"
                        onClick={() => generatePDFBill(b, { action: "print" })}
                        title="Print PDF"
                      >
                        🖨️
                      </button>
                      <button
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => {
                          // open edit modal
                          const itm = b.items && b.items[0];
                          // Extract ID from service/membership if it's an object
                          let serviceIdValue = "";
                          if (itm) {
                            if (itm.service) {
                              serviceIdValue =
                                itm.service._id ||
                                itm.service.id ||
                                itm.service;
                            } else if (itm.membership) {
                              serviceIdValue =
                                itm.membership._id ||
                                itm.membership.id ||
                                itm.membership;
                            }
                          }
                          setEditingBill(b);
                          setForm({
                            client: b.clientName || "",
                            phone: b.clientPhone || "",
                            address: b.clientAddress || "",
                            serviceId: serviceIdValue,
                            itemType: itm ? itm.itemType : "service",
                            staff:
                              b.staffName ||
                              (b.staff && (b.staff.name || b.staff)) ||
                              "",
                            amount: itm
                              ? itm.price
                              : b.subtotal || b.total || 0,
                            discountPercent: b.discountPercent || 0,
                            date: b.dateFrom
                              ? typeof b.dateFrom === "string"
                                ? b.dateFrom
                                : new Date(b.dateFrom)
                                    .toISOString()
                                    .slice(0, 10)
                              : b.date
                              ? new Date(b.date).toISOString().slice(0, 10)
                              : todayISO,
                            from: b.timeFrom || b.from || "",
                            to: b.timeTo || b.to || "",
                          });
                          setShowModal(true);
                          document.body.classList.add("modal-open-blur");
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              "Are you sure you want to delete this bill?"
                            )
                          ) {
                            dispatch(deleteBill(b._id || b.id));
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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
                  <div className="modal-header">
                    <h5 className="modal-title">Add Bill</h5>
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
                      <div className="col-md-4">
                        <label className="form-label">Client Name</label>
                        <input
                          className="form-control"
                          value={form.client}
                          placeholder="Enter client name"
                          onChange={(e) =>
                            setForm({ ...form, client: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Client Phone</label>
                        <input
                          className="form-control"
                          value={form.phone}
                          placeholder="Mobile number"
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label">Client Address</label>
                        <input
                          className="form-control"
                          value={form.address}
                          placeholder="Client address"
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-md-2">
                        <label className="form-label">Item Type</label>
                        <select
                          className="form-select "
                          value={form.itemType}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              itemType: e.target.value,
                              serviceId: "",
                              serviceName: "",
                              amount: 0,
                            })
                          }
                        >
                          <option value="">Select</option>
                          <option value="service">Service</option>
                          <option value="membership">Membership</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Item Name</label>
                        <select
                          className="form-select"
                          value={form.serviceId}
                          onChange={handleItemChange}
                          disabled={!form.itemType}
                          required
                        >
                          <option value="">
                            {!form.itemType
                              ? "Select item type first"
                              : `Select ${form.itemType}`}
                          </option>
                          {filteredItems.map((s) => (
                            <option key={s._id || s.id} value={s._id || s.id}>
                              {s.title || s.name} - ₹{s.price}{" "}
                              {s.description ? `(${s.description})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Staff</label>
                        <select
                          className="form-select"
                          value={form.staff}
                          onChange={(e) =>
                            setForm({ ...form, staff: e.target.value })
                          }
                        >
                          <option value="">Select staff</option>
                          {staff.map((s) => (
                            <option key={s._id || s.id} value={s.name}>
                              {s.name} - {s.role}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-2">
                        <label className="form-label">Amount</label>
                        <input
                          className="form-control"
                          type="number"
                          value={form.amount}
                          placeholder="Amount"
                          onChange={(e) =>
                            setForm({
                              ...form,
                              amount: Number(e.target.value) || 0,
                            })
                          }
                          style={{ minWidth: "80px" }}
                        />
                      </div>
                    </div>

                    <div className="row g-2 mt-2">
                      <div className="col-md-3">
                        <label className="form-label">Date</label>
                        <input
                          className="form-control"
                          type="date"
                          value={form.date}
                          onChange={(e) =>
                            setForm({ ...form, date: e.target.value })
                          }
                        />
                        {form.date && (
                          <small className="text-muted">
                            {new Date(form.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </small>
                        )}
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">From Time</label>
                        <input
                          className="form-control"
                          type="time"
                          value={form.from}
                          onChange={(e) => {
                            const newFrom = e.target.value;
                            const sel =
                              form.itemType === "service"
                                ? services.find(
                                    (s) =>
                                      (s._id || s.id) === form.serviceId ||
                                      String(s._id || s.id) ===
                                        String(form.serviceId)
                                  )
                                : memberships.find(
                                    (m) =>
                                      (m._id || m.id) === form.serviceId ||
                                      String(m._id || m.id) ===
                                        String(form.serviceId)
                                  );
                            const dur = sel ? parseServiceDuration(sel) : 0;
                            setForm({
                              ...form,
                              from: newFrom,
                              to: dur
                                ? addMinutesToTime(newFrom, dur)
                                : form.to,
                            });
                          }}
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">To Time</label>
                        <input
                          className="form-control"
                          type="time"
                          value={form.to}
                          onChange={(e) =>
                            setForm({ ...form, to: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <label className="form-label">Discount %</label>
                        <input
                          className="form-control"
                          type="number"
                          min={0}
                          max={100}
                          value={form.discountPercent}
                          placeholder="0"
                          onChange={(e) =>
                            setForm((prev) => {
                              const raw =
                                e.target.valueAsNumber ??
                                Number(e.target.value) ??
                                0;
                              const clamped = Math.max(
                                0,
                                Math.min(100, isNaN(raw) ? 0 : raw)
                              );
                              return { ...prev, discountPercent: clamped };
                            })
                          }
                          style={{ minWidth: "80px" }}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label">Discount Amount</label>
                        <input
                          className="form-control"
                          value={(
                            (Number(form.amount) || 0) *
                            (Math.max(
                              0,
                              Math.min(100, Number(form.discountPercent) || 0)
                            ) /
                              100)
                          ).toFixed(2)}
                          readOnly
                        />
                      </div>
                    </div>

                    <div className="row g-2 mt-3 justify-content-end">
                      {/* <div className="col-md-4">
                        <label className="form-label">Subtotal</label>
                        <input
                          className="form-control"
                          value={Number(form.amount) || 0}
                          readOnly
                        />
                      </div> */}

                      <div className="col-md-4">
                        <label className="form-label">
                          <b>Total</b>
                        </label>
                        <input
                          className="form-control"
                          value={(
                            (Number(form.amount) || 0) -
                            (Number(form.amount) || 0) *
                              (Math.max(
                                0,
                                Math.min(100, Number(form.discountPercent) || 0)
                              ) /
                                100)
                          ).toFixed(2)}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Generate Bill
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

export default Billing;
