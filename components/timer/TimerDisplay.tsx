// components/timer/TimerDisplay.tsx (수정된 버전)
import {Animated, Text, TouchableOpacity, View} from "react-native";
import React, { useState, useMemo } from "react";
import {styled} from "nativewind";
import {PomodoroTimer} from "@/components/timer/PomodoroTimer";
import { Ionicons } from '@expo/vector-icons';
import { TodoList } from "@/components/TodoList";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { createSelector } from '@reduxjs/toolkit';

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
    const [showPomodoroTimer, setShowPomodoroTimer] = useState(false);
    const [showTodoList, setShowTodoList] = useState(false);
    
    // 메모이제이션된 셀렉터 사용
    const activity = useSelector(
      (state: RootState) => selectActivityById(state, activityId)
    );
    
    // 메모이제이션된 값 사용
    const hasTodoList = useMemo(() => !!activity?.todoListEnabled, [activity]);
    const hasPomodoroTimer = useMemo(() => !!activity?.pomodoroEnabled, [activity]);

    return (
        <StyledTouchableOpacity
            className="active:opacity-80"
            onPress={togglePomodoroTimer}
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

                {/* 펼치기 버튼 - iOS 스타일로 변경 */}
                <StyledTouchableOpacity
                    className="w-full items-center mt-2"
                    onPress={() => setIsExpanded(!isExpanded)}
                >
                    <StyledView className="bg-slate-100 rounded-full p-1 w-8 items-center">
                        <Ionicons
                            name={isExpanded ? "chevron-up" : "chevron-down"}
                            size={16}
                            color="#666"
                        />
                    </StyledView>
                </StyledTouchableOpacity>

                {/* 펼쳐진 내용 - iOS 스타일로 변경 */}
                {isExpanded && (
                    <StyledAnimatedView
                        className="mt-3 pt-3 border-t border-slate-200"
                        style={{opacity: expandAnim}}
                    >
                        <StyledText className="text-slate-600 text-sm">
                            {description || "활동 설명이 없습니다"}
                        </StyledText>
                        <StyledView className="flex-row items-center mt-2">
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <StyledText className="text-slate-600 text-sm ml-1">
                                진행 시간: {formatElapsedTime(displayedElapsedTime)}
                            </StyledText>
                        </StyledView>

                        {/* 기능 버튼 영역 */}
                        <StyledView className="flex-row mt-3 justify-center space-x-4">
                            {hasPomodoroTimer && (
                                <StyledTouchableOpacity
                                    className="items-center"
                                    onPress={() => setShowPomodoroTimer(!showPomodoroTimer)}
                                >
                                    <StyledView className="bg-blue-50 p-2 rounded-full">
                                        <Ionicons name="timer-outline" size={20} color="#3B82F6" />
                                    </StyledView>
                                    <StyledText className="text-xs text-blue-600 mt-1">뽀모도로</StyledText>
                                </StyledTouchableOpacity>
                            )}
                            
                            {hasTodoList && (
                                <StyledTouchableOpacity
                                    className="items-center"
                                    onPress={() => setShowTodoList(!showTodoList)}
                                >
                                    <StyledView className="bg-green-50 p-2 rounded-full">
                                        <Ionicons name="list-outline" size={20} color="#10B981" />
                                    </StyledView>
                                    <StyledText className="text-xs text-green-600 mt-1">할 일</StyledText>
                                </StyledTouchableOpacity>
                            )}
                        </StyledView>

                        <StyledTouchableOpacity
                            className="absolute top-2 right-0 p-1.5 rounded-full z-10"
                            onPress={handleStopTracking}
                        >
                            <Ionicons name="close-circle" size={22} color="#FF5A5F" />
                        </StyledTouchableOpacity>

                        {/* 뽀모도로 타이머 */}
                        {showPomodoroTimer && hasPomodoroTimer && (
                            <StyledView className="mt-4 border-t border-slate-200 pt-4">
                                <PomodoroTimer
                                    onClose={() => setShowPomodoroTimer(false)}
                                />
                            </StyledView>
                        )}
                        
                        {/* 투두 리스트 */}
                        {showTodoList && hasTodoList && activityId && (
                            <StyledView className="mt-4 border-t border-slate-200 pt-4">
                                <TodoList activityId={activityId} />
                            </StyledView>
                        )}
                    </StyledAnimatedView>
                )}
            </StyledAnimatedView>
        </StyledTouchableOpacity>
    );
};
