import { configureStore } from '@reduxjs/toolkit';
import activityReducer from './activitySlice';
import pomodoroReducer from './pomodoroSlice';

const store = configureStore({
    reducer: {
        activity: activityReducer,
        pomodoro: pomodoroReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { store };
