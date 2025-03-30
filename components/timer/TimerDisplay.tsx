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
                    className="bg-white rounded-full shadow-lg"
                    style={{
                        transform: [{translateY: slideAnim}, {scale: timerScale}],
                        width: 60,
                        height: 60,
                        padding: 12,
                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: 4,
                        },
                        shadowOpacity: 0.15,
                        shadowRadius: 5,
                        elevation: 5
                    }}
                >
                    <StyledView className="flex-1 items-center justify-center">
                        <StyledText className="text-xl" numberOfLines={1}>
                            {emoji}
                        </StyledText>
                    </StyledView>

                    <StyledTouchableOpacity
                        className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full z-10"
                        onPress={handleStopTracking}
                    >
                        <Ionicons name="close-circle" size={16} color="#FF5A5F" />
                    </StyledTouchableOpacity>
                </StyledAnimatedView>
            </StyledTouchableOpacity>
        </StyledView>
    );
};
