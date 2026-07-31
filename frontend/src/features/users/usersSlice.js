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
    // { user, tempPassword? } — tempPassword is only present for a
    // Manager-created User (Admin sets the Manager's password themselves).
    return unwrap(await api.post('/users', payload));
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

/** Permanently removes the Cognito account as well as the profile — irreversible. */
export const deleteUser = createAsyncThunk('users/delete', async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/users/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState: { list: [], managers: [], status: 'idle', createStatus: 'idle', error: null, lastCreated: null },
  reducers: {
    resetCreate(state) {
      state.createStatus = 'idle';
      state.error = null;
      state.lastCreated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (s) => { s.status = 'loading'; })
      .addCase(fetchUsers.fulfilled, (s, a) => { s.status = 'succeeded'; s.list = a.payload; })
      .addCase(fetchUsers.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchManagers.fulfilled, (s, a) => { s.managers = a.payload; })
      .addCase(createUser.pending, (s) => { s.createStatus = 'loading'; s.error = null; })
      .addCase(createUser.fulfilled, (s, a) => {
        s.createStatus = 'succeeded';
        s.list.push(a.payload.user);
        s.lastCreated = a.payload; // { user, tempPassword? } — shown once so it can be shared
      })
      .addCase(createUser.rejected, (s, a) => { s.createStatus = 'failed'; s.error = a.payload; })
      .addCase(updateUser.fulfilled, (s, a) => {
        const i = s.list.findIndex((u) => u.id === a.payload.id);
        if (i !== -1) s.list[i] = a.payload;
      })
      .addCase(deleteUser.fulfilled, (s, a) => {
        s.list = s.list.filter((u) => u.id !== a.payload);
      });
  },
});

export const { resetCreate } = usersSlice.actions;
export default usersSlice.reducer;
