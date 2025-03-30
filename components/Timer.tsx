// Timer.tsx - 모듈화된 버전
import { useElapsedTime } from "@/components/ElapsedTimeContext";
import { setElapsedTime as setActivityElapsedTime, stopTracking } from "@/store/activitySlice";
import { resetAll } from "@/store/pomodoroSlice";
import { RootState } from "@/store/store";
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

export function Timer() {
    const activityState = useSelector((state: RootState) => state.activity);
    const dispatch = useDispatch();
    const isTracking = useSelector((state: RootState) => state.activity.isTracking);
    const elapsedTime = useSelector((state: RootState) => state.activity.elapsedTime);
    const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();

    const [displayedElapsedTime, setDisplayedElapsedTime] = useState(elapsedTime);
    const [milestone, setMilestone] = useState("집중 시작!");
    const [lastMilestoneTime, setLastMilestoneTime] = useState(0);
    const timerInterval = useRef<number | NodeJS.Timeout | null>(null);
    const [timerScale] = useState(new Animated.Value(1));
    const [slideAnim] = useState(new Animated.Value(0));
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandAnim] = useState(new Animated.Value(0));
    const [isMilestoneVisible, setIsMilestoneVisible] = useState(false);
    const [milestoneOpacity] = useState(new Animated.Value(0));
    const {description, emoji, startDate, startTime} = activityState.trackingActivity || {};
    
    // 메모이제이션된 셀렉터 사용
    const currentActivityId = useSelector(selectCurrentActivityId);

    const handleStopTracking = useCallback(() => {
        if (activityState.trackingActivity) {
            dispatch(stopTracking());
            Vibration.vibrate(500);
            localElapsedTimeRef.current = 0;
            setDisplayedElapsedTime(0);
            setMilestone("집중 시작!");
            setLastMilestoneTime(0);

            // 포모도로 타이머도 초기화
            dispatch(resetAll());
        }
    }, [activityState.trackingActivity, dispatch, localElapsedTimeRef]);

    const togglePomodoroTimer = useCallback(() => {
        // 더 이상 사용하지 않음
        console.log("포모도로 타이머 토글");
    }, []);

    // 마일스톤 메시지 생성 함수
    const getMilestoneMessage = useCallback((seconds: number, lastMilestone: number) => {
        return TimerUtils.getMilestoneMessage(seconds, lastMilestone, milestone, false);
    }, [milestone]);

    // 시간 형식 함수
    const formatElapsedTime = useCallback((seconds: number) => {
        return TimerUtils.formatElapsedTime(seconds);
    }, []);

    // 일반 타이머 흐르게하는 useEffect
    useEffect(() => {
        if (isTracking) {
            const pulseAnimation = Animated.loop(
                Animated.sequence([
                    Animated.timing(timerScale, {
                        toValue: 1.02,
                        duration: 1000,
                        useNativeDriver: true
                    }),
                    Animated.timing(timerScale, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true
                    })
                ])
            );

            // 기존 애니메이션 중지
            timerScale.stopAnimation();
            // 새로운 애니메이션 시작
            pulseAnimation.start();

            return () => {
                pulseAnimation.stop();
                timerScale.setValue(1);
            };
        } else {
            timerScale.setValue(1);
        }
    }, [isTracking, timerScale]);

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
                    setIsMilestoneVisible(true);
                    Vibration.vibrate(100);
                    playMilestoneAnimation();
                    
                    // 말풍선 페이드 인
                    Animated.sequence([
                        Animated.timing(milestoneOpacity, {
                            toValue: 1,
                            duration: 300,
                            useNativeDriver: true
                        }),
                        Animated.delay(10000), // 10초 대기
                        Animated.timing(milestoneOpacity, {
                            toValue: 0,
                            duration: 300,
                            useNativeDriver: true
                        })
                    ]).start(() => {
                        setIsMilestoneVisible(false);
                    });
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
        // startDate가 있으면 그 시점부터 현재까지 경과 시간 계산
        if (isTracking && startDate) {
            const elapsed = new Date().getTime() - new Date(startDate).getTime();
            const seconds = Math.floor(elapsed / 1000);
            localElapsedTimeRef.current = seconds;
            setDisplayedElapsedTime(seconds);
            dispatch(setActivityElapsedTime(seconds));
        } 
        // 전역 상태의 elapsedTime 사용
        else if (elapsedTime > 0) {
            localElapsedTimeRef.current = elapsedTime;
            setDisplayedElapsedTime(elapsedTime);
        }
    }, []);

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
        <GestureHandlerRootView style={{ zIndex: 10, flex: 1 }}>
            <StyledView className="flex-1">
                <TimerDisplay
                    emoji={emoji}
                    milestone={milestone}
                    timerScale={timerScale}
                    milestoneScale={milestoneScale}
                    description={description}
                    displayedElapsedTime={displayedElapsedTime}
                    formatElapsedTime={formatElapsedTime}
                    isExpanded={isExpanded}
                    setIsExpanded={setIsExpanded}
                    expandAnim={expandAnim}
                    slideAnim={slideAnim}
                    handleStopTracking={handleStopTracking}
                    togglePomodoroTimer={togglePomodoroTimer}
                    activityId={currentActivityId}
                    isMilestoneVisible={isMilestoneVisible}
                    milestoneOpacity={milestoneOpacity}
                />
            </StyledView>
        </GestureHandlerRootView>
    );
}
