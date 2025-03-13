import { configureStore } from '@reduxjs/toolkit';
import activityReducer from './activitySlice';
import pomodoroReducer from './pomodoroSlice';
import todoReducer from './todoSlice';

const store = configureStore({
    reducer: {
        activity: activityReducer,
        pomodoro: pomodoroReducer,
        todos: todoReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export { store };
