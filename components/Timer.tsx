// Timer.tsx - 모듈화된 버전
import { useElapsedTime } from "@/components/ElapsedTimeContext";
import { setElapsedTime as setActivityElapsedTime, stopTracking } from "@/store/activitySlice";
import { resetAll } from "@/store/pomodoroSlice";
import { RootState } from "@/store/store";
import { stopTrackingTodo } from "@/store/todoSlice";
import { createSelector } from '@reduxjs/toolkit';
import { styled } from "nativewind";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, TouchableOpacity, Vibration, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";
import { TimerDisplay } from "./timer/TimerDisplay";
import { TimerUtils } from "./timer/TimerUtils";

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledAnimatedView = styled(Animated.View);

// 메모이제이션된 셀렉터 생성
const selectCurrentActivityId = createSelector(
    [
        (state: RootState) => state.activity.menu,
        (state: RootState) => state.activity.trackingActivity?.description,
        (state: RootState) => state.activity.trackingActivity?.emoji
    ],
    (menu, description, emoji) => {
        if (!description || !emoji) return undefined;
        
        const foundActivity = menu.find(
            activity => activity.name === description && activity.emoji === emoji
        );
        
        return foundActivity?.id;
    }
);

// 현재 진행 중인 할일을 선택하는 셀렉터 추가
const selectCurrentTodo = createSelector(
    [
        (state: RootState) => state.todos.todosByActivity,
        (state: RootState) => selectCurrentActivityId(state)
    ],
    (todosByActivity, currentActivityId) => {
        if (!currentActivityId) return undefined;
        
        const activityTodos = todosByActivity[currentActivityId];
        if (!activityTodos) return undefined;
        
        return activityTodos.find(todo => todo.isTracking);
    }
);

