// pomodoroSlice.tsx
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PomodoroState {
    pomodoroDuration: number;
    remainingTime: number;
    isRunning: boolean;
    colorIndex: number;
    cycleCount: number;
    currentSegmentDescription: string;
    currentSegmentStart: string;
    elapsedTime: number;
    maxDuration: number; // 최대 시간 (3600초 = 1시간)
}

const initialState: PomodoroState = {
    pomodoroDuration: 1800,
    remainingTime: 1800,
    maxDuration: 3600, // 1시간을 초 단위로
    isRunning: false,
    colorIndex: 0,
    cycleCount: 0,
    currentSegmentDescription: "",
    currentSegmentStart: new Date().toISOString(),
    elapsedTime: 0,
};

const pomodoroSlice = createSlice({
    name: 'pomodoro',
    initialState,
    reducers: {
        setRunning: (state, action: PayloadAction<boolean>) => {
            state.isRunning = action.payload;
            if (action.payload) {
                state.currentSegmentStart = new Date().toISOString();
            }
        },
        setRemainingTime: (state, action: PayloadAction<number>) => {
            state.remainingTime = Math.max(0, action.payload);
        },
        setPomodoroDuration: (state, action: PayloadAction<number>) => {
            const newDuration = Math.max(60, Math.min(action.payload, state.maxDuration));
            state.pomodoroDuration = newDuration;
            state.remainingTime = newDuration;
        },
        incrementColorIndex: (state) => {
            state.colorIndex = (state.colorIndex + 1) % 7;
        },
        incrementCycleCount: (state) => {
            state.cycleCount += 1;
        },
        resetAll: (state) => {
            state.pomodoroDuration = 1800;
            state.remainingTime = 1800;
            state.isRunning = false;
            state.colorIndex = 0;
            state.cycleCount = 0;
            state.elapsedTime = 0;
            state.currentSegmentDescription = "기본 집중 내용";
            state.currentSegmentStart = new Date().toISOString();
        },
        resetJustTimer: (state) => {
            state.remainingTime = state.pomodoroDuration;
            state.elapsedTime = 0;
            state.isRunning = false;
            state.currentSegmentDescription = "기본 집중 내용";
            state.currentSegmentStart = new Date().toISOString();
        },
        tick: (state) => {
            if (state.isRunning && state.remainingTime > 0) {
                state.elapsedTime += 1;
                state.remainingTime = state.pomodoroDuration - state.elapsedTime;
            }
        },
        setCurrentSegmentDescription: (state, action: PayloadAction<string>) => {
            state.currentSegmentDescription = action.payload;
        },
        setElapsedTime: (state, action: PayloadAction<number>) => {
            state.elapsedTime = action.payload;
        }
    }
});

export const {
    setRunning,
    setRemainingTime,
    setPomodoroDuration,
    incrementColorIndex,
    incrementCycleCount,
    resetAll,
    resetJustTimer,
    tick,
    setElapsedTime,
    setCurrentSegmentDescription
} = pomodoroSlice.actions;

export default pomodoroSlice.reducer;
