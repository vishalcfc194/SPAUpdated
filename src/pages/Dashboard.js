import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOverview } from "../features/dashboard/dashboardSlice";

const currency = (n) => {
  const value = Math.round(Number(n || 0));
  return `₹${value}.00`;
};

const formatDateDisplay = (ymd) => {
  if (!ymd) return "";
  try {
    const d = new Date(ymd);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return ymd;
  }
};

const formatDayMonth = (dateInput) => {
  if (!dateInput) return "";
  try {
    const d = new Date(dateInput);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch (e) {
    return dateInput;
  }
};

const formatWeekday = (ymd) => {
  if (!ymd) return "";
  try {
    const d = new Date(ymd);
    // full weekday name, e.g. 'Saturday'
    return d.toLocaleDateString("en-GB", { weekday: "long" });
  } catch (e) {
    return "";
  }
};

const formatTodayLabel = () => {
  return formatDateDisplay(new Date());
};

const formatWeekRangeLabel = () => {
  // Return label for current Monday -> Saturday period
  const today = new Date();
  // find most recent Monday (0=Sun,1=Mon...)
  const day = today.getDay();
  const offsetToMonday = (day + 6) % 7; // days since Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - offsetToMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  if (monday.getFullYear() === saturday.getFullYear()) {
    return `${formatDayMonth(monday)} - ${formatDateDisplay(saturday)}`;
  }
  return `${formatDateDisplay(monday)} - ${formatDateDisplay(saturday)}`;
};

const formatMonthLabel = () => {
  const d = new Date();
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
};

