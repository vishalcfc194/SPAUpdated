import React from "react";

/**
 * Reusable table controls component
 * Shows: pages select box (left), refresh icon button (center), search input (right)
 * Positioned inside table header for compact, attractive layout
 */
const TableControls = ({
  searchTerm = "",
  onSearchChange = () => {},
  onRefresh = () => {},
  onRefreshLoading = false,
  currentPage = 1,
  onPageChange = () => {},
  totalPages = 1,
  totalItems = 0,
}) => {
  return (
    <div
      className="d-flex justify-content-between align-items-center gap-3"
      style={{ flexWrap: "wrap" }}
    >
      {/* Pages Select Box (Left) */}
      <div style={{ minWidth: "180px" }}>
        <select
          className="form-select form-select-sm"
          value={currentPage}
          onChange={(e) => onPageChange(Number(e.target.value))}
          disabled={totalPages <= 1}
        >
          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Page {i + 1} of {Math.max(1, totalPages)}
            </option>
          ))}
        </select>
      </div>

      {/* Refresh Button (Center) - Green round background */}
      <div>
        <button
          className="btn"
          onClick={onRefresh}
          title="Refresh data"
          disabled={onRefreshLoading}
          style={{
            // keep icon fully opaque by not using parent `opacity`
            backgroundColor: onRefreshLoading ? "#6bb08a" : "#7fbf9e",
            color: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: onRefreshLoading ? "not-allowed" : "pointer",
          }}
        >
          {onRefreshLoading ? (
            <span className="spinner-border spinner-border-sm text-white" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-arrow-repeat"
              viewBox="0 0 16 16"
            >
              <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
              <path
                fill-rule="evenodd"
                d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Search Input (Right) */}
      <div style={{ flex: 1, minWidth: "25px" }}>
        <div className="d-flex gap-2 align-items-center ms-5">
          <small
            className="text-muted text-nowrap"
            style={{ fontSize: "12px" }}
          >
            {totalItems} items
          </small>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default TableControls;
