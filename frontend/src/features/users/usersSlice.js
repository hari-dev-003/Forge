import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';

export const fetchUsers = createAsyncThunk('users/list', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/users'));
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

export const fetchManagers = createAsyncThunk('users/managers', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/users/managers'));
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

export const createUser = createAsyncThunk('users/create', async (payload, { rejectWithValue }) => {
  try {
    return unwrap(await api.post('/users', payload)).user;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

export const updateUser = createAsyncThunk('users/update', async ({ id, patch }, { rejectWithValue }) => {
  try {
    return unwrap(await api.patch(`/users/${id}`, patch)).user;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState: { list: [], managers: [], status: 'idle', createStatus: 'idle', error: null },
  reducers: {
    resetCreate(state) {
      state.createStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchUsers.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload; })
      .addCase(fetchUsers.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchManagers.fulfilled, (s, a) => { s.managers = a.payload; })
      .addCase(createUser.pending, (s) => { s.createStatus = 'loading'; s.error = null; })
      .addCase(createUser.fulfilled, (s, a) => { s.createStatus = 'succeeded'; s.list.push(a.payload); })
      .addCase(createUser.rejected, (s, a) => { s.createStatus = 'failed'; s.error = a.payload; })
      .addCase(updateUser.fulfilled, (s, a) => {
        const i = s.list.findIndex((u) => u.id === a.payload.id);
        if (i !== -1) s.list[i] = a.payload;
      });
  },
});

export const { resetCreate } = usersSlice.actions;
export default usersSlice.reducer;
