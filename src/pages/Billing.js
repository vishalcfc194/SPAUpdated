import React, { useEffect, useState } from "react";
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
import { createClient, deleteClient } from "../features/clients/clientSlice";
import { generatePDFBill } from "../utils/pdf";
import { toast } from "react-toastify";
import ModalPortal from "../components/ModalPortal";
import TableControls from "../components/TableControls";

const todayISO = (() => {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
})();

function formatDateDisplay(d) {
  if (!d) return "";
  // Accept ISO date or timestamp and render like "15 jan 2025"
  try {
    let dt;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      dt = new Date(d + "T00:00:00");
    } else {
      dt = new Date(d);
    }
    if (isNaN(dt.getTime())) return String(d);
    const day = dt.getDate();
    const monthNames = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];
    const month = monthNames[dt.getMonth()];
    const year = dt.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return String(d);
  }
}

function parseServiceDuration(s) {
  // Accept multiple possible fields and formats. Return minutes.
  if (!s) return 0;
  const maybe = (obj, keys) => {
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return undefined;
  };
  const val = maybe(s, [
    "duration",
    "durationMinutes",
    "minutes",
    "time",
    "length",
    "duration_min",
    "duration_mins",
  ]);
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // formats: "HH:MM" or numeric string (minutes)
    const m = String(val).match(/^(\d+):(\d+)$/);
    if (m) return Number(m[1]) * 60 + Number(m[2]);
    const n = Number(String(val).replace(/[^0-9.]/g, ""));
    if (!isNaN(n)) return n;
  }
  return 0;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function addMinutesToTime(hhmm, minutes) {
  if (!hhmm) hhmm = "09:00";
  const parts = hhmm.split(":");
  let h = parseInt(parts[0], 10) || 0;
  let m = parseInt(parts[1], 10) || 0;
  let total = h * 60 + m + Number(minutes || 0);
  total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${pad(nh)}:${pad(nm)}`;
}

function hhmmTo12(hhmm) {
  if (!hhmm) return { h12: "9", mm: "00", ampm: "AM" };
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr || 0);
  const m = pad(Number(mStr || 0));
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return { h12: String(h), mm: m, ampm };
}

function format24To12Display(hhmm) {
  if (!hhmm) return "";
  const p = hhmmTo12(hhmm);
  return `${p.h12}:${p.mm} ${p.ampm}`;
}

// Format amount to show no decimals but always ".00" suffix
function formatNoDecimal(n) {
  const num = Number(n) || 0;
  // show rounded integer with .00 suffix (no fractional paise shown)
  return `${Math.round(num)}.00`;
}

function parse12InputTo24(input) {
  if (!input) return null;
  input = String(input).trim();
  // Accept: 2:30 PM, 2:30PM, 2 PM, 2pm, 14:30, 0230
  const direct24 = input.match(/^(\d{1,2}):(\d{2})$/);
  if (direct24) {
    const hh = Number(direct24[1]);
    const mm = Number(direct24[2]);
    if (hh >= 0 && hh < 24 && mm >= 0 && mm < 60)
      return `${pad(hh)}:${pad(mm)}`;
  }
  const rx = /^(\d{1,2})(?::?(\d{2}))?\s*([AaPp][Mm])?$/;
  const m = input.match(rx);
  if (!m) return null;
  let h = Number(m[1]);
  const mm = Number(m[2] || 0);
  const ampm = m[3] ? m[3].toUpperCase() : null;
  if (ampm) {
    if (ampm === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
  }
  if (h >= 0 && h < 24 && mm >= 0 && mm < 60) return `${pad(h)}:${pad(mm)}`;
  return null;
}

// Helper: render a human-friendly label for an item (service/membership)
function getItemLabel(it) {
  if (!it) return "";
  if (it.title) return it.title;
  if (it.name) return it.name;
  if (it.service) return it.service.title || it.service.name || it.service;
  if (it.membership) {
    if (typeof it.membership === "object")
      return (
        it.membership.name ||
        it.membership.title ||
        it.membership._id ||
        "Membership"
      );
    return it.membership;
  }
  return it.description || "";
}

const Billing = () => {
  const dispatch = useDispatch();
  const bills = useSelector((s) => s.bills.items || []);
  const services = useSelector((s) => s.services.items || []);
  const staff = useSelector((s) => s.staff.items || []);

  const [showModal, setShowModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [form, setForm] = useState({
    client: "",
    phone: "",
    address: "",
    serviceId: "",
    staff: "",
    amount: "",
    discount: 0,
    date: todayISO,
    from: "",
    to: "",
  });

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const [selectedMembershipPlan, setSelectedMembershipPlan] = useState(null);
  const [useMembership, setUseMembership] = useState(false);
  const [selectedMembershipPurchaseId, setSelectedMembershipPurchaseId] =
    useState("");

  useEffect(() => {
    dispatch(fetchBills());
    dispatch(fetchServices());
    dispatch(fetchMemberships());
    dispatch(fetchStaff());
  }, [dispatch]);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await dispatch(fetchBills()).unwrap();
      toast.success("Refreshed data successfully");
    } catch (e) {
      toast.error("Failed to refresh bills");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper: enrich bill before generating PDF so service and staff names are present
  const enrichBillForPDF = (result) => {
    try {
      const enriched = {
        ...result,
        items: (result.items || []).map((it) => {
          try {
            if (it.itemType === "service") {
              const sid = it.service || it.serviceId || it._id || it.id || "";
              const svc = services.find(
                (s) => String(s._id || s.id) === String(sid)
              );
              if (svc) return { ...it, service: svc };
            }
          } catch (e) {
            // ignore
          }
          return it;
        }),
        staff:
          result.staff && (result.staff.name || result.staff._id)
            ? result.staff
            : result.staff
            ? // if staff is string id, try lookup
              staff.find(
                (st) => String(st._id || st.id) === String(result.staff)
              ) || { name: result.staff }
            : null,
      };
      return enriched;
    } catch (e) {
      return result;
    }
  };

  const openModal = () => {
    setEditingBill(null);
    setForm({
      client: "",
      phone: "",
      address: "",
      serviceId: "",
      staff: "",
      amount: "",
      discount: 0,
      date: todayISO,
      from: "",
      to: "",
    });
    setShowModal(true);
    document.body.classList.add("modal-open-blur");
  };

  const openChoiceModal = () => {
    setShowChoiceModal(true);
  };

  const closeAllModals = () => {
    setShowChoiceModal(false);
    setShowModal(false);
    setShowMembershipModal(false);
    document.body.classList.remove("modal-open-blur");
  };

  const handleItemChange = (e) => {
    const value = e.target.value;
    const item = services.find(
      (s) =>
        (s._id || s.id) === value || String(s._id || s.id) === String(value)
    );
    const price = item ? item.price : "";
    const dur = item ? parseServiceDuration(item) : 0;
    // determine default from (now rounded to next 10 minutes)
    const defaultFrom = (() => {
      const d = new Date();
      const roundTo = 10; // minutes
      const mins = Math.ceil(d.getMinutes() / roundTo) * roundTo;
      d.setMinutes(mins);
      d.setSeconds(0);
      const hh = pad(d.getHours());
      const mm = pad(d.getMinutes());
      return `${hh}:${mm}`;
    })();
    setForm((prev) => {
      // if editing an existing bill, prefer existing from if set; otherwise use defaultFrom
      const fromVal = editingBill ? prev.from || defaultFrom : defaultFrom;
      return {
        ...prev,
        serviceId: value,
        amount: price,
        from: fromVal,
        // always set `to` based on service duration (even if dur is 0 it will be same as from)
        to: addMinutesToTime(fromVal, dur || 0),
      };
    });
  };

  function getActiveMembershipPurchasesForClient(clientNameOrPhone) {
    if (!clientNameOrPhone) return [];
    // find membership purchase bills for this client
    const purchases = bills.filter((b) => {
      const nameMatches =
        (b.clientName || b.client || "") === clientNameOrPhone ||
        (b.clientPhone || "") === clientNameOrPhone;
      const hasMembership = (b.items || []).some(
        (it) => it.itemType === "membership"
      );
      return nameMatches && hasMembership;
    });
    // for each purchase compute used sessions by counting service bills that reference this purchase id
    return purchases.map((p) => {
      const pid = p._id || p.id;
      const item =
        (p.items || []).find((it) => it.itemType === "membership") || {};
      const plan =
        memberships.find(
          (m) =>
            (m._id || m.id) ===
            (item.membership || item.membershipId || item.membershipId)
        ) || null;
      const totalSessions = plan
        ? Number(plan.sessions || plan.count || 0)
        : Number(item.sessions || 0);
      const used = bills.reduce((acc, b) => {
        // count service bills where items reference this purchase
        const has = (b.items || []).some(
          (it) =>
            it.itemType === "service" &&
            (it.membershipPurchaseId === pid || it.membershipPurchase === pid)
        );
        return acc + (has ? 1 : 0);
      }, 0);
      return {
        purchase: p,
        plan,
        totalSessions,
        used,
        remaining: Math.max(0, totalSessions - used),
      };
    });
  }

  const isFormValid = () => {
    const hasClient = String(form.client || "").trim() !== "";
    const hasPhone = String(form.phone || "").trim() !== "";
    const hasService = String(form.serviceId || "").trim() !== "";
    const hasAmount = Number(form.amount) > 0;
    const hasDate = String(form.date || "").trim() !== "";
    const hasFrom = String(form.from || "").trim() !== "";
    const hasTo = String(form.to || "").trim() !== "";
    const hasAddress = String(form.address || "").trim() !== "";
    const hasStaff = String(form.staff || "").trim() !== "";
    return (
      hasClient &&
      hasPhone &&
      hasAddress &&
      hasService &&
      hasStaff &&
      hasAmount &&
      hasDate &&
      hasFrom &&
      hasTo
    );
  };

  const computeNetAmount = () => {
    const amt = Number(form.amount) || 0;
    const disc = Number(form.discount) || 0;
    if (disc <= 0) return amt;
    const net = amt - (amt * disc) / 100;
    return Math.round(net * 100) / 100;
  };

  const submit = async (e) => {
    e.preventDefault();
    const item = {
      itemType: "service",
      quantity: 1,
      price: Number(form.amount),
      discountPercent: Number(form.discount) || 0,
      service: form.serviceId,
    };
    if (useMembership && selectedMembershipPurchaseId) {
      item.membershipPurchaseId = selectedMembershipPurchaseId;
      item.membershipUsed = true;
    }

    const payload = {
      clientName: form.client,
      clientPhone: form.phone,
      clientAddress: form.address,
      items: [item],
      total: computeNetAmount(),
      discountPercent: Number(form.discount) || 0,
      dateFrom: form.date,
      timeFrom: form.from,
      timeTo: form.to,
      // send staff id (server expects ObjectId)
      staff: form.staff || undefined,
    };

    try {
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
        // create bill and rollback created client if bill creation fails
        try {
          result = await dispatch(createBill(payload)).unwrap();
        } catch (createErr) {
          if (clientId) {
            try {
              await dispatch(deleteClient(clientId)).unwrap();
            } catch (delErr) {
              // ignore deletion error
            }
          }
          throw createErr;
        }
      }

      // Enrich result and refresh table so UI shows latest data
      const enriched = enrichBillForPDF(result);
      generatePDFBill(enriched);
      // refresh bills list to reflect create/update immediately
      dispatch(fetchBills());
      setShowModal(false);
      setEditingBill(null);
      document.body.classList.remove("modal-open-blur");
    } catch (err) {
      // ignore — handled elsewhere (errors are shown by thunks)
    }
  };

  const startEdit = (b) => {
    const itm = b.items && b.items[0];
    setEditingBill(b);
    setForm({
      client: b.clientName || "",
      phone: b.clientPhone || "",
      address: b.clientAddress || "",
      serviceId: itm ? itm.service?._id || itm.service : "",
      staff:
        b && b.staff
          ? typeof b.staff === "object"
            ? b.staff._id || b.staff.id || ""
            : // b.staff might be a string (name or id) - try to find matching staff by name, otherwise use as-is
              staff.find((st) => st.name === b.staff)?._id || b.staff
          : "",
      amount: itm ? itm.price : b.total,
      discount: itm ? itm.discountPercent || 0 : 0,
      date: b.dateFrom
        ? b.dateFrom
        : b.date
        ? new Date(b.date).toISOString().slice(0, 10)
        : todayISO,
      from: b.timeFrom || b.from || "",
      to: b.timeTo || b.to || "",
    });
    setShowModal(true);
    document.body.classList.add("modal-open-blur");
  };

  // Robust delete handler: prefer SweetAlert2 (if installed) else fallback to window.confirm
  const handleDelete = async (b) => {
    try {
      // try dynamic import of sweetalert2 (avoids hard dependency)
      let useSwal = null;
      try {
        const mod = await import("sweetalert2");
        useSwal = mod.default || mod;
      } catch (e) {
        useSwal = null;
      }

      if (useSwal) {
        const resp = await useSwal.fire({
          title: "Delete bill",
          text: "Are you sure you want to delete this bill?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, delete it",
          cancelButtonText: "Cancel",
        });
        if (!resp.isConfirmed) return;
      } else {
        const ok = window.confirm("Are you sure you want to delete this bill?");
        if (!ok) return;
      }

      await dispatch(deleteBill(b._id || b.id)).unwrap();
      toast.success("Bill deleted");
      // refresh list
      dispatch(fetchBills());
    } catch (err) {
      console.error("delete bill error", err);
      toast.error("Failed to delete bill");
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0">Billing</h3>
        <button className="btn btn-primary" onClick={openModal}>
          + Add Bill
        </button>
      </div>

      <div className="card p-3">
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th colSpan={9}>
                  <TableControls
                    searchTerm={search}
                    onSearchChange={(term) => {
                      setSearch(term);
                      setCurrentPage(1);
                    }}
                    onRefresh={handleRefresh}
                    onRefreshLoading={isRefreshing}
                    currentPage={currentPage}
                    onPageChange={setCurrentPage}
                    totalPages={Math.ceil(
                      (bills || []).filter((b) =>
                        (b.items || []).some((it) => it.itemType === "service")
                      ).length / itemsPerPage
                    )}
                    totalItems={
                      (bills || []).filter((b) =>
                        (b.items || []).some((it) => it.itemType === "service")
                      ).length
                    }
                  />
                </th>
              </tr>
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
              {(() => {
                const getTime = (d) => {
                  if (!d) return 0;
                  // Try normal date parse
                  const t = Date.parse(d);
                  if (!isNaN(t)) return t;
                  // If value looks like a Mongo ObjectId (24 hex chars), extract timestamp
                  try {
                    const s = String(d);
                    if (/^[0-9a-fA-F]{24}$/.test(s)) {
                      const ts = parseInt(s.substring(0, 8), 16) * 1000;
                      return ts;
                    }
                  } catch (e) {
                    // ignore
                  }
                  return 0;
                };
                const serviceBills = (bills || [])
                  .filter((b) =>
                    (b.items || []).some((it) => it.itemType === "service")
                  )
                  .sort((a, b) => {
                    // sort by createdAt (newest first), fallback to dateFrom or date
                    const ta = getTime(
                      a.createdAt || a.dateFrom || a.date || a._id
                    );
                    const tb = getTime(
                      b.createdAt || b.dateFrom || b.date || b._id
                    );
                    return tb - ta;
                  });
                const q = (search || "").trim().toLowerCase();
                const filteredBills = q
                  ? serviceBills.filter((b) => {
                      const clientStr = String(
                        b.clientName || b.client || ""
                      ).toLowerCase();
                      const phoneStr = String(
                        b.clientPhone || b.phone || ""
                      ).toLowerCase();
                      const it = (b.items || [])[0] || {};
                      let itemName = "";
                      if (it) {
                        if (it.service && (it.service.title || it.service.name))
                          itemName = it.service.title || it.service.name;
                        else if (it.membership && it.membership.name)
                          itemName = it.membership.name;
                        else if (it.itemType === "service")
                          itemName =
                            services.find(
                              (s) => (s._id || s.id) === (it.service || it._id)
                            )?.title || "";
                      }
                      itemName = String(itemName || "").toLowerCase();
                      const staffName = (
                        (b.staff && (b.staff.name || b.staff)) ||
                        (
                          staff.find(
                            (st) => String(st._id || st.id) === String(b.staff)
                          ) || {}
                        ).name ||
                        ""
                      ).toLowerCase();
                      const dateStr = b.dateFrom
                        ? formatDateDisplay(b.dateFrom)
                        : b.dateFrom
                        ? formatDateDisplay(b.dateFrom)
                        : "";
                      const dateLower = String(dateStr).toLowerCase();
                      return (
                        clientStr.includes(q) ||
                        phoneStr.includes(q) ||
                        itemName.includes(q) ||
                        staffName.includes(q) ||
                        dateLower.includes(q)
                      );
                    })
                  : serviceBills;

                // Pagination logic
                const start = (currentPage - 1) * itemsPerPage;
                const paginatedBills = filteredBills.slice(
                  start,
                  start + itemsPerPage
                );

                if (paginatedBills.length === 0) {
                  return (
                    <tr>
                      <td colSpan={8} className="text-center">
                        {filteredBills.length === 0
                          ? "No bills yet"
                          : "No results on this page"}
                      </td>
                    </tr>
                  );
                }

                return paginatedBills.map((b) => {
                  const item = b.items && b.items[0];
                  let itemName = "";
                  if (item) {
                    if (
                      item.service &&
                      (item.service.title || item.service.name)
                    )
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
                    (b.staff && (b.staff.name || b.staff)) ||
                    (
                      staff.find(
                        (st) => String(st._id || st.id) === String(b.staff)
                      ) || {}
                    ).name ||
                    "";
                  // Prefer the bill's scheduled date (`dateFrom`) over the document's creation `date`.
                  const dateStr = b.dateFrom
                    ? formatDateDisplay(b.dateFrom)
                    : b.date
                    ? formatDateDisplay(b.date)
                    : "";
                      return (
                        <tr key={b._id || b.id}>
                          <td>{b.clientName || b.client}</td>
                          <td>{itemName}</td>
                          <td>{staffName}</td>
                          <td>₹{formatNoDecimal(b.total)}</td>
                          <td>
                            {(() => {
                              const it = (b.items && b.items[0]) || null;
                              const price = Number(it?.price ?? b.amount ?? b.total ?? 0) || 0;
                              const pct = Number(
                                b.discountPercent ?? b.discount ?? (it && it.discountPercent) ?? 0
                              );
                              const discAmt = Math.round((price * pct) / 100) || 0;
                              return pct > 0 ? `₹${formatNoDecimal(discAmt)} (${pct}%)` : "-";
                            })()}
                          </td>
                          <td>{dateStr}</td>
                          <td>{b.timeFrom || b.from}</td>
                          <td>{b.timeTo || b.to}</td>
                          <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => {
                            const enriched = enrichBillForPDF(b);
                            generatePDFBill(enriched);
                          }}
                          title="Open PDF"
                        >
                          📄
                        </button>
                        <button
                          className="btn btn-sm btn-outline-success me-1"
                          onClick={() => {
                            const enriched = enrichBillForPDF(b);
                            generatePDFBill(enriched, { action: "print" });
                          }}
                          title="Print PDF"
                        >
                          🖨️
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => startEdit(b)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(b)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog modal-xl modal-dialog-centered">
                <form
                  onSubmit={submit}
                  className="modal-content shadow-sm rounded"
                >
                  <div
                    className="modal-header border-0"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <div>
                      <h5 className="modal-title mb-0">
                        {editingBill ? "Update Bill" : "Add Bill"}
                      </h5>
                      <small className="text-muted">
                        {editingBill
                          ? "Update a service invoice"
                          : "Create a new service invoice"}
                      </small>
                    </div>
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
                    <div className="container-fluid">
                      {/* Row 1 */}
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
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Mobile number</label>
                          <input
                            className="form-control form-control-lg"
                            value={form.phone}
                            placeholder="Mobile number"
                            onChange={(e) =>
                              setForm({ ...form, phone: e.target.value })
                            }
                            required
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
                            required
                          />
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="row g-2 mb-3 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label">Service</label>
                          <select
                            className="form-select form-select-lg"
                            value={form.serviceId}
                            onChange={handleItemChange}
                            required
                          >
                            <option value="">Select service</option>
                            {services.map((s) => (
                              <option key={s._id || s.id} value={s._id || s.id}>
                                {s.title || s.name} — ₹
                                {formatNoDecimal(s.price)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Staff</label>
                          <select
                            className="form-select form-select-lg"
                            value={form.staff}
                            onChange={(e) =>
                              setForm({ ...form, staff: e.target.value })
                            }
                            required
                          >
                            <option value="">Select staff</option>
                            {staff.map((s) => (
                              <option key={s._id || s.id} value={s._id || s.id}>
                                {s.name} — {s.role}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label">Subtotal (₹)</label>
                          <input
                            className="form-control form-control-lg"
                            type="number"
                            value={form.amount}
                            placeholder="Subtotal"
                            onChange={(e) =>
                              setForm({ ...form, amount: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="row g-2 mb-3 align-items-end">
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
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">
                            From --- {format24To12Display(form.from)}
                          </label>
                          <input
                            className="form-control"
                            type="time"
                            value={form.from}
                            onChange={(e) => {
                              const newFrom = e.target.value;
                              // lookup selected service to compute duration
                              const svc = services.find(
                                (s) =>
                                  String(s._id || s.id) ===
                                  String(form.serviceId)
                              );
                              const dur = svc ? parseServiceDuration(svc) : 0;
                              setForm((prev) => ({
                                ...prev,
                                from: newFrom,
                                to: addMinutesToTime(newFrom, dur || 0),
                              }));
                            }}
                          />
                          {/* <div className="form-text">
                            {format24To12Display(form.from)}
                          </div> */}
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">
                            To ---{format24To12Display(form.to)}
                          </label>
                          <input
                            className="form-control"
                            type="time"
                            value={form.to}
                            onChange={(e) =>
                              setForm({ ...form, to: e.target.value })
                            }
                          />
                          {/* <div className="form-text">
                            {format24To12Display(form.to)}
                          </div> */}
                        </div>
                        {/* membership usage selector (if client has active membership purchases) */}
                        {(() => {
                          const active = getActiveMembershipPurchasesForClient(
                            form.client || form.phone
                          ).filter((p) => p.remaining > 0);
                          if (!active || active.length === 0) return null;
                          return (
                            <div className="col-12 mb-2">
                              <div className="alert alert-info py-2">
                                <div className="mb-1">
                                  <strong>Active membership available</strong>
                                </div>
                                <div className="mb-2 small">
                                  {active.map((ap) => (
                                    <div
                                      key={ap.purchase._id || ap.purchase.id}
                                    >
                                      {(() => {
                                        const it =
                                          (ap.purchase &&
                                            ap.purchase.items &&
                                            ap.purchase.items[0]) ||
                                          null;
                                        return getItemLabel(it) || "Membership";
                                      })()}
                                      — Remaining {ap.remaining}
                                    </div>
                                  ))}
                                </div>
                                <select
                                  className="form-select"
                                  value={selectedMembershipPurchaseId}
                                  onChange={(e) => {
                                    setSelectedMembershipPurchaseId(
                                      e.target.value
                                    );
                                    setUseMembership(Boolean(e.target.value));
                                  }}
                                >
                                  <option value="">
                                    Do not use membership
                                  </option>
                                  {active.map((ap) => (
                                    <option
                                      key={ap.purchase._id || ap.purchase.id}
                                      value={ap.purchase._id || ap.purchase.id}
                                    >
                                      {(() => {
                                        const it =
                                          (ap.purchase &&
                                            ap.purchase.items &&
                                            ap.purchase.items[0]) ||
                                          null;
                                        return `${
                                          getItemLabel(it) || "Membership"
                                        } — Remaining ${ap.remaining}`;
                                      })()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          );
                        })()}
                        <div className="col-md-3">
                          <label className="form-label">Discount (%)</label>
                          <input
                            className="form-control"
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0 - 100"
                            value={form.discount}
                            onChange={(e) =>
                              setForm({ ...form, discount: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      {/* Row 4 */}
                      <div className="row">
                        <div className="col-12 d-flex justify-content-end">
                          <div style={{ minWidth: 220 }}>
                            <label className="form-label">Total (₹)</label>
                            <input
                              className="form-control form-control-lg text-end"
                              readOnly
                              value={formatNoDecimal(computeNetAmount())}
                            />
                          </div>
                        </div>
                      </div>
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
                        setShowModal(false);
                        document.body.classList.remove("modal-open-blur");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!isFormValid()}
                      title={
                        isFormValid()
                          ? editingBill
                            ? "Update bill"
                            : "Generate bill"
                          : "Fill all fields to enable"
                      }
                    >
                      {editingBill ? "Update Bill" : "Generate Bill"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showChoiceModal && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog modal-sm modal-dialog-centered">
                <div className="modal-content p-3 shadow-sm rounded">
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <h5 className="modal-title">Create Bill</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeAllModals}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>Select type to create:</p>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-primary flex-fill"
                        onClick={() => {
                          setShowChoiceModal(false);
                          openModal();
                        }}
                      >
                        Service
                      </button>
                      <button
                        className="btn btn-outline-success flex-fill"
                        onClick={() => {
                          setShowChoiceModal(false);
                          setShowMembershipModal(true);
                          document.body.classList.add("modal-open-blur");
                        }}
                      >
                        Membership
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {showMembershipModal && (
        <ModalPortal>
          <div className="modal-backdrop show">
            <div className="modal d-block" tabIndex={-1}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content p-3 shadow-sm rounded">
                  <div
                    className="modal-header"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <h5 className="modal-title">Purchase Membership</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeAllModals}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Client name</label>
                        <input
                          className="form-control"
                          value={form.client}
                          onChange={(e) =>
                            setForm({ ...form, client: e.target.value })
                          }
                          placeholder="Client full name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Mobile</label>
                        <input
                          className="form-control"
                          value={form.phone}
                          onChange={(e) =>
                            setForm({ ...form, phone: e.target.value })
                          }
                          placeholder="Mobile number"
                        />
                      </div>
                    </div>
                    <hr />
                    <div className="row g-2">
                      {memberships.map((m) => (
                        <div key={m._id || m.id} className="col-md-6 mb-3">
                          <div className="card h-100">
                            <div className="card-body">
                              <h6 className="card-title">{m.title}</h6>
                              <p className="card-text small text-muted">
                                {m.description}
                              </p>
                              <ul className="small">
                                {m.features &&
                                  m.features.map((f, i) => (
                                    <li key={i}>{f}</li>
                                  ))}
                                {!m.features &&
                                  m.details &&
                                  m.details
                                    .split("\n")
                                    .map((d, i) => <li key={i}>{d}</li>)}
                              </ul>
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>₹{formatNoDecimal(m.price)}</strong>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={async () => {
                                    setSelectedMembershipPlan(m);
                                    // create membership bill
                                    const item = {
                                      itemType: "membership",
                                      membership: m._id || m.id,
                                      price: Number(m.price || 0),
                                      sessions: m.sessions || m.count || 0,
                                    };
                                    const payload = {
                                      clientName: form.client,
                                      clientPhone: form.phone,
                                      clientAddress: form.address || "",
                                      items: [item],
                                      total: Number(m.price || 0),
                                      dateFrom: new Date()
                                        .toISOString()
                                        .slice(0, 10),
                                    };
                                    try {
                                      const result = await dispatch(
                                        createBill(payload)
                                      ).unwrap();
                                      // auto-generate PDF (enriched) and refresh table
                                      const enriched = enrichBillForPDF(result);
                                      generatePDFBill(enriched);
                                      dispatch(fetchBills());
                                      setShowMembershipModal(false);
                                      setShowModal(false);
                                      document.body.classList.remove(
                                        "modal-open-blur"
                                      );
                                    } catch (err) {
                                      // ignore
                                    }
                                  }}
                                >
                                  Purchase
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div
                    className="modal-footer"
                    style={{ backgroundColor: "#f2f2f2" }}
                  >
                    <button
                      className="btn btn-outline-secondary"
                      onClick={closeAllModals}
                    >
                      Close
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

export default Billing;
