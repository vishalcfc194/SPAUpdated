import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async (itemType) => {
    const qs = itemType ? `?itemType=${encodeURIComponent(itemType)}` : "";
    const resp = await api.get(`/dashboard/summary${qs}`);
    return resp.data;
  }
);

export const fetchDaily = createAsyncThunk(
  "dashboard/fetchDaily",
  async ({ days = 30, itemType } = {}) => {
    const qs =
      `days=${days}` +
      (itemType ? `&itemType=${encodeURIComponent(itemType)}` : "");
    const resp = await api.get(`/dashboard/daily?${qs}`);
    return resp.data;
  }
);

export const fetchOverview = createAsyncThunk(
  "dashboard/fetchOverview",
  async ({ days = 7, itemType } = {}) => {
    const qs =
      `days=${days}` +
      (itemType ? `&itemType=${encodeURIComponent(itemType)}` : "");
    const resp = await api.get(`/dashboard/overview?${qs}`);
    return resp.data;
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState: {
    summary: { day: 0, week: 0, month: 0, year: 0 },
    daily: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchDaily.fulfilled, (state, action) => {
        state.daily = action.payload;
      });
    builder
      .addCase(fetchOverview.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.overview = action.payload;
        // Support two response shapes:
        // 1) { list: [...], summaries: {...} } (existing)
        // 2) { success: true, todayIncome, weeklyIncome, monthlyIncome, yearlyIncome, dailyIncome: [...] }
        if (action.payload && action.payload.summaries) {
          const s = action.payload.summaries || {};
          state.summary = {
            day: (s.daily && s.daily.total) || 0,
            week: (s.weekly && s.weekly.total) || 0,
            month: (s.monthly && s.monthly.total) || 0,
            year: (s.yearly && s.yearly.total) || 0,
          };

          // Normalize `overview.list` into `daily`
          state.daily = (action.payload.list || []).map((it) => ({
            date: it.iso || it.date,
            income: it.income || 0,
          }));

          // membership sales data (if provided by API)
          state.overview = state.overview || {};
          state.overview.membershipSales = action.payload.membershipSales || [];
          state.overview.mostSelling = action.payload.mostSelling || null;
          state.overview.leastSelling = action.payload.leastSelling || null;
        } else if (action.payload && action.payload.success) {
          const p = action.payload;
          state.summary = {
            day: p.todayIncome || 0,
            week: p.weeklyIncome || 0,
            month: p.monthlyIncome || 0,
            year: p.yearlyIncome || 0,
          };

          // Build normalized list from dailyIncome
          const list = (p.dailyIncome || []).map((it) => {
            const iso = it.date; // expected YYYY-MM-DD
            const d = new Date(iso);
            const dayShort = isNaN(d.getTime())
              ? it.date
              : d.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                });
            return {
              iso,
              date: dayShort,
              income: it.income || 0,
              day:
                it.day ||
                (isNaN(d.getTime())
                  ? ""
                  : d.toLocaleDateString("en-GB", { weekday: "long" })),
            };
          });

          // keep overview.list compatible for Dashboard page
          state.overview.list = list;
          state.daily = list.map((it) => ({ date: it.iso, income: it.income }));

          // membership sales data from API
          state.overview.membershipSales = p.membershipSales || [];
          state.overview.mostSelling = p.mostSelling || null;
          state.overview.leastSelling = p.leastSelling || null;
        } else {
          // Fallback: clear values
          state.summary = { day: 0, week: 0, month: 0, year: 0 };
          state.daily = [];
        }
      })
      .addCase(fetchOverview.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      });
  },
});

export default dashboardSlice.reducer;
