import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { api, unwrap, apiError } from '../../api/client.js';

/**
 * Full submission flow: presign -> upload photo straight to storage (S3/local)
 * -> create the meeting referencing the returned key. Mirrors production.
 */
export const submitMeeting = createAsyncThunk(
  'meetings/submit',
  async ({ form, file }, { rejectWithValue }) => {
    try {
      const target = unwrap(await api.post('/uploads/presign', { contentType: file.type }));
      await axios.put(target.uploadUrl, file, { headers: target.headers });
      const meeting = unwrap(
        await api.post('/meetings', { ...form, photo: { key: target.key, caption: form.photoCaption || '' } })
      );
      return meeting.meeting;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const fetchMyMeetings = createAsyncThunk('meetings/mine', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/meetings/mine'));
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const meetingsSlice = createSlice({
  name: 'meetings',
  initialState: { mine: [], status: 'idle', submitStatus: 'idle', error: null },
  reducers: {
    resetSubmit(state) {
      state.submitStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyMeetings.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchMyMeetings.fulfilled, (s, a) => { s.status = 'succeeded'; s.mine = a.payload; })
      .addCase(fetchMyMeetings.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(submitMeeting.pending, (s) => { s.submitStatus = 'loading'; s.error = null; })
      .addCase(submitMeeting.fulfilled, (s, a) => { s.submitStatus = 'succeeded'; s.mine.unshift(a.payload); })
      .addCase(submitMeeting.rejected, (s, a) => { s.submitStatus = 'failed'; s.error = a.payload; });
  },
});

export const { resetSubmit } = meetingsSlice.actions;
export default meetingsSlice.reducer;