const formatYearLabel = () => {
  return new Date().getFullYear().toString();
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const summary = useSelector(
    (state) => state.dashboard.summary || { day: 0, week: 0, month: 0, year: 0 }
  );
  const overview = useSelector(
    (state) => state.dashboard.overview || { list: [], summaries: {} }
  );

  useEffect(() => {
    // Request dashboard overview (includes daily list and summaries)
    dispatch(fetchOverview({ days: 30 }));
  }, [dispatch]);

  // compute week (Mon-Sat) total from overview list
  const computeMonSatWeekTotal = () => {
    try {
      const today = new Date();
      const day = today.getDay();
      const offsetToMonday = (day + 6) % 7;
      const monday = new Date(today);
      monday.setDate(today.getDate() - offsetToMonday);
      const saturday = new Date(monday);
      saturday.setDate(monday.getDate() + 5);
      const monYmd = monday.toISOString().split("T")[0];
      const satYmd = saturday.toISOString().split("T")[0];
      const total = (overview.list || [])
        .filter((r) => {
          const d = r.iso || r.date;
          return d >= monYmd && d <= satYmd;
        })
        .reduce((acc, r) => acc + Number(r.income || 0), 0);
      return { total, monday, saturday };
    } catch (e) {
      return { total: summary.week || 0, monday: null, saturday: null };
    }
  };

  const {
    total: weekComputedTotal,
    monday: weekStartDate,
    saturday: weekEndDate,
  } = computeMonSatWeekTotal();

  const membershipSales = (overview && overview.membershipSales) || [];
  const mostSelling = (overview && overview.mostSelling) || null;
  const leastSelling = (overview && overview.leastSelling) || null;

  return (
    <div>
      <h3>Dashboard</h3>
      <div className="row g-3 my-3">
        <div className="col-sm-6 col-md-3">
          <div className="card card-spa p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Daily Income</h6>
                <small className="text-muted d-block">
                  {formatTodayLabel()}
                </small>
                <h4 className="m-0">{currency(summary.day || 0)}</h4>
              </div>
              <div className="fs-3 text-success">📈</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-md-3">
          <div className="card card-spa p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Weekly Income</h6>
                <small className="text-muted d-block">
                  {weekStartDate && weekEndDate
                    ? `${formatDayMonth(weekStartDate)} - ${formatDateDisplay(
                        weekEndDate
                      )}`
                    : formatWeekRangeLabel()}
                </small>
                <h4 className="m-0">
                  {currency(weekComputedTotal || summary.week || 0)}
                </h4>
              </div>
              <div className="fs-3 text-success">🗓️</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-md-3">
          <div className="card card-spa p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Monthly Income</h6>
                <small className="text-muted d-block">
                  {formatMonthLabel()}
                </small>
                <h4 className="m-0">{currency(summary.month || 0)}</h4>
              </div>
              <div className="fs-3 text-success">📅</div>
            </div>
          </div>
        </div>
        <div className="col-sm-6 col-md-3">
          <div className="card card-spa p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Yearly Income</h6>
                <small className="text-muted d-block">
                  {formatYearLabel()}
                </small>
                <h4 className="m-0">{currency(summary.year || 0)}</h4>
              </div>
              <div className="fs-3 text-success">💰</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-3 my-3">
        <div className="col-sm-6 col-md-4">
          <div className="card card-spa p-3">
            <h6 className="mb-2">Membership Sales</h6>
            {membershipSales.length === 0 ? (
              <small className="text-muted">No membership sales</small>
            ) : (
              <ul className="mb-0 ps-3">
                {membershipSales.map((m) => (
                  <li key={m._id}>
                    <strong>{m.membershipName || m._id}</strong>
                    {": "}
                    <span className="text-muted">{m.soldCount} sold</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="col-sm-6 col-md-4">
          <div className="card card-spa p-3">
            <h6 className="mb-1">Most Selling Membership</h6>
            {mostSelling ? (
              <div>
                <div className="fw-bold">
                  {mostSelling.membershipName || mostSelling._id}
                </div>
                <div className="text-muted">{mostSelling.soldCount} sold</div>
              </div>
            ) : (
              <small className="text-muted">No data</small>
            )}
          </div>
        </div>
        <div className="col-sm-6 col-md-4">
          <div className="card card-spa p-3">
            <h6 className="mb-1">Least Selling Membership</h6>
            {leastSelling ? (
              <div>
                <div className="fw-bold">
                  {leastSelling.membershipName || leastSelling._id}
                </div>
                <div className="text-muted">{leastSelling.soldCount} sold</div>
              </div>
            ) : (
              <small className="text-muted">No data</small>
            )}
          </div>
        </div>
      </div>

      <div className="card mt-4 p-3">
        <h6>Day-wise Income</h6>
        <div className="table-responsive">
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Date</th>
                <th>Income</th>
                <th>Day</th>
              </tr>
            </thead>
            <tbody>
              {(!overview.list || overview.list.length === 0) && (
                <tr>
                  <td colSpan={3}>No data</td>
                </tr>
              )}
              {overview.list &&
                overview.list.length > 0 &&
                overview.list
                  .slice()
                  .sort((a, b) => {
                    // robust numeric sort by ISO date (newest first)
                    const isoA = a.iso || a.date || "";
                    const isoB = b.iso || b.date || "";
                    const toMs = (s) => {
                      if (!s) return 0;
                      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                      if (m)
                        return Date.UTC(
                          parseInt(m[1]),
                          parseInt(m[2]) - 1,
                          parseInt(m[3])
                        );
                      const parsed = Date.parse(s);
                      return isNaN(parsed) ? 0 : parsed;
                    };
                    return toMs(isoB) - toMs(isoA);
                  })
                  .map((row) => {
                    // determine row type: past / current / future using UTC date values
                    const iso = row.iso || row.date;
                    const toMs = (s) => {
                      if (!s) return 0;
                      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                      if (m)
                        return Date.UTC(
                          parseInt(m[1]),
                          parseInt(m[2]) - 1,
                          parseInt(m[3])
                        );
                      const parsed = Date.parse(s);
                      return isNaN(parsed) ? 0 : parsed;
                    };
                    const isoMs = toMs(iso);
                    const today = new Date();
                    const todayStartMs = Date.UTC(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate()
                    );
                    let rowClass = "";
                    const rowStyle = {};
                    if (isoMs === todayStartMs) {
                      rowClass = "row-today"; // current date
                    } else if (isoMs > todayStartMs) {
                      rowClass = "row-future"; // future date base class
                      // compute days ahead
                      const daysAhead = Math.round(
                        (isoMs - todayStartMs) / 86400000
                      );
                      // generate a noticeable color shift by varying hue and lightness
                      const hueBase = 45; // start near yellow
                      const hueStep = 18; // degrees per day ahead
                      const hue =
                        (hueBase + Math.min(daysAhead, 10) * hueStep) % 360;
                      const lightness = Math.max(92 - daysAhead * 4, 62); // clamp so colors remain readable
                      const saturation = 85;
                      // use standard hsl syntax
                      rowStyle.backgroundColor = `hsl(${hue} ${saturation}% ${lightness}%)`;
                    }
                    return (
                      <tr
                        style={rowStyle}
                        className={rowClass}
                        key={iso || Math.random()}
                      >
                        <td>{row.date}</td>
                        <td>{currency(row.income)}</td>
                        <td>{row.day}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
