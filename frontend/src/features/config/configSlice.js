import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchPointsRules = createAsyncThunk('config/get', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/config/points')).rules;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

export const savePointsRules = createAsyncThunk('config/save', async (rules, { rejectWithValue }) => {
  try {
    return unwrap(await api.put('/config/points', rules)).rules;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const configSlice = createSlice({
  name: 'config',
  initialState: { rules: null, status: 'idle', saveStatus: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPointsRules.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchPointsRules.fulfilled, (s, a) => { s.status = 'succeeded'; s.rules = a.payload; })
      .addCase(fetchPointsRules.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(savePointsRules.pending, (s) => { s.saveStatus = 'loading'; })
      .addCase(savePointsRules.fulfilled, (s, a) => { s.saveStatus = 'succeeded'; s.rules = a.payload; })
      .addCase(savePointsRules.rejected, (s, a) => { s.saveStatus = 'failed'; s.error = a.payload; });
  },
});

export default configSlice.reducer;
