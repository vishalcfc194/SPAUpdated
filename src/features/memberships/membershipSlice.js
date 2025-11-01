import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { toast } from "react-toastify";

export const fetchMemberships = createAsyncThunk(
  "memberships/fetchAll",
  async () => {
    const resp = await api.get("/memberships");
    return resp.data;
  }
);

export const createMembership = createAsyncThunk(
  "memberships/create",
  async (payload) => {
    const resp = await api.post("/memberships", payload);
    return resp.data;
  }
);

export const updateMembership = createAsyncThunk(
  "memberships/update",
  async ({ id, data }) => {
    const resp = await api.put(`/memberships/${id}`, data);
    return resp.data;
  }
);

export const deleteMembership = createAsyncThunk(
  "memberships/delete",
  async (id) => {
    const resp = await api.delete(`/memberships/${id}`);
    return { id, data: resp.data };
  }
);

const membershipSlice = createSlice({
  name: "memberships",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMemberships.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchMemberships.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMemberships.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createMembership.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Membership created");
      })
      .addCase(createMembership.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to create membership");
      })
      .addCase(updateMembership.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (m) => m._id === action.payload._id || m.id === action.payload.id
        );
        if (idx >= 0) state.items[idx] = action.payload;
        toast.success("Membership updated");
      })
      .addCase(updateMembership.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to update membership");
      })
      .addCase(deleteMembership.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (m) => m._id !== action.payload.id && m.id !== action.payload.id
        );
        toast.success("Membership deleted");
      })
      .addCase(deleteMembership.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to delete membership");
      });
  },
});

export default membershipSlice.reducer;
