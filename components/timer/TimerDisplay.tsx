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
    isMilestoneVisible: boolean;
    milestoneOpacity: Animated.Value;
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
                                                              activityId,
                                                              isMilestoneVisible,
                                                              milestoneOpacity
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
            {/* 말풍선 */}
            {isMilestoneVisible && milestone && (
                <StyledAnimatedView
                    className="bg-[#4B7BF5] rounded-xl px-6 py-3 mb-2"
                    style={{
                        transform: [{translateY: slideAnim}, {scale: timerScale}],
                        position: 'absolute',
                        bottom: 70,
                        right: 0,
                        width: 'auto',
                        minWidth: 200,
                        maxWidth: 400,
                        marginLeft: 24,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 3,
                        zIndex: 1,
                        alignSelf: 'flex-end',
                        opacity: milestoneOpacity
                    }}
                >
                    <StyledAnimatedText
                        className="text-white text-base font-medium"
                        style={{
                            transform: [{scale: timerScale}]
                        }}
                    >
                        {milestone}
                    </StyledAnimatedText>
                    {/* 말풍선 꼬리 */}
                    <StyledView
                        className="absolute bottom-[-6px] right-[28px] w-0 h-0"
                        style={{
                            borderLeftWidth: 6,
                            borderRightWidth: 6,
                            borderTopWidth: 6,
                            borderStyle: 'solid',
                            backgroundColor: 'transparent',
                            borderLeftColor: 'transparent',
                            borderRightColor: 'transparent',
                            borderTopColor: '#4B7BF5'
                        }}
                    />
                </StyledAnimatedView>
            )}

            {/* 타이머 버튼 */}
            <StyledTouchableOpacity
                className="active:opacity-80"
                onPress={navigateToFocusPage}
            >
                <StyledAnimatedView
                    className="rounded-full shadow-lg"
                    style={{
                        transform: [{translateY: slideAnim}, {scale: timerScale}],
                        width: 80,
                        height: 80,
                        padding: 12,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 2,
                        },
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 3,
                        borderWidth: 1,
                        borderColor: 'rgba(230, 230, 230, 0.4)',
                        backgroundColor: 'rgba(255, 255, 255, 0.5)',  // 더 투명한 배경 (40% 불투명도)
                    }}
                >
                    <StyledView 
                        className="flex-1 items-center justify-center"
                        style={{
                            backgroundColor: 'transparent',
                            borderRadius: 100,
                            width: '100%',
                            height: '100%',
                        }}
                    >
                        <StyledText>
                            {emoji}
                        </StyledText>
                        <StyledText 
                            className="text-base font-bold text-center" 
                            style={{
                                width: 65, // 고정 너비를 더 넓게 설정
                                textAlign: 'center',
                                color: '#333333', // 글자 색상 어둡게 하여 가독성 유지
                            }}
                        >
                            {formatTimeForButton(displayedElapsedTime)}
                        </StyledText>
                    </StyledView>
                </StyledAnimatedView>
            </StyledTouchableOpacity>
        </StyledView>
    );
};
