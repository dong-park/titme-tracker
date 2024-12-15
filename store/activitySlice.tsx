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
                const finalEndTime = new Date(); // 현재 시각
                const cTrackingActivity = state.trackingActivity;

                // 시작 시간이 undefined인 경우 처리
                if (!cTrackingActivity.startDate) {
                    throw new Error("Tracking activity startDate is undefined");
                }

                // 시작 시간과 종료 시간의 차이를 초 단위로 계산
                const startTime = new Date(cTrackingActivity.startDate).getTime();
                const endTime = finalEndTime.getTime();
                const finalElapsed = Math.floor((endTime - startTime) / 1000); // 초 단위 경과 시간

                // 최종 Activity 데이터 생성
                const payload: Activity = {
                    index: state.activities.length, // 활동 리스트의 현재 인덱스
                    time: `${cTrackingActivity.startTime} - ${formatTime(finalEndTime)}`, // 시작 및 종료 시간
                    tag: cTrackingActivity.description || "", // 태그 또는 활동 설명
                    emoji: cTrackingActivity.emoji || "", // 활동을 나타내는 이모지
                    description: cTrackingActivity.description || "", // 상세 설명
                    elapsedTime: finalElapsed, // 계산된 경과 시간
                    startDate: cTrackingActivity.startDate, // 시작 날짜
                    endDate: finalEndTime.toISOString(), // 종료 날짜
                    focusSegments: cTrackingActivity.focusSegments, // 기록된 집중 구간들
                };

                // 활동 리스트에 추가
                state.activities.unshift(payload);
            }

            // 상태 초기화
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
