import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import meetingsReducer from '../features/meetings/meetingsSlice.js';
import approvalsReducer from '../features/approvals/approvalsSlice.js';
import leaderboardReducer from '../features/leaderboard/leaderboardSlice.js';
import dashboardReducer from '../features/dashboard/dashboardSlice.js';
import usersReducer from '../features/users/usersSlice.js';
import configReducer from '../features/config/configSlice.js';
import auditReducer from '../features/audit/auditSlice.js';
import uiReducer from '../features/ui/uiSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    meetings: meetingsReducer,
    approvals: approvalsReducer,
    leaderboard: leaderboardReducer,
    dashboard: dashboardReducer,
    users: usersReducer,
    config: configReducer,
    audit: auditReducer,
    ui: uiReducer,
  },
});

export default store;
