import React, { useEffect, useState } from "react";
import { load } from "../utils/storage";

const currency = (n) => `₹${n}`;

const Dashboard = () => {
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const data = load("bills", []);
    setBills(data);
  }, []);

  const totals = bills.reduce(
    (acc, b) => {
      const amt = Number(b.total || b.amount || 0);
      const d = new Date(b.date);
      const today = new Date();
      const diffDays = Math.floor((today - d) / (1000 * 60 * 60 * 24));
      acc.year += amt;
      acc.month += amt; // simple approximation
      if (diffDays < 7) acc.week += amt;
      if (diffDays === 0) acc.day += amt;
      return acc;
    },
    { day: 0, week: 0, month: 0, year: 0 }
  );

  const dayWise = bills.reduce((map, b) => {
    const key = b.date || "Unknown";
    map[key] = (map[key] || 0) + Number(b.total || b.amount || 0);
    return map;
  }, {});

  return (
    <div>
      <h3>Dashboard</h3>
      <div className="row g-3 my-3">
        <div className="col-sm-6 col-md-3">
          <div className="card card-spa p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-1">Daily Income</h6>
                <h4 className="m-0">{currency(totals.day)}</h4>
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
                <h4 className="m-0">{currency(totals.week)}</h4>
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
                <h4 className="m-0">{currency(totals.month)}</h4>
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
                <h4 className="m-0">{currency(totals.year)}</h4>
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
              </tr>
            </thead>
            <tbody>
              {Object.keys(dayWise).length === 0 && (
                <tr>
                  <td colSpan={2}>No data</td>
                </tr>
              )}
              {Object.entries(dayWise).map(([d, amt]) => (
                <tr key={d}>
                  <td>{d}</td>
                  <td>{currency(amt)}</td>
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
