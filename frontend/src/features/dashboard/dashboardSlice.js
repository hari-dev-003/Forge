import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchSummary = createAsyncThunk('dashboard/summary', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/dashboard/summary'));
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: { summary: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchSummary.fulfilled, (s, a) => { s.status = 'succeeded'; s.summary = a.payload; })
      .addCase(fetchSummary.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; });
  },
});

export default dashboardSlice.reducer;
