// components/timer/TimerDisplay.tsx (수정된 버전)
import {Animated, Text, TouchableOpacity, View} from "react-native";
import React, { useState, useMemo } from "react";
import {styled} from "nativewind";
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { createSelector } from '@reduxjs/toolkit';
import { router } from 'expo-router';

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
        router.push('/focus');
    };

    return (
        <StyledTouchableOpacity
            className="active:opacity-80"
            onPress={navigateToFocusPage}
        >
            <StyledAnimatedView
                className="bg-white p-4 mx-4 rounded-lg my-2.5 shadow-sm"
                style={{transform: [{translateX: slideAnim}]}}
            >
                {/* 메인 컨텐츠 - 두근두근 효과 유지 */}
                <StyledView className="flex-row items-center justify-between">
                    <StyledText className="text-3xl w-[15%] text-center" numberOfLines={1}>
                        {emoji}
                    </StyledText>
                    <StyledView className="w-[85%] items-center">
                        <StyledAnimatedText
                            className="text-lg text-slate-800 font-medium text-center"
                            style={{transform: [{scale: timerScale}]}}  // 두근두근 효과 유지
                        >
                            {milestone}
                        </StyledAnimatedText>
                    </StyledView>
                </StyledView>

                {/* 집중 페이지 이동 버튼 */}
                <StyledTouchableOpacity
                    className="w-full items-center mt-2"
                    onPress={navigateToFocusPage}
                >
                    {/* <StyledView className="bg-blue-100 rounded-full py-1.5 px-4 flex-row items-center">
                        <StyledText className="text-blue-600 text-sm font-medium mr-1">집중 페이지로 이동</StyledText>
                        <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                    </StyledView> */}
                </StyledTouchableOpacity>

                <StyledTouchableOpacity
                    className="absolute top-2 right-0 p-1.5 rounded-full z-10"
                    onPress={handleStopTracking}
                >
                    <Ionicons name="close-circle" size={22} color="#FF5A5F" />
                </StyledTouchableOpacity>
            </StyledAnimatedView>
        </StyledTouchableOpacity>
    );
};
