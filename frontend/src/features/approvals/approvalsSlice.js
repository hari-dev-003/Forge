import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchQueue = createAsyncThunk(
  'approvals/queue',
  async (status = 'PENDING', { rejectWithValue }) => {
    try {
      return { status, items: unwrap(await api.get('/approvals/queue', { params: { status } })) };
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const decideMeeting = createAsyncThunk(
  'approvals/decide',
  async ({ id, decision, reason, qualityScore }, { rejectWithValue }) => {
    try {
      return unwrap(await api.post(`/meetings/${id}/decision`, { decision, reason, qualityScore })).meeting;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

const approvalsSlice = createSlice({
  name: 'approvals',
  initialState: { queue: [], status: 'idle', decidingId: null, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQueue.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchQueue.fulfilled, (s, a) => { s.status = 'succeeded'; s.queue = a.payload.items; })
      .addCase(fetchQueue.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(decideMeeting.pending, (s, a) => { s.decidingId = a.meta.arg.id; })
      .addCase(decideMeeting.fulfilled, (s, a) => {
        s.decidingId = null;
        // Remove the reviewed item from the pending queue.
        s.queue = s.queue.filter((m) => m.meetingId !== a.payload.meetingId);
      })
      .addCase(decideMeeting.rejected, (s, a) => { s.decidingId = null; s.error = a.payload; });
  },
});

export default approvalsSlice.reducer;
