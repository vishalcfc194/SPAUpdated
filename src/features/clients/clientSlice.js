import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { toast } from "react-toastify";

export const fetchClients = createAsyncThunk("clients/fetchAll", async () => {
  const resp = await api.get("/clients");
  return resp.data;
});

export const createClient = createAsyncThunk(
  "clients/create",
  async (payload) => {
    const resp = await api.post("/clients", payload);
    return resp.data;
  }
);

export const updateClient = createAsyncThunk(
  "clients/update",
  async ({ id, data }) => {
    const resp = await api.put(`/clients/${id}`, data);
    return resp.data;
  }
);

export const deleteClient = createAsyncThunk("clients/delete", async (id) => {
  const resp = await api.delete(`/clients/${id}`);
  return { id, data: resp.data };
});

const clientSlice = createSlice({
  name: "clients",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClients.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClients.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createClient.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Client created");
      })
      .addCase(createClient.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to create client");
      });
    builder
      .addCase(updateClient.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (c) => c._id === action.payload._id || c.id === action.payload.id
        );
        if (idx >= 0) state.items[idx] = action.payload;
        toast.success("Client updated");
      })
      .addCase(updateClient.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to update client");
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (c) => c._id !== action.payload.id && c.id !== action.payload.id
        );
        toast.success("Client deleted");
      })
      .addCase(deleteClient.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to delete client");
      });
  },
});

export default clientSlice.reducer;
