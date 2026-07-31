import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchAnnouncements = createAsyncThunk(
  'announcements/list',
  async (filters = {}, { rejectWithValue }) => {
    try {
      return unwrap(await api.get('/announcements', { params: filters }));
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const fetchManagedAnnouncements = createAsyncThunk(
  'announcements/listManaged',
  async (_, { rejectWithValue }) => {
    try {
      return unwrap(await api.get('/announcements', { params: { view: 'manage' } }));
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const fetchAnnouncement = createAsyncThunk(
  'announcements/get',
  async (id, { rejectWithValue }) => {
    try {
      const announcement = unwrap(await api.get(`/announcements/${id}`)).announcement;
      const related = await api
        .get(`/announcements/${id}/related`, { params: { category: announcement.category } })
        .then((r) => unwrap(r))
        .catch(() => []);
      return { announcement, related };
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const createAnnouncement = createAsyncThunk(
  'announcements/create',
  async (payload, { rejectWithValue }) => {
    try {
      return unwrap(await api.post('/announcements', payload)).announcement;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const updateAnnouncement = createAsyncThunk(
  'announcements/update',
  async ({ id, patch }, { rejectWithValue }) => {
    try {
      return unwrap(await api.patch(`/announcements/${id}`, patch)).announcement;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const deleteAnnouncement = createAsyncThunk(
  'announcements/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/announcements/${id}`);
      return id;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

export const markAnnouncementRead = createAsyncThunk(
  'announcements/markRead',
  async (id, { rejectWithValue }) => {
    try {
      await api.post(`/announcements/${id}/read`);
      return id;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

const announcementsSlice = createSlice({
  name: 'announcements',
  initialState: {
    list: [],
    managed: [],
    current: null,
    related: [],
    status: 'idle',
    managedStatus: 'idle',
    detailStatus: 'idle',
    createStatus: 'idle',
    error: null,
  },
  reducers: {
    resetCreate(state) {
      state.createStatus = 'idle';
      state.error = null;
    },
    clearCurrent(state) {
      state.current = null;
      state.related = [];
      state.detailStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnnouncements.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchAnnouncements.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload; })
      .addCase(fetchAnnouncements.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchManagedAnnouncements.pending, (s) => { s.managedStatus = 'loading'; })
      .addCase(fetchManagedAnnouncements.fulfilled, (s, a) => { s.managedStatus = 'succeeded'; s.managed = a.payload; })
      .addCase(fetchManagedAnnouncements.rejected, (s, a) => { s.managedStatus = 'failed'; s.error = a.payload; })
      .addCase(fetchAnnouncement.pending, (s) => { s.detailStatus = 'loading'; })
      .addCase(fetchAnnouncement.fulfilled, (s, a) => {
        s.detailStatus = 'succeeded';
        s.current = a.payload.announcement;
        s.related = a.payload.related;
      })
      .addCase(fetchAnnouncement.rejected, (s, a) => { s.detailStatus = 'failed'; s.error = a.payload; })
      .addCase(createAnnouncement.pending, (s) => { s.createStatus = 'loading'; s.error = null; })
      .addCase(createAnnouncement.fulfilled, (s, a) => { s.createStatus = 'succeeded'; s.managed.unshift(a.payload); })
      .addCase(createAnnouncement.rejected, (s, a) => { s.createStatus = 'failed'; s.error = a.payload; })
      .addCase(updateAnnouncement.fulfilled, (s, a) => {
        const i = s.managed.findIndex((x) => x.id === a.payload.id);
        if (i !== -1) s.managed[i] = a.payload;
        if (s.current?.id === a.payload.id) s.current = { ...s.current, ...a.payload };
      })
      .addCase(deleteAnnouncement.fulfilled, (s, a) => {
        s.managed = s.managed.filter((x) => x.id !== a.payload);
      })
      .addCase(markAnnouncementRead.fulfilled, (s, a) => {
        if (s.current?.id === a.payload) s.current.hasRead = true;
      });
  },
});

export const { resetCreate, clearCurrent } = announcementsSlice.actions;
export default announcementsSlice.reducer;
