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

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubmissions.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchSubmissions.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
      .addCase(fetchSubmissions.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; });
  },
});

export default submissionsSlice.reducer;
