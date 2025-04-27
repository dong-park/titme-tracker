// activitySlice.ts
import {createSlice, PayloadAction, createAsyncThunk, AnyAction} from '@reduxjs/toolkit';
import { AppThunk, RootState } from './store';

export interface FocusSegment {
    description: string;
    startDate: string;
    endDate: string;
    elapsedTime: number;
}

export interface Activity {
    index: number;
    time: string;
    tag: string;
    emoji: string;
    description: string;
    elapsedTime: number;
    startDate: string;
    endDate: string;
    focusSegments: FocusSegment[];
    color?: string;
}

export interface TrackingActivity {
    startDate?: string;
    startTime: string;
    description: string;
    emoji: string;
    elapsedTime: number;
    focusSegments: FocusSegment[];
    color?: string;
}

export interface MenuActivity {
    id: number,
    name: string;
    emoji: string;
    pomodoroEnabled?: boolean;
    todoListEnabled?: boolean;
    color?: string;
}

export interface ActivityState {
    menu: MenuActivity[];
    activities: Activity[];
    trackingActivity: TrackingActivity | null;
    isTracking: boolean;
    elapsedTime: number;
}

// 활동 유형별 기본 색상
const activityColors: Record<string, string> = {
    '📚': '#FFD8B1', // 독서
    '🏃': '#BAFFC9', // 달리기
    '💻': '#A7C7E7', // 코딩
    '🎮': '#C3B1E1', // 게임
    '🍽️': '#FFABAB', // 식사
    '😴': '#D8BFD8', // 수면
};

const initialState: ActivityState = {
    menu: [
        {id: 1, name: '독서', emoji: '📚', color: '#FFD8B1', pomodoroEnabled: true, todoListEnabled: true},
        {id: 2, name: '달리기', emoji: '🏃', color: '#BAFFC9', pomodoroEnabled: true, todoListEnabled: true},
        {id: 3, name: '코딩', emoji: '💻', color: '#A7C7E7', pomodoroEnabled: true, todoListEnabled: true},
        {id: 4, name: '게임', emoji: '🎮', color: '#C3B1E1', pomodoroEnabled: true, todoListEnabled: true},
        {id: 5, name: '식사', emoji: '🍽️', color: '#FFABAB', pomodoroEnabled: true, todoListEnabled: true},
        // ... 더 추가 가능
    ],
    activities: [],
    trackingActivity: null,
    isTracking: false,
    elapsedTime: 0,
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
};

// 비동기 액션: stopTracking을 thunk로 구현
export const stopTrackingAsync = createAsyncThunk<
    { activity: Activity } | null,
    void,
    { state: RootState }
>(
    'activity/stopTrackingAsync',
    async (_, { getState }) => {
        const state = getState();
        
        if (!state.activity.trackingActivity) {
            return null;
        }

        const trackingActivity = state.activity.trackingActivity;
        if (!trackingActivity.startDate) {
            throw new Error("Tracking activity startDate is undefined");
        }

        const finalEndTime = new Date();
        const startTime = new Date(trackingActivity.startDate).getTime();
        const endTime = finalEndTime.getTime();
        const finalElapsed = Math.floor((endTime - startTime) / 1000);

        return {
            activity: {
                index: state.activity.activities.length,
                time: `${trackingActivity.startTime} - ${formatTime(finalEndTime)}`,
                tag: trackingActivity.description || "",
                emoji: trackingActivity.emoji || "",
                description: trackingActivity.description || "",
                elapsedTime: finalElapsed,
                startDate: trackingActivity.startDate,
                endDate: finalEndTime.toISOString(),
                focusSegments: trackingActivity.focusSegments,
                color: trackingActivity.color
            }
        };
    }
);

// 일반 thunk 액션으로 stopTracking을 제공 (최적화된 버전)
export const stopTrackingThunk = (): AppThunk => async (dispatch) => {
    await dispatch(stopTrackingAsync());
};

