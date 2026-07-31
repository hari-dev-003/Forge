import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { api, unwrap, apiError } from '../../api/client.js';

/**
 * Upload one file straight to storage via a presigned PUT, returning its key.
 *
 * `file.type` is always sent non-empty: an empty content type gets baked into
 * the S3 signature, the browser then sends its own sniffed value, and S3
 * rejects the PUT with 403 SignatureDoesNotMatch.
 */
async function uploadToStorage(file) {
  const contentType = file.type || 'application/octet-stream';
  const target = unwrap(await api.post('/uploads/presign', { contentType, filename: file.name }));
  await axios.put(target.uploadUrl, file, { headers: target.headers });
  return target.key;
}

/**
 * Full submission flow: presign -> upload each photo straight to storage ->
 * create the meeting referencing the returned keys.
 *
 * `photos` is 1–3 GPS-watermarked proof photos (all meeting types).
 * `screenshotFile` is optional (Direct Conversion's second, non-GPS upload).
 * The photos upload in parallel — three sequential round trips on a field
 * connection is a noticeably slower submit.
 */
export const submitMeeting = createAsyncThunk(
  'meetings/submit',
  async ({ form, photos, screenshotFile }, { rejectWithValue }) => {
    try {
      const keys = await Promise.all(photos.map(uploadToStorage));

      let payload = {
        ...form,
        photos: keys.map((key) => ({ key, caption: '' })),
      };

      if (screenshotFile) {
        const screenshotKey = await uploadToStorage(screenshotFile);
        payload = {
          ...payload,
          directConversion: { ...payload.directConversion, screenshot: { key: screenshotKey } },
        };
      }

      const meeting = unwrap(await api.post('/meetings', payload));
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
