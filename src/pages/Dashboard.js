import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSummary, fetchDaily } from "../features/dashboard/dashboardSlice";

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
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - 6);
  if (start.getFullYear() === end.getFullYear()) {
    return `${formatDayMonth(start)} - ${formatDateDisplay(end)}`;
  }
  return `${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
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
  const daily = useSelector((state) => state.dashboard.daily || []);

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchDaily(30));
  }, [dispatch]);

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
                  {formatWeekRangeLabel()}
                </small>
                <h4 className="m-0">{currency(summary.week || 0)}</h4>
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
              <tr className="table-info">
                <td>{formatTodayLabel()}</td>
                <td>{currency(summary.day || 0)}</td>
                <td>{formatWeekday(new Date())}</td>
              </tr>
              {(!daily || daily.length === 0) && (
                <tr>
                  <td colSpan={3}>No data</td>
                </tr>
              )}
              {daily
                .slice()
                .reverse()
                .map((row) => (
                  <tr key={row.date}>
                    <td>{formatDateDisplay(row.date)}</td>
                    <td>{currency(row.income)}</td>
                    <td>{formatWeekday(row.date)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
