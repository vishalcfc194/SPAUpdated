import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchSummary = createAsyncThunk(
  "dashboard/fetchSummary",
  async () => {
    const resp = await api.get("/dashboard/summary");
    return resp.data;
  }
);

export const fetchDaily = createAsyncThunk(
  "dashboard/fetchDaily",
  async (days = 30) => {
    const resp = await api.get(`/dashboard/daily?days=${days}`);
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
  },
});

export default dashboardSlice.reducer;
