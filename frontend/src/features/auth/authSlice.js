import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, unwrap, apiError } from '../../api/client.js';
import { TOKEN_KEY } from '../../constants.js';

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const data = unwrap(await api.post('/auth/login', creds));
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  } catch (e) {
    return rejectWithValue(apiError(e));
  }
});

// Finishes a first login that started with a temporary password (a
// Manager-created User's account) — completes Cognito's NEW_PASSWORD_REQUIRED
// challenge and returns the same { user, token } shape as a normal login.
export const completeNewPassword = createAsyncThunk(
  'auth/completeNewPassword',
  async (dto, { rejectWithValue }) => {
    try {
      const data = unwrap(await api.post('/auth/complete-new-password', dto));
      localStorage.setItem(TOKEN_KEY, data.token);
      return data;
    } catch (e) {
      return rejectWithValue(apiError(e));
    }
  }
);

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
  // Set when login() returns a NEW_PASSWORD_REQUIRED challenge instead of a token.
  challenge: null, // { email, session }
  challengeStatus: 'idle',
  challengeError: null,
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
    clearChallenge(state) {
      state.challenge = null;
      state.challengeStatus = 'idle';
      state.challengeError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.status = 'loading'; s.error = null; })
      .addCase(login.fulfilled, (s, a) => {
        s.status = 'succeeded';
        if (a.payload.challenge) {
          s.challenge = { email: a.payload.email, session: a.payload.session };
        } else {
          s.user = a.payload.user;
          s.token = a.payload.token;
        }
      })
      .addCase(login.rejected, (s, a) => { s.status = 'failed'; s.error = a.payload; })
      .addCase(completeNewPassword.pending, (s) => { s.challengeStatus = 'loading'; s.challengeError = null; })
      .addCase(completeNewPassword.fulfilled, (s, a) => {
        s.challengeStatus = 'succeeded';
        s.challenge = null;
        s.user = a.payload.user;
        s.token = a.payload.token;
      })
      .addCase(completeNewPassword.rejected, (s, a) => { s.challengeStatus = 'failed'; s.challengeError = a.payload; })
      .addCase(fetchMe.pending, (s) => { s.bootstrapping = true; })
      .addCase(fetchMe.fulfilled, (s, a) => { s.user = a.payload; s.bootstrapping = false; })
      .addCase(fetchMe.rejected, (s) => { s.user = null; s.token = null; s.bootstrapping = false; });
  },
});

export const { logout, clearError, clearChallenge } = authSlice.actions;
export default authSlice.reducer;
