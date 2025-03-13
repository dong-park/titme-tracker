// Timer.tsx - 모듈화된 버전
import {Animated, TouchableOpacity, Vibration, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {setElapsedTime as setActivityElapsedTime, stopTracking} from "@/store/activitySlice";
import {useElapsedTime} from "@/components/ElapsedTimeContext";
import {styled} from "nativewind";
import {TimerDisplay} from "./timer/TimerDisplay";
import {resetAll} from "@/store/pomodoroSlice";
import {GestureHandlerRootView} from "react-native-gesture-handler";

const StyledView = styled(View);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledAnimatedView = styled(Animated.View);

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
    const [slideAnim] = useState(new Animated.Value(-500));
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandAnim] = useState(new Animated.Value(0));
    const {description, emoji, startTime} = activityState.trackingActivity || {};
    
    // 현재 활동 ID 찾기
    const [currentActivityId, setCurrentActivityId] = useState<number | undefined>(undefined);
    
    // 현재 활동 이름으로 메뉴에서 활동 ID 찾기
    useEffect(() => {
        if (description && emoji) {
            const foundActivity = activityState.menu.find(
                activity => activity.name === description && activity.emoji === emoji
            );
            setCurrentActivityId(foundActivity?.id);
        } else {
            setCurrentActivityId(undefined);
        }
    }, [description, emoji, activityState.menu]);

    const handleStopTracking = () => {
        Animated.timing(slideAnim, {
            toValue: 500,
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
                slideAnim.setValue(0);

                // 포모도로 타이머도 초기화
                dispatch(resetAll());
            }
        });
    };

    const togglePomodoroTimer = () => {
        // 이제 TimerDisplay 내부에서 처리됨
    };

    // 마일스톤 메시지 생성 함수
    const getMilestoneMessage = (seconds: number, lastMilestone: number) => {
        // 처음 시작할 때
        if (seconds < 60) return "집중 시작!";

        // 마일스톤 달성 시점 (5분, 10분, 15분, 30분, 45분, 1시간, 1시간 30분, 2시간...)
        const minutes = Math.floor(seconds / 60);

        if (minutes === 5 && lastMilestone < 5 * 60) return "5분 달성! 좋은 출발이에요";
        if (minutes === 10 && lastMilestone < 10 * 60) return "10분 달성! 계속 집중하세요";
        if (minutes === 15 && lastMilestone < 15 * 60) return "15분 달성! 잘 하고 있어요";
        if (minutes === 30 && lastMilestone < 30 * 60) return "30분 달성! 대단해요";
        if (minutes === 45 && lastMilestone < 45 * 60) return "45분 달성! 끝까지 화이팅!";

        if (minutes === 60 && lastMilestone < 60 * 60) return "1시간 달성! 놀라운 집중력이에요";
        if (minutes === 90 && lastMilestone < 90 * 60) return "1시간 30분! 정말 대단해요";
        if (minutes === 120 && lastMilestone < 120 * 60) return "2시간 달성! 프로 집중러!";

        // 30분 단위로 계속 마일스톤 제공
        if (minutes % 30 === 0 && lastMilestone < minutes * 60)
            return `${minutes}분 달성! 믿기지 않는 집중력!`;

        // 마일스톤 사이의 메시지
        return milestone; // 기존 메시지 유지
    };

    // 시간 형식 함수
    const formatElapsedTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? `${hrs}시간 ` : ''} ${mins > 0 ? `${mins}분` : ''} ${secs}초`;
    };

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
    }, [isTracking, milestone, lastMilestoneTime]);

    useEffect(() => {
        if (isTracking) {
            dispatch(setActivityElapsedTime(localElapsedTimeRef.current));
        }
    }, [isTracking, dispatch]);

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
    }, [isTracking]);

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true
        }).start();
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
    }, [isExpanded]);

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
