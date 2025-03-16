import { configureStore } from '@reduxjs/toolkit';
import todoReducer from './todoSlice';
import activityReducer from './activitySlice';
import pomodoroReducer from './pomodoroSlice';

export const store = configureStore({
  reducer: {
    todos: todoReducer,
    activity: activityReducer,
    pomodoro: pomodoroReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 