import { createSlice, nanoid } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    pushToast: {
      reducer(state, action) {
        state.toasts.push(action.payload);
      },
      prepare({ message, type = 'info' }) {
        return { payload: { id: nanoid(), message, type } };
      },
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = uiSlice.actions;
export default uiSlice.reducer;
