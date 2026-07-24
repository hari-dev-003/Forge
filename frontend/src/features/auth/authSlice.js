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

// Public self-signup — always provisions an Employee account pending admin approval.
export const signup = createAsyncThunk('auth/signup', async (dto, { rejectWithValue }) => {
  try {
    return unwrap(await api.post('/auth/signup', dto));
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
  signupStatus: 'idle',
  signupMessage: null,
  signupError: null,
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
    clearSignup(state) {
      state.signupStatus = 'idle';
      state.signupMessage = null;
      state.signupError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.status = 'succeeded'; s.user = a.payload.user; s.token = a.payload.token; })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(fetchMe.pending, (s) => { s.bootstrapping = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.bootstrapping = false; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.token = null; s.bootstrapping = false; })
      .addCase(signup.pending, (s) => { s.signupStatus = 'loading'; s.signupError = null; })
      .addCase(signup.fulfilled, (s, a) => { s.signupStatus = 'succeeded'; s.signupMessage = a.payload.message; })
      .addCase(signup.rejected, (s, a) => { s.signupStatus = 'failed'; s.signupError = a.payload; });
  },
});

export const { logout, clearError, clearSignup } = authSlice.actions;
export default authSlice.reducer;
