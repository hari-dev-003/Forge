import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';
import { TOKEN_KEY } from '../../constants.js';

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const data = unwrap(await api.post('/auth/login', creds));
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

// Restore the session on app load using the stored token.
export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    return unwrap(await api.get('/auth/me')).user;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

const initialState = {
  user: null,
  token: localStorage.getItem(TOKEN_KEY) || null,
  status: 'idle',
  bootstrapping: !!localStorage.getItem(TOKEN_KEY),
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem(TOKEN_KEY);
      state.user = null;
      state.token = null;
      state.status = 'idle';
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.status = 'succeeded'; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchMe.pending, (s) => { s.bootstrapping = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.bootstrapping = false; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.token = null; s.bootstrapping = false; });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
