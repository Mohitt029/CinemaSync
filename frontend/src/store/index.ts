import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import eventReducer from './slices/event.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;