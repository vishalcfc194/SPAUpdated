import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";
import { toast } from "react-toastify";

export const fetchClientMembershipServices = createAsyncThunk(
  "clientMembershipServices/fetchAll",
  async () => {
    const resp = await api.get("/client-membership-services");
    return resp.data;
  }
);

export const createClientMembershipService = createAsyncThunk(
  "clientMembershipServices/create",
  async (payload) => {
    const resp = await api.post("/client-membership-services", payload);
    return resp.data;
  }
);

export const updateClientMembershipService = createAsyncThunk(
  "clientMembershipServices/update",
  async ({ id, data }) => {
    const resp = await api.put(`/client-membership-services/${id}`, data);
    return resp.data;
  }
);

export const deleteClientMembershipService = createAsyncThunk(
  "clientMembershipServices/delete",
  async (id) => {
    const resp = await api.delete(`/client-membership-services/${id}`);
    return { id, data: resp.data };
  }
);

const clientMembershipServiceSlice = createSlice({
  name: "clientMembershipServices",
  initialState: { items: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientMembershipServices.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchClientMembershipServices.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchClientMembershipServices.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(createClientMembershipService.fulfilled, (state, action) => {
        state.items.push(action.payload);
        toast.success("Service logged");
      })
      .addCase(updateClientMembershipService.fulfilled, (state, action) => {
        const idx = state.items.findIndex(
          (it) =>
            (it._id || it.id) === (action.payload._id || action.payload.id)
        );
        if (idx >= 0) {
          state.items[idx] = action.payload;
          toast.success("Service updated");
        }
      })
      .addCase(deleteClientMembershipService.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (it) => (it._id || it.id) !== action.payload.id
        );
        toast.success("Service deleted");
      });
  },
});

export default clientMembershipServiceSlice.reducer;
