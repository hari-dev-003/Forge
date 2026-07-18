import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchBoard = createAsyncThunk(
  'leaderboard/board',
  async (scope = 'ALLTIME', { rejectWithValue }) => {
    try {
      return { scope, rows: unwrap(await api.get('/leaderboard', { params: { scope } })) };
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const fetchMyStanding = createAsyncThunk('leaderboard/me', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/leaderboard/me'));
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState: { board: [], scope: 'ALLTIME', me: null, status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBoard.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchBoard.fulfilled, (s, a) => { s.status = 'succeeded'; s.board = a.payload.rows; s.scope = a.payload.scope; })
      .addCase(fetchBoard.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchMyStanding.fulfilled, (s, a) => { s.me = a.payload; });
  },
});

export default leaderboardSlice.reducer;
