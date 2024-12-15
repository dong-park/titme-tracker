// Timer.tsx
import {Animated, StyleSheet, Text, TouchableOpacity, Vibration, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {setElapsedTime, stopTracking} from "@/store/activitySlice";
import {useElapsedTime} from "@/components/ElapsedTimeContext";
import {useNavigation} from "@react-navigation/native";
import {router} from "expo-router";

export function Timer() {
    const activityState = useSelector((state: RootState) => state.activity);
    const dispatch = useDispatch();
    const isTracking = useSelector((state: RootState) => state.activity.isTracking);
    const elapsedTime = useSelector((state: RootState) => state.activity.elapsedTime);
    const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();

    // 일시정지 관련 상태 제거
    // const [isPaused, setIsPaused] = useState(falsze);

    const [displayedElapsedTime, setDisplayedElapsedTime] = useState(elapsedTime);
    const timerInterval = useRef<number | NodeJS.Timeout | null>(null);
    const [timerScale] = useState(new Animated.Value(1));
    const [slideAnim] = useState(new Animated.Value(-500));
    const {description, emoji, startTime} = activityState.trackingActivity || {};

    const navigation = useNavigation(); // 네비게이션 훅

    const formatElapsedTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? `${hrs}시간 ` : ''} ${mins > 0 ? `${mins}분` : ''} ${secs}초`;
    };

    const handleStopTracking = () => {
        Animated.timing(slideAnim, {
            toValue: 500,
            duration: 750,
            useNativeDriver: true
        }).start(() => {
            if (activityState.trackingActivity) {
                dispatch(setElapsedTime(localElapsedTimeRef.current));
                dispatch(stopTracking());
                Vibration.vibrate(500);
                localElapsedTimeRef.current = 0;
                setDisplayedElapsedTime(0);
                slideAnim.setValue(0);
            }
        });
    };

    // 화면을 누르면 뽀모도로 타이머로 이동
    const handleNavigatePomodoro = () => {
        router.push({
            pathname: '/pomodoro',
            params: {
                id: '1',
                name: '독서',
                elapsedTime: localElapsedTimeRef.current, // 참조값에 담긴 현재 시간 전달
                pomodoroDuration: 30 // 30분, 원하는 시간으로 설정 가능
            },
        });
    };

    useEffect(() => {
        // isPaused 제거, 항상 isTracking 상태일 때 타이머 진행
        if (isTracking) {
            timerInterval.current = setInterval(() => {
                ++localElapsedTimeRef.current;
                setDisplayedElapsedTime(localElapsedTimeRef.current);
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
    }, [isTracking]);

    useEffect(() => {
        if (isTracking) {
            dispatch(setElapsedTime(localElapsedTimeRef.current));
        }
    }, [isTracking, dispatch]);

    useEffect(() => {
        // isPaused 로직 제거
        if (isTracking) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(timerScale, {toValue: 1.1, duration: 500, useNativeDriver: true}),
                    Animated.timing(timerScale, {toValue: 1, duration: 500, useNativeDriver: true}),
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

    return (
        <TouchableOpacity
            onPress={handleNavigatePomodoro} // 누르면 뽀모도로 타이머 화면으로 이동
            activeOpacity={0.5}
        >
            <Animated.View style={[
                styles.trackingContainer,
                {transform: [{translateX: slideAnim}]}]}
            >
                <Text
                    style={[styles.description]}
                    numberOfLines={1}
                >
                    <Text style={[styles.descriptionText]}>
                        {emoji}
                    </Text>
                </Text>
                <Animated.Text
                    style={[styles.elapsedTime,
                        {transform: [{scale: timerScale}]}]}
                >
                    {formatElapsedTime(displayedElapsedTime)}
                </Animated.Text>
                <View style={styles.buttons}>
                    <TouchableOpacity
                        style={styles.stopButton}
                        onPress={handleStopTracking}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.stopButtonText}>종료</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    trackingContainer: {
        backgroundColor: '#f5f5dc',
        padding: 16,
        marginHorizontal: 16,
        borderRadius: 10,
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    elapsedTime: {
        fontSize: 35,
        color: '#ff8c00',
        fontWeight: 'bold',
        marginLeft: 2,
        textAlign: 'center',
        width: '70%',
    },
    buttons: {
        flexDirection: 'row',
        justifyContent: "center",
        width: '15%',
    },
    stopButton: {
        backgroundColor: '#ff5a5f',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    stopButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 13,
        textAlign: 'center',
    },
    description: {
        fontSize: 30,
        width: '15%',
        textAlign: 'center',
    },
    descriptionText: {}
});
