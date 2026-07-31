import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

/** All-submissions browse view for managers/admins — role-scoping happens server-side. */
export const fetchSubmissions = createAsyncThunk(
  'submissions/list',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      return unwrap(await api.get('/meetings', { params }));
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

/**
 * One submission, for the detail page.
 *
 * Fetched by id rather than read out of `items`, so the page works on a direct
 * link or a refresh — where the list was never loaded. Access is scoped
 * server-side (a manager only sees their own team's).
 */
export const fetchSubmission = createAsyncThunk(
  'submissions/get',
  async (id, { rejectWithValue }) => {
    try {
      return unwrap(await api.get(`/meetings/${id}`)).meeting;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: { items: [], current: null, status: 'idle', currentStatus: 'idle', error: null },
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.currentStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchSubmissions.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
      .addCase(fetchSubmissions.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchSubmission.pending, (s) => { s.currentStatus = 'loading'; s.error = null; })
      .addCase(fetchSubmission.fulfilled, (s, a) => { s.currentStatus = 'succeeded'; s.current = a.payload; })
      .addCase(fetchSubmission.rejected, (s, a) => { s.currentStatus = 'failed'; s.error = a.payload; });
  },
});

export const { clearCurrent } = submissionsSlice.actions;
export default submissionsSlice.reducer;
