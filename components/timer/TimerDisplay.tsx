// components/timer/TimerDisplay.tsx (수정된 버전)
import { RootState } from "@/store/store";
import { Ionicons } from '@expo/vector-icons';
import { createSelector } from '@reduxjs/toolkit';
import { router } from 'expo-router';
import { styled } from "nativewind";
import React from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledAnimatedView = styled(Animated.View);
const StyledAnimatedText = styled(Animated.Text);

// 메모이제이션된 셀렉터 생성
const selectActivityById = createSelector(
  [(state: RootState) => state.activity.menu, (state: RootState, activityId: number | undefined) => activityId],
  (menu, activityId) => {
    if (!activityId) return null;
    return menu.find(item => item.id === activityId) || null;
  }
);

interface TimerDisplayProps {
    emoji?: string;
    milestone: string;
    stopButtonScale: Animated.Value;
    description?: string;
    displayedElapsedTime: number;
    formatElapsedTime: (seconds: number) => string;
    handleStopTracking: () => void;
    activityId?: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    emoji,
    milestone,
    stopButtonScale,
    description,
    displayedElapsedTime,
    formatElapsedTime,
    handleStopTracking,
    activityId
}) => {
    // 메모이제이션된 셀렉터 사용
    const activity = useSelector(
        (state: RootState) => selectActivityById(state, activityId)
    );

    // 집중 페이지로 이동하는 함수
    const navigateToFocusPage = () => {
        router.push({
            pathname: '/focus',
            params: { initialElapsedTime: displayedElapsedTime }
        });
    };

    // 버튼에 표시할 시간 포맷팅 함수
    const formatTimeForButton = (seconds: number) => {
        if (seconds < 3600) {  // 1시간 미만
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}s`;
        } else {  // 1시간 이상
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}m`;
        }
    };

    return (
        <StyledView className="relative w-full">
            <StyledTouchableOpacity 
                className="active:opacity-80 w-full"
                onPress={navigateToFocusPage}
            >
                <StyledView className="flex-row items-center justify-between bg-[#4B7BF5] px-4 py-2 w-full">
                    {/* 왼쪽: 활동 정보 */}
                    <StyledView className="flex-row items-center flex-1">
                        <StyledText className="text-lg mr-2">
                            {emoji}
                        </StyledText>
                        <StyledText className="text-base font-medium text-white mr-2">
                            {description}
                        </StyledText>
                        <StyledText className="text-base font-bold text-white">
                            {formatTimeForButton(displayedElapsedTime)}
                        </StyledText>
                    </StyledView>

                    {/* 오른쪽: 기능 버튼들 */}
                    <StyledView className="flex-row items-center">
                        <StyledTouchableOpacity 
                            className="p-2 bg-white/20 rounded-full"
                            onPress={(e) => {
                                e.stopPropagation();
                                handleStopTracking();
                            }}
                        >
                            <StyledAnimatedView style={{ transform: [{ scale: stopButtonScale }] }}>
                                <Ionicons name="stop" size={20} color="white" />
                            </StyledAnimatedView>
                        </StyledTouchableOpacity>
                    </StyledView>
                </StyledView>
            </StyledTouchableOpacity>
        </StyledView>
    );
};
