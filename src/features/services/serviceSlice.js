import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { toast } from "react-toastify";

export const fetchServices = createAsyncThunk("services/fetchAll", async () => {
  const resp = await api.get("/services");
  return resp.data;
});

export const createService = createAsyncThunk(
  "services/create",
  async (payload) => {
    const resp = await api.post("/services", payload);
    return resp.data;
  }
);

export const updateService = createAsyncThunk(
  "services/update",
  async ({ id, data }) => {
    const resp = await api.put(`/services/${id}`, data);
    return resp.data;
  }
);

export const deleteService = createAsyncThunk("services/delete", async (id) => {
  const resp = await api.delete(`/services/${id}`);
  return { id, data: resp.data };
});

const serviceSlice = createSlice({
  name: "services",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Service created");
      })
      .addCase(createService.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to create service");
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (s) => s._id === action.payload._id || s.id === action.payload.id
        );
        if (idx >= 0) state.items[idx] = action.payload;
        toast.success("Service updated");
      })
      .addCase(updateService.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to update service");
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (s) => s._id !== action.payload.id && s.id !== action.payload.id
        );
        toast.success("Service deleted");
      })
      .addCase(deleteService.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to delete service");
      });
  },
});

export default serviceSlice.reducer;
