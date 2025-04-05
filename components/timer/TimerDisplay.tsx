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
    timerScale: Animated.Value;
    milestoneScale: Animated.Value;
    description?: string;
    displayedElapsedTime: number;
    formatElapsedTime: (seconds: number) => string;
    isExpanded: boolean;
    setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
    expandAnim: Animated.Value;
    slideAnim: Animated.Value;
    handleStopTracking: () => void;
    togglePomodoroTimer: () => void;
    activityId?: number;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
    emoji,
    milestone,
    timerScale,
    milestoneScale,
    description,
    displayedElapsedTime,
    formatElapsedTime,
    isExpanded,
    setIsExpanded,
    expandAnim,
    slideAnim,
    handleStopTracking,
    togglePomodoroTimer,
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
        <StyledView className="relative">
            {/* 타이머 메뉴바 */}
            <StyledTouchableOpacity
                className="active:opacity-80"
                onPress={navigateToFocusPage}
            >
                <StyledAnimatedView
                    className="flex-row items-center rounded-lg"
                    style={{
                        transform: [{translateY: slideAnim}, {scale: timerScale}],
                        paddingHorizontal: 20,
                        paddingVertical: 6,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 2,
                        backgroundColor: '#4B7BF5',
                    }}
                >
                    <StyledText className="text-lg mr-2">
                        {emoji}
                    </StyledText>
                    <StyledText 
                        className="text-base font-bold text-white" 
                    >
                        {formatTimeForButton(displayedElapsedTime)}
                    </StyledText>
                </StyledAnimatedView>
            </StyledTouchableOpacity>
        </StyledView>
    );
};
