// pomodoroSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {state} from "sucrase/dist/types/parser/traverser/base";

interface PomodoroState {
    pomodoroDuration: number;
    remainingTime: number;
    isRunning: boolean;
    colorIndex: number;
    cycleCount: number;
    currentSegmentDescription: string;
    currentSegmentStart: string;
    elapsedTime: number;
}

const initialState: PomodoroState = {
    pomodoroDuration: 1800,
    remainingTime: 1800,
    isRunning: false,
    colorIndex: 0,
    cycleCount: 0,
    currentSegmentDescription: "기본 집중 내용",
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
            const newDuration = Math.max(60, action.payload);
            state.pomodoroDuration = newDuration;
            state.remainingTime = state.pomodoroDuration - state.elapsedTime;
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
