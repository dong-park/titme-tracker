// Timer.tsx - 모듈화된 버전
import {Animated, TouchableOpacity, Vibration, View} from "react-native";
import React, {useEffect, useRef, useState, useMemo, useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {setElapsedTime as setActivityElapsedTime, stopTracking} from "@/store/activitySlice";
import {useElapsedTime} from "@/components/ElapsedTimeContext";
import {styled} from "nativewind";
import {TimerDisplay} from "./timer/TimerDisplay";
import {resetAll} from "@/store/pomodoroSlice";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import { createSelector } from '@reduxjs/toolkit';
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
    const [slideAnim] = useState(new Animated.Value(100));
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandAnim] = useState(new Animated.Value(0));
    const {description, emoji, startTime} = activityState.trackingActivity || {};
    
    // 메모이제이션된 셀렉터 사용
    const currentActivityId = useSelector(selectCurrentActivityId);

    const handleStopTracking = useCallback(() => {
        Animated.timing(slideAnim, {
            toValue: 100,
            duration: 750,
            useNativeDriver: true
        }).start(() => {
            if (activityState.trackingActivity) {
                dispatch(stopTracking());
                Vibration.vibrate(500);
                localElapsedTimeRef.current = 0;
                setDisplayedElapsedTime(0);
                setMilestone("집중 시작!");
                setLastMilestoneTime(0);
                slideAnim.setValue(100);

                // 포모도로 타이머도 초기화
                dispatch(resetAll());
            }
        });
    }, [activityState.trackingActivity, dispatch, localElapsedTimeRef, slideAnim]);

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
        if (isTracking) {
            dispatch(setActivityElapsedTime(localElapsedTimeRef.current));
        }
    }, [isTracking, dispatch, localElapsedTimeRef]);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true
        }).start();
    }, [slideAnim]);

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
                />
            </StyledView>
        </GestureHandlerRootView>
    );
}
