import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchAuditLog = createAsyncThunk('audit/list', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/audit'));
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const auditSlice = createSlice({
  name: 'audit',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLog.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchAuditLog.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload; })
      .addCase(fetchAuditLog.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; });
  },
});

export default auditSlice.reducer;
