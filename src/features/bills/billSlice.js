import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { toast } from "react-toastify";

export const fetchBills = createAsyncThunk("bills/fetchAll", async () => {
  const resp = await api.get("/bills");
  return resp.data;
});

export const createBill = createAsyncThunk("bills/create", async (payload) => {
  const resp = await api.post("/bills", payload);
  return resp.data;
});

export const updateBill = createAsyncThunk(
  "bills/update",
  async ({ id, data }) => {
    const resp = await api.put(`/bills/${id}`, data);
    return resp.data;
  }
);

export const deleteBill = createAsyncThunk("bills/delete", async (id) => {
  const resp = await api.delete(`/bills/${id}`);
  return { id, data: resp.data };
});

const billSlice = createSlice({
  name: "bills",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createBill.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Bill created");
      })
      .addCase(updateBill.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (b) => b._id === action.payload._id || b.id === action.payload.id
        );
        if (idx >= 0) state.items[idx] = action.payload;
        toast.success("Bill updated");
      })
      .addCase(deleteBill.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (b) => b._id !== action.payload.id && b.id !== action.payload.id
        );
        toast.success("Bill deleted");
      })
      .addCase(createBill.rejected, (state, action) => {
        toast.error(action.error.message || "Failed to create bill");
      });
  },
});

export default billSlice.reducer;
