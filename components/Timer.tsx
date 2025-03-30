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
        // 처음 시작할 때
        if (seconds < 10) return "안녕하세요! 저와 함께 집중해볼까요? 💫";

        // 마일스톤 달성 시점 (5분, 10분, 15분, 30분, 45분, 1시간, 1시간 30분, 2시간...)
        const minutes = Math.floor(seconds / 60);

        if (minutes === 1 && lastMilestone < 1 * 60) return "우와! 벌써 1분이나 집중했어요! 👏";
        if (minutes === 5 && lastMilestone < 5 * 60) return "우와! 벌써 5분이나 집중했어요! 👏";
        if (minutes === 10 && lastMilestone < 10 * 60) return "10분 달성! 저랑 잘 맞는 것 같아요~ 🌟";
        if (minutes === 15 && lastMilestone < 15 * 60) return "15분이에요! 집중력이 대단한걸요? ✨";
        if (minutes === 30 && lastMilestone < 30 * 60) return "30분 달성! 절반을 향해 가고 있어요! 💪";
        if (minutes === 45 && lastMilestone < 45 * 60) return "45분! 이제 곧 1시간이에요! 힘내요~ 🎯";

        if (minutes === 60 && lastMilestone < 60 * 60) return "1시간 달성! 정말 자랑스러워요! 🎉";
        if (minutes === 90 && lastMilestone < 90 * 60) return "1시간 30분! 오늘 컨디션이 최고네요! 🌈";
        if (minutes === 120 && lastMilestone < 120 * 60) return "2시간이나 집중했어요! 당신은 진정한 프로에요! 🏆";

        // 30분 단위로 계속 마일스톤 제공
        if (minutes % 30 === 0 && lastMilestone < minutes * 60)
            return `${minutes}분 달성! 믿을 수 없는 집중력이에요! 🌟`;

        // 마일스톤 사이의 메시지
        return milestone; // 기존 메시지 유지
    }, [milestone]);

    // 시간 형식 함수
    const formatElapsedTime = useCallback((seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? `${hrs}시간 ` : ''} ${mins > 0 ? `${mins}분` : ''} ${secs}초`;
    }, []);

    // 일반 타이머 흐르게하는 useEffect
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

                    // 새 마일스톤 달성 시 진동 피드백 (선택적)
                    Vibration.vibrate(100);

                    // 마일스톤 달성 시 애니메이션 효과
                    Animated.sequence([
                        Animated.timing(timerScale, {toValue: 1.3, duration: 300, useNativeDriver: true}),
                        Animated.timing(timerScale, {toValue: 1, duration: 300, useNativeDriver: true}),
                    ]).start();
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
    }, [isTracking, milestone, lastMilestoneTime, getMilestoneMessage, timerScale]);

    useEffect(() => {
        if (isTracking) {
            dispatch(setActivityElapsedTime(localElapsedTimeRef.current));
        }
    }, [isTracking, dispatch, localElapsedTimeRef]);

    useEffect(() => {
        if (isTracking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(timerScale, {toValue: 1.05, duration: 1000, useNativeDriver: true}),
                    Animated.timing(timerScale, {toValue: 1, duration: 1000, useNativeDriver: true}),
                ])
            ).start();
        } else {
            timerScale.setValue(1);
        }
    }, [isTracking, timerScale]);

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