export function Timer() {
    const activityState = useSelector((state: RootState) => state.activity);
    const dispatch = useDispatch();
    const isTracking = useSelector((state: RootState) => state.activity.isTracking);
    const elapsedTime = useSelector((state: RootState) => state.activity.elapsedTime);
    const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();
    const trackingActivity = useSelector((state: RootState) => state.activity.trackingActivity);
    const currentTodo = useSelector(selectCurrentTodo);

    const [displayedElapsedTime, setDisplayedElapsedTime] = useState(elapsedTime);
    const [milestone, setMilestone] = useState("집중 시작!");
    const [lastMilestoneTime, setLastMilestoneTime] = useState(0);
    const timerInterval = useRef<number | NodeJS.Timeout | null>(null);
    const [stopButtonScale] = useState(new Animated.Value(1));
    const [slideAnim] = useState(new Animated.Value(0));
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandAnim] = useState(new Animated.Value(0));
    const {description, emoji, startDate, startTime} = activityState.trackingActivity || {};
    
    // 이전 활동 정보를 저장하는 ref 추가
    const previousActivityRef = useRef<string | null>(null);
    
    // 추가: 이전 트래킹 상태 저장
    const wasTrackingRef = useRef(false);
    
    // 메모이제이션된 셀렉터 사용
    const currentActivityId = useSelector(selectCurrentActivityId);

    // 활동 상태 변경 감지 (시작, 중지, 전환)
    useEffect(() => {
        // 트래킹 시작 감지
        if (isTracking && !wasTrackingRef.current) {
            // 새로운 활동 시작 - 타이머 초기화
            localElapsedTimeRef.current = 0;
            setDisplayedElapsedTime(0);
            setMilestone("집중 시작!");
            setLastMilestoneTime(0);
        }
        
        // 이전 트래킹 상태 저장
        wasTrackingRef.current = isTracking;
    }, [isTracking]);

    // 활동 변경 감지
    useEffect(() => {
        const currentActivityKey = `${emoji}:${description}`;
        const previousActivityKey = previousActivityRef.current;
        
        // 활동이 변경되었는지 확인
        if (previousActivityKey && currentActivityKey !== previousActivityKey && isTracking) {
            console.log('활동 변경 감지:', previousActivityKey, '->', currentActivityKey);
            
            // 활동이 변경된 경우 타이머 초기화
            localElapsedTimeRef.current = 0;
            setDisplayedElapsedTime(0);
            setMilestone("집중 시작!");
            setLastMilestoneTime(0);
            
            // 타이머 애니메이션 효과
            Vibration.vibrate(100);
        }
        
        // 현재 활동 키 저장
        if (emoji && description) {
            previousActivityRef.current = currentActivityKey;
        } else if (!isTracking) {
            previousActivityRef.current = null;
        }
    }, [emoji, description, isTracking]);

    // startDate 변경 감지 (활동 전환에서 중요)
    useEffect(() => {
        if (isTracking && startDate) {
            // 시작 시간이 변경됨 - 타이머 재계산
            const now = new Date();
            const start = new Date(startDate);
            const elapsed = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 1000));
            
            console.log('시작 시간 변경 감지:', startDate, '경과 시간:', elapsed);
            
            // 새 활동이 시작된 지 2초 이내면 타이머 초기화
            if (elapsed < 2) {
                localElapsedTimeRef.current = 0;
                setDisplayedElapsedTime(0);
            } else {
                localElapsedTimeRef.current = elapsed;
                setDisplayedElapsedTime(elapsed);
            }
            
            dispatch(setActivityElapsedTime(localElapsedTimeRef.current));
        }
    }, [startDate, isTracking, dispatch]);

    const handleStopTracking = useCallback(() => {
        if (activityState.trackingActivity) {
            // 현재 활동 중인 할일이 있다면 할일의 상태도 함께 종료
            if (currentTodo && currentActivityId) {
                dispatch(stopTrackingTodo({
                    activityId: currentActivityId,
                    todoId: currentTodo.id
                }));
            }

            dispatch(stopTracking());
            Vibration.vibrate(500);
            localElapsedTimeRef.current = 0;
            setDisplayedElapsedTime(0);
            setMilestone("집중 시작!");
            setLastMilestoneTime(0);

            // 포모도로 타이머도 초기화
            dispatch(resetAll());
        }
    }, [activityState.trackingActivity, currentTodo, currentActivityId, dispatch, localElapsedTimeRef]);

    // 마일스톤 메시지 생성 함수
    const getMilestoneMessage = useCallback((seconds: number, lastMilestone: number) => {
        return TimerUtils.getMilestoneMessage(seconds, lastMilestone, milestone, false);
    }, [milestone]);

    // 시간 형식 함수
    const formatElapsedTime = useCallback((seconds: number) => {
        return TimerUtils.formatElapsedTime(seconds);
    }, []);

    // 중지 버튼 애니메이션
    useEffect(() => {
        if (isTracking) {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(stopButtonScale, {
                        toValue: 1.2,
                        duration: 1000,
                        useNativeDriver: true
                    }),
                    Animated.timing(stopButtonScale, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true
                    })
                ])
            );

            // 기존 애니메이션 중지
            stopButtonScale.stopAnimation();
            // 새로운 애니메이션 시작
            pulseAnimation.start();

            return () => {
                pulseAnimation.stop();
                stopButtonScale.setValue(1);
            };
        } else {
            stopButtonScale.setValue(1);
        }
    }, [isTracking, stopButtonScale]);

    // 마일스톤 달성 애니메이션을 위한 별도의 scale 값
    const milestoneScale = useRef(new Animated.Value(1)).current;

    // 마일스톤 애니메이션 수정
    const playMilestoneAnimation = useCallback(() => {
        Animated.sequence([
            Animated.timing(milestoneScale, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(milestoneScale, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    }, [milestoneScale]);

    useEffect(() => {
        if (isTracking) {
            timerInterval.current = setInterval(() => {
                ++localElapsedTimeRef.current;
                setDisplayedElapsedTime(localElapsedTimeRef.current);

                // 마일스톤 메시지 업데이트
                const newMilestone = getMilestoneMessage(localElapsedTimeRef.current, lastMilestoneTime);
                if (newMilestone !== milestone) {
                    setMilestone(newMilestone);
                    setLastMilestoneTime(localElapsedTimeRef.current);
                    Vibration.vibrate(100);
                    playMilestoneAnimation();
                }
            }, 1000);
        } else if (timerInterval.current !== null) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
        }

        return () => {
            if (timerInterval.current !== null) {
                clearInterval(timerInterval.current);
            }
        };
    }, [isTracking, milestone, lastMilestoneTime, getMilestoneMessage, playMilestoneAnimation]);

    useEffect(() => {
        if (isExpanded) {
            Animated.timing(expandAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true
            }).start();
        } else {
            Animated.timing(expandAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [isExpanded, expandAnim]);

    return (
        <GestureHandlerRootView className="z-10 flex-1">
            <StyledView className="flex-1 w-full">
                <TimerDisplay
                    emoji={emoji}
                    milestone={milestone}
                    stopButtonScale={stopButtonScale}
                    description={currentTodo ? `${description} - ${currentTodo.text}` : description}
                    displayedElapsedTime={displayedElapsedTime}
                    formatElapsedTime={formatElapsedTime}
                    handleStopTracking={handleStopTracking}
                    activityId={currentActivityId}
                />
            </StyledView>
        </GestureHandlerRootView>
    );
}