const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {
        startTracking: (state, action: PayloadAction<{
            startTime: string;
            description: string;
            emoji: string;
            elapsedTime: number;
            color?: string;
            activityId?: number;
            todoId?: string;
        }>) => {
            // 메뉴에서 해당 활동의 색상 찾기
            const menuActivity = state.menu.find(
                item => item.name === action.payload.description && item.emoji === action.payload.emoji
            );
            
            state.trackingActivity = {
                startDate: new Date().toISOString(),
                startTime: action.payload.startTime,
                description: action.payload.description,
                emoji: action.payload.emoji,
                elapsedTime: 0,
                focusSegments: [],
                color: action.payload.color || menuActivity?.color || activityColors[action.payload.emoji]
            };
            state.isTracking = true;
            state.elapsedTime = 0;
        },

        addFocusSegment: (state, action: PayloadAction<{
            description: string;
            startDate: string;
            endDate: string;
            elapsedTime: number;
        }>) => {
            if (state.trackingActivity) {
                state.trackingActivity.focusSegments.push(action.payload);
            }
        },

        // 기존 stopTracking 리듀서는 유지 (하위 호환성을 위해)
        stopTracking: (state) => {
            if (state.trackingActivity) {
                const finalEndTime = new Date();
                const cTrackingActivity = state.trackingActivity;

                if (!cTrackingActivity.startDate) {
                    throw new Error("Tracking activity startDate is undefined");
                }

                const startTime = new Date(cTrackingActivity.startDate).getTime();
                const endTime = finalEndTime.getTime();
                const finalElapsed = Math.floor((endTime - startTime) / 1000);

                const payload: Activity = {
                    index: state.activities.length,
                    time: `${cTrackingActivity.startTime} - ${formatTime(finalEndTime)}`,
                    tag: cTrackingActivity.description || "",
                    emoji: cTrackingActivity.emoji || "",
                    description: cTrackingActivity.description || "",
                    elapsedTime: finalElapsed,
                    startDate: cTrackingActivity.startDate,
                    endDate: finalEndTime.toISOString(),
                    focusSegments: cTrackingActivity.focusSegments,
                    color: cTrackingActivity.color
                };

                state.activities.unshift(payload);
            }

            state.isTracking = false;
            state.trackingActivity = null;
            state.elapsedTime = 0;
        },

        setElapsedTime: (state, action: PayloadAction<number>) => {
            if (state.trackingActivity) state.trackingActivity.elapsedTime = action.payload;
        },

        // Add this to the reducers object in activitySlice
        addMenuActivity: (state, action: PayloadAction<{
            name: string;
            emoji: string;
            pomodoroEnabled?: boolean;
            todoListEnabled?: boolean;
            color?: string;
        }>) => {
            const { name, emoji, pomodoroEnabled, todoListEnabled, color } = action.payload;
            // Find the highest ID to ensure unique IDs
            const maxId = state.menu.reduce((max, item) => Math.max(max, item.id), 0);
            // Add new menu activity with a new ID
            state.menu.push({
                id: maxId + 1,
                name,
                emoji,
                pomodoroEnabled,
                todoListEnabled,
                color: color || activityColors[emoji] || '#A7C7E7' // 기본 색상 설정
            });
        },

        updateMenuActivity: (state, action: PayloadAction<{
            id: number;
            name: string;
            emoji: string;
            pomodoroEnabled?: boolean;
            todoListEnabled?: boolean;
            color?: string;
        }>) => {
            const { id, name, emoji, pomodoroEnabled, todoListEnabled, color } = action.payload;
            const menuIndex = state.menu.findIndex(item => item.id === id);
            if (menuIndex !== -1) {
                state.menu[menuIndex] = {
                    ...state.menu[menuIndex],
                    name,
                    emoji,
                    pomodoroEnabled,
                    todoListEnabled,
                    color: color || state.menu[menuIndex].color || activityColors[emoji]
                };
            }
        },

        // activitySlice.tsx의 reducers 객체 내에 추가
        removeMenuActivity: (state, action: PayloadAction<number>) => {
            const idToRemove = action.payload;
            state.menu = state.menu.filter(item => item.id !== idToRemove);
        },

        // 새 액션: 활동 전환을 위한 액션 (트래킹 중간 상태 없이 전환)
        switchActivity: (state, action: PayloadAction<{
            startTime: string;
            description: string;
            emoji: string;
            color?: string;
        }>) => {
            // 현재 트래킹 중인 활동이 있는 경우 기록에 추가
            if (state.trackingActivity) {
                const finalEndTime = new Date();
                const cTrackingActivity = state.trackingActivity;

                if (cTrackingActivity.startDate) {
                    const startTime = new Date(cTrackingActivity.startDate).getTime();
                    const endTime = finalEndTime.getTime();
                    const finalElapsed = Math.floor((endTime - startTime) / 1000);

                    const payload: Activity = {
                        index: state.activities.length,
                        time: `${cTrackingActivity.startTime} - ${formatTime(finalEndTime)}`,
                        tag: cTrackingActivity.description || "",
                        emoji: cTrackingActivity.emoji || "",
                        description: cTrackingActivity.description || "",
                        elapsedTime: finalElapsed,
                        startDate: cTrackingActivity.startDate,
                        endDate: finalEndTime.toISOString(),
                        focusSegments: cTrackingActivity.focusSegments,
                        color: cTrackingActivity.color
                    };

                    state.activities.unshift(payload);
                }
            }

            // 메뉴에서 해당 활동의 색상 찾기
            const menuActivity = state.menu.find(
                item => item.name === action.payload.description && item.emoji === action.payload.emoji
            );

            // 시간 정확히 지금으로 설정 (밀리초 단위까지 정확하게)
            const now = new Date();
            
            // 새 활동으로 바로 전환 (중간 상태 없이)
            state.trackingActivity = {
                startDate: now.toISOString(), // 밀리초 단위까지 정확한 시간 사용
                startTime: action.payload.startTime,
                description: action.payload.description,
                emoji: action.payload.emoji,
                elapsedTime: 0, // 명확한 초기화
                focusSegments: [],
                color: action.payload.color || menuActivity?.color || activityColors[action.payload.emoji]
            };
            
            // 전역 타이머 상태도 확실하게 초기화
            state.isTracking = true;
            state.elapsedTime = 0;
        },

    },
    extraReducers: (builder) => {
        builder
            .addCase(stopTrackingAsync.fulfilled, (state, action) => {
                if (action.payload) {
                    state.activities.unshift(action.payload.activity);
                }
                state.isTracking = false;
                state.trackingActivity = null;
                state.elapsedTime = 0;
            });
    }
});

export const {
    startTracking,
    stopTracking,
    addFocusSegment,
    setElapsedTime,
    updateMenuActivity,
    addMenuActivity,
    removeMenuActivity,
    switchActivity
} = activitySlice.actions;
export default activitySlice.reducer;
