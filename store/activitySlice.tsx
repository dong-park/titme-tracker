// activitySlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit';

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
}

export interface TrackingActivity {
    startDate?: string;
    startTime: string;
    description: string;
    emoji: string;
    elapsedTime: number;
    focusSegments: FocusSegment[];
}

export interface MenuActivity {
    id: number,
    name: string;
    emoji: string;
}

export interface ActivityState {
    menu: MenuActivity[];
    activities: Activity[];
    trackingActivity: TrackingActivity | null;
    isTracking: boolean;
    elapsedTime: number;
}

const initialState: ActivityState = {
    menu: [
        {id: 1, name: '독서', emoji: '📚'},
        {id: 2, name: '달리기', emoji: '🏃'},
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

const activitySlice = createSlice({
    name: 'activity',
    initialState,
    reducers: {
        startTracking: (state, action: PayloadAction<{
            startTime: string;
            description: string;
            emoji: string;
            elapsedTime: number
        }>) => {
            state.trackingActivity = {
                startDate: new Date().toISOString(),
                startTime: action.payload.startTime,
                description: action.payload.description,
                emoji: action.payload.emoji,
                elapsedTime: 0,
                focusSegments: []
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

        stopTracking: (state) => {
            if (state.trackingActivity) {
                const finalEndTime = new Date();
                const cTrackingActivity = state.trackingActivity;

                const finalElapsed = cTrackingActivity.elapsedTime;
                console.log(cTrackingActivity);

                const payload: Activity = {
                    index: state.activities.length,
                    time: `${cTrackingActivity.startTime} - ${formatTime(finalEndTime)}`,
                    tag: cTrackingActivity.description || "",
                    emoji: cTrackingActivity.emoji || "",
                    description: cTrackingActivity.description || "",
                    elapsedTime: finalElapsed, // 여기서 finalElapsed(= trackingActivity.elapsedTime) 사용
                    startDate: cTrackingActivity.startDate || new Date().toISOString(),
                    endDate: finalEndTime.toISOString(),
                    focusSegments: cTrackingActivity.focusSegments
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
    },
});

export const {
    startTracking,
    stopTracking,
    addFocusSegment,
    setElapsedTime
} = activitySlice.actions;
export default activitySlice.reducer;
