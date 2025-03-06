import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { RootState } from "@/store/store";
import { ActivityState, addFocusSegment, FocusSegment, startTracking } from "@/store/activitySlice";
import React, { useEffect, useState, useMemo } from "react";
import {
    incrementColorIndex,
    incrementCycleCount,
    resetAll,
    resetJustTimer,
    setCurrentSegmentDescription,
    setElapsedTime,
    setPomodoroDuration,
    setRunning,
    tick
} from "@/store/pomodoroSlice";
import { Alert, Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "@/pomodoro/layout.styles";
import Svg, { Circle, Path, Line, G } from "react-native-svg";
import { createSelector } from "reselect";
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedGestureHandler,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { debounce } from 'lodash';

export const selectFocusSegmentsByActivityIndex = createSelector(
    // 첫 번째 인자는 상태에서 필요한 값 추출
    [
        (state: RootState) => state.activity.trackingActivity,
        (_, activityIndex: number) => activityIndex // 외부 인자로 activityIndex 전달
    ],
    // 두 번째 인자는 추출된 값으로 필요한 데이터 생성
    (activity, activityIndex) => {
        return activity ? activity.focusSegments : [];
    }
);

export function PomodoroScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const pomodoroState = useSelector((state: RootState) => state.pomodoro);
    const activityState: ActivityState = useSelector((state: RootState) => state.activity);

    const { pomodoroDuration, remainingTime, isRunning, colorIndex, cycleCount, currentSegmentDescription, currentSegmentStart } = pomodoroState;
    const { activities, trackingActivity, isTracking, elapsedTime } = activityState;

    const [sessionDescription, setSessionDescription] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>(() => () => {});

    const [handPosition, setHandPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (isRunning && remainingTime > 0) {
            interval = setInterval(() => {
                // 포모도로 타이머 1초 감소
                dispatch(tick());
            }, 1000);
        } else {
            if (interval) clearInterval(interval);

            // 한 바퀴 종료 시점 처리
            if (isRunning && remainingTime === 0) {
                const segmentEnd = new Date();

                dispatch(addFocusSegment({
                    description: currentSegmentDescription,
                    startDate: currentSegmentStart,
                    endDate: segmentEnd.toISOString(),
                    elapsedTime: pomodoroState.elapsedTime
                }));

                dispatch(resetJustTimer());
                dispatch(incrementCycleCount());
                dispatch(setPomodoroDuration(pomodoroDuration));
                dispatch(setElapsedTime(0));
                dispatch(incrementColorIndex());
                dispatch(setRunning(false));
                dispatch(setCurrentSegmentDescription("다음 집중 내용"));
            }
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isRunning, remainingTime, isTracking, elapsedTime]);

    const handleToggleRunning = () => {
        if (!trackingActivity) {
            dispatch(startTracking({
                startTime: new Date().toLocaleTimeString(),
                description: "새 활동",
                emoji: "⏱",
                elapsedTime: 0
            }));
        }
        dispatch(setRunning(!isRunning));
    };

    const addTenMinutes = () => {
        dispatch(setPomodoroDuration(pomodoroDuration + 600));
    };

    const subtractTenMinutes = () => {
        const elapsed = pomodoroDuration - remainingTime;
        const newDuration = Math.max(elapsed + 60, pomodoroDuration - 600);
        dispatch(setPomodoroDuration(newDuration));
    };

    const setCustomTimeModal = () => {
        setCustomMinutes('');
        setModalVisible(true);
    };

    const confirmCustomTime = () => {
        const inputMin = parseInt(customMinutes, 10);
        if (isNaN(inputMin) || inputMin <= 0) {
            Alert.alert("오류", "양의 정수를 입력하세요.");
            return;
        }

        const newDuration = inputMin * 60;
        const elapsed = pomodoroDuration - remainingTime;

        if (newDuration < elapsed) {
            Alert.alert("오류", "설정하려는 시간이 이미 경과된 시간보다 작습니다.");
            return;
        }

        dispatch(setPomodoroDuration(newDuration));
        setModalVisible(false);
    };

    const canSubtractTime = () => {
        const elapsed = pomodoroDuration - remainingTime;
        // 현재 duration에서 10분을 뺐을 때 경과 시간보다 크면 true
        return (pomodoroDuration - 600) > elapsed;
    };

    const elapsed = pomodoroDuration - remainingTime;
    const size = 200;
    const radius = size / 2;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const mm = String(mins).padStart(2, '0');
        const ss = String(secs).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    // 예시로 index 0번 액티비티의 focusSegments 가져오기
    const focusSegments = useSelector((state: RootState) =>
        selectFocusSegmentsByActivityIndex(state, 0) // 0번 인덱스를 선택
    );

    const renderSegmentItem = ({item}: {item: FocusSegment}) => (
        <View style={styles.segmentItem}>
            <Text style={styles.segmentText}>
                {Math.floor(item.elapsedTime / 60)}분 집중 - {item.description}
            </Text>
            <Text style={styles.segmentText}>
                {new Date(item.startDate).toLocaleTimeString()} ~ {new Date(item.endDate).toLocaleTimeString()}
            </Text>
        </View>
    );

    const confirmEndSession = () => {
        dispatch(addFocusSegment({
            description: sessionDescription,
            startDate: currentSegmentStart,
            endDate: new Date().toISOString(),
            elapsedTime: pomodoroState.elapsedTime
        }));

        setModalVisible(false);
        dispatch(resetAll());
        // dispatch(stopTracking()); // 활동 종료 제거
        navigation.goBack();
    };

    const handleEndSession = async () => {
        dispatch(setRunning(false));

        // 현재 추적 중인 활동이 있는지 확인
        if (!trackingActivity) {
            dispatch(resetAll()); // 포모도로 타이머 상태만 초기화
            navigation.goBack();
            return;
        }

        // 포커스 세그먼트가 있는지 확인
        if (trackingActivity.focusSegments.length === 0) {
            // 포커스 세그먼트가 없는 경우
            if (isRunning) {
                // 타이머가 실행 중이었다면 확인 요청
                Alert.alert(
                    "세션 종료",
                    "현재 진행 중인 타이머가 있습니다. 종료하시겠습니까?",
                    [
                        {
                            text: "취소",
                            onPress: () => dispatch(setRunning(true)),
                            style: "cancel"
                        },
                        {
                            text: "종료",
                            onPress: () => {
                                dispatch(resetAll()); // 포모도로 타이머 상태만 초기화
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                // 타이머가 실행 중이 아니었다면 바로 종료
                dispatch(resetAll()); // 포모도로 타이머 상태만 초기화
                navigation.goBack();
            }
            return;
        }

        // 포커스 세그먼트가 있는 경우 기존 로직 실행
        const result = await showModal();
        if (result) {
            await confirmEndSession();
        } else {
            dispatch(setRunning(true));
        }
    };

    // 모달을 띄우는 메서드
    const showModal = (): Promise<boolean> => {
        setModalVisible(true);
        return new Promise<boolean>((resolve) => {
            setResolvePromise(() => resolve);
        });
    };

    // 확인 버튼 클릭 핸들러
    const handleConfirm = () => {
        setModalVisible(false);
        resolvePromise(true); // Promise에 true 전달
    };

    // 취소 버튼 클릭 핸들러
    const handleCancel = () => {
        setModalVisible(false);
        resolvePromise(false); // Promise에 false 전달
    };

    const handleDescriptionChange = (text: string) => {
        dispatch(setCurrentSegmentDescription(text));
    };

    function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
        // 각도를 90도 더 회전시켜서 12시 방향에서 시작하도록 조정
        const adjustedStartAngle = startAngle + 90;
        const adjustedEndAngle = endAngle + 90;

        const start = polarToCartesian(x, y, radius, adjustedEndAngle);
        const end = polarToCartesian(x, y, radius, adjustedStartAngle);
        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    }


    function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    }

    const calculateProgress = () => {
        // 현재 설정된 시간을 1시간 기준으로 계산
        const durationProgress = pomodoroDuration / pomodoroState.maxDuration;
        // 남은 시간을 현재 설정된 시간 기준으로 계산
        const remainingProgress = remainingTime / pomodoroDuration;

        // 설정된 시간만큼의 원호를 그리고, 그 안에서 남은 시간을 표시
        return {
            totalAngle: durationProgress * 360, // 전체 설정 시간의 각도
            remainingAngle: (1 - remainingProgress) * (durationProgress * 360) // 진행된 만큼의 각도
        };
    };

    // 제스처 관련 상태
    const rotation = useSharedValue(0);
    const previousRotation = useSharedValue(0);

    // 시간 업데이트 함수를 별도로 분리
    const debouncedUpdateTime = useMemo(
        () => debounce((angle: number) => {
            const normalizedAngle = angle < 0 ? angle + 360 : angle;
            const newTime = Math.round((normalizedAngle / 360) * pomodoroState.maxDuration);
            dispatch(setPomodoroDuration(newTime));
            dispatch(setElapsedTime(0)); // elapsedTime 초기화 추가
        }, 16),
        [dispatch]
    );

    // 시계 눈금 그리기 함수
    const renderClockMarks = () => {
        const marks = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i * 30) * (Math.PI / 180); // 30도씩 (360/12)
            const isHour = i % 3 === 0; // 시간 단위(3의 배수)는 더 긴 선으로
            const length = isHour ? 15 : 10;
            const strokeWidth = isHour ? 2 : 1;

            const x1 = radius + (radius - 25) * Math.cos(angle);
            const y1 = radius + (radius - 25) * Math.sin(angle);
            const x2 = radius + (radius - 25 - length) * Math.cos(angle);
            const y2 = radius + (radius - 25 - length) * Math.sin(angle);

            marks.push(
                <Line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#333"
                    strokeWidth={strokeWidth}
                />
            );
        }
        return marks;
    };

    // 시침 그리기 함수
    const renderHourHand = () => {
        // const progress = pomodoroDuration / pomodoroState.maxDuration;
        const progress = remainingTime / pomodoroState.maxDuration;
        const angle = progress * 360 - 90; // -90도는 12시 방향을 시작점으로 하기 위함
        const handLength = radius - 20;

        const x2 = radius + handLength * Math.cos(angle * (Math.PI / 180));
        const y2 = radius + handLength * Math.sin(angle * (Math.PI / 180));

        return (
            <G>
                <Line
                    x1={radius}
                    y1={radius}
                    x2={x2}
                    y2={y2}
                    stroke="#007AFF"
                    strokeWidth={3}
                    strokeLinecap="round"
                />
            </G>
        );
    };

    // 각도를 시간으로 변환하는 함수 수정
    const angleToTime = (angle: number) => {
        // 각도를 0-360 범위로 정규화
        let normalizedAngle = ((angle + 90) % 360 + 360) % 360;
        // 각도를 시간으로 변환 (3600초 = 1시간)
        return Math.round((normalizedAngle / 360) * pomodoroState.maxDuration);
    };

    // 제스처 핸들러 수정
    const gestureHandler = useAnimatedGestureHandler({
        onStart: (event, context: any) => {
            if (!isRunning) {
                const { x, y } = event;
                // 중심점 기준으로 각도 계산 시 -90도 보정
                context.startAngle = (Math.atan2(
                    y - radius,
                    x - radius
                ) * (180 / Math.PI) + 360) % 360;
            }
        },
        onActive: (event, context: any) => {
            if (!isRunning) {
                const { x, y } = event;
                // 중심점 기준으로 각도 계산 시 -90도 보정
                let angle = (Math.atan2(
                    y - radius,
                    x - radius
                ) * (180 / Math.PI) + 360) % 360;

                // 12시 방향을 0도로 보정
                angle = (angle + 90) % 360;

                let diff = angle - context.startAngle;

                // 각도 차이가 큰 경우 보정
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;

                rotation.value = angle;
                runOnJS(debouncedUpdateTime)(angle);
            }
        },
    });

    const TimerClock = React.memo(() => {
        const progress = calculateProgress();

        return (
            <Svg width={size} height={size}>
                {/* 배경 원 */}
                <Circle
                    cx={radius}
                    cy={radius}
                    r={radius - 10}
                    stroke="#f0f0f0"
                    strokeWidth="2"
                    fill="white"
                />

                {/* 시계 눈금 */}
                {renderClockMarks()}

                {/* 전체 설정 시간을 나타내는 호 */}
                <Path
                    d={describeArc(
                        radius,
                        radius,
                        radius - 20,
                        -90,
                        progress.remainingAngle - 90
                    )}
                    stroke="#E0E0FF"
                    strokeWidth="10"
                    fill="none"
                />

                {/*/!* 진행된 시간을 나타내는 호 *!/*/}
                {/*<Path*/}
                {/*    d={describeArc(*/}
                {/*        radius,*/}
                {/*        radius,*/}
                {/*        radius - 20,*/}
                {/*        -90,*/}
                {/*        progress.remainingAngle - 90*/}
                {/*    )}*/}
                {/*    stroke="#007AFF"*/}
                {/*    strokeWidth="10"*/}
                {/*    fill="none"*/}
                {/*/>*/}

                {/* 시침 */}
                {renderHourHand()}

                {/* 중심점 */}
                <Circle
                    cx={radius}
                    cy={radius}
                    r={5}
                    fill="#333"
                />
            </Svg>
        );
    });


    return (
        <View style={styles.screenContainer}>
            {/* X 버튼 추가 */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleEndSession}
                >
                    <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
            </View>

            {/* 중앙 타이머 영역 */}
            <View style={styles.timerSection}>
                {/* 액티비티 정보 표시 */}
                {trackingActivity && (
                    <View style={styles.activityInfo}>
                        <Text style={styles.activityEmoji}>{trackingActivity.emoji}</Text>
                        <Text style={styles.activityDescription}>{trackingActivity.description}</Text>
                    </View>
                )}

                {/* 상단 포커스 카운트 표시 */}
                <View style={styles.cycleContainer}>
                    {Array(cycleCount).fill(0).map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.cycleDot,
                                { backgroundColor: ["#FF0000","#FF7F00","#FFFF00","#00FF00","#0000FF","#4B0082","#8F00FF"][index % 7] }
                            ]}
                        />
                    ))}
                </View>

                {/* 메인 타이머 영역 수정 */}
                <View
                    style={styles.timerSection}>
                    {/* 기존의 TouchableOpacity 제거하고 View로 변경 */}
                    <View style={styles.circleContainer}>
                        <PanGestureHandler onGestureEvent={gestureHandler}>
                            <Animated.View>
                                <TimerClock />
                            </Animated.View>
                        </PanGestureHandler>
                    </View>

                    {/* 남은 시간 표시 */}
                    <Text style={styles.remainingTimeText}>
                        {formatTime(remainingTime)}
                    </Text>

                    {/* 집중 내용 입력 */}
                    <TextInput
                        style={styles.focusInput}
                        placeholder="집중 내용을 입력하세요"
                        value={currentSegmentDescription}
                        onChangeText={handleDescriptionChange}
                    />
                </View>

                {/* 하단 컨트롤 영역 */}
                <View style={styles.controlSection}>
                    <View style={styles.adjustContainer}>
                        <TouchableOpacity
                            onPress={subtractTenMinutes}
                            style={[
                                styles.adjustButton,
                                (!canSubtractTime() || isRunning) && styles.disabledButton
                            ]}
                            disabled={!canSubtractTime() || isRunning}
                        >
                            <Text style={styles.adjustButtonText}>-10분</Text>
                        </TouchableOpacity>

                        {/* 시작/정지 버튼 */}
                        <TouchableOpacity
                            onPress={handleToggleRunning}
                            style={styles.playPauseButton}
                        >
                            <Text style={styles.playPauseButtonText}>
                                {isRunning ? '일시정지' : '시작'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={addTenMinutes}
                            style={[styles.adjustButton, isRunning && styles.disabledButton]}
                            disabled={isRunning}
                        >
                            <Text style={styles.adjustButtonText}>+10분</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* 모달은 그대로 유지 */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>활동 종료</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="활동 내용을 입력하세요"
                            value={sessionDescription}
                            onChangeText={setSessionDescription}
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={handleCancel} style={styles.modalButton}>
                                <Text>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleConfirm} style={styles.modalButton}>
                                <Text>확인</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
