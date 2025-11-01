import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import servicesReducer from "../features/services/serviceSlice";
import staffReducer from "../features/staff/staffSlice";
import clientsReducer from "../features/clients/clientSlice";
import membershipsReducer from "../features/memberships/membershipSlice";
import billsReducer from "../features/bills/billSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    services: servicesReducer,
    staff: staffReducer,
    clients: clientsReducer,
    memberships: membershipsReducer,
    bills: billsReducer,
  },
});

export default store;
