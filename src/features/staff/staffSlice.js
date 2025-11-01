import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { toast } from "react-toastify";

export const fetchStaff = createAsyncThunk("staff/fetchAll", async () => {
  const resp = await api.get("/staff");
  return resp.data;
});

export const createStaff = createAsyncThunk("staff/create", async (payload) => {
  const resp = await api.post("/staff", payload);
  return resp.data;
});

export const updateStaff = createAsyncThunk(
  "staff/update",
  async ({ id, data }) => {
    const resp = await api.put(`/staff/${id}`, data);
    return resp.data;
  }
);

export const deleteStaff = createAsyncThunk("staff/delete", async (id) => {
  const resp = await api.delete(`/staff/${id}`);
  return { id, data: resp.data };
});

const staffSlice = createSlice({
  name: "staff",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStaff.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createStaff.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Staff created");
      })
      .addCase(createStaff.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to create staff");
      });
    builder
      .addCase(updateStaff.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (s) => s._id === action.payload._id || s.id === action.payload.id
        );
        if (idx >= 0) state.items[idx] = action.payload;
        toast.success("Staff updated");
      })
      .addCase(updateStaff.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to update staff");
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (s) => s._id !== action.payload.id && s.id !== action.payload.id
        );
        toast.success("Staff deleted");
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to delete staff");
      });
  },
});

export default staffSlice.reducer;
