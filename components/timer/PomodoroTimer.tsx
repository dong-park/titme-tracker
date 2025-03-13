// components/timer/PomodoroTimer.tsx
import React, {useState, useMemo, useEffect} from "react";
import {Text, TextInput, TouchableOpacity, View, Alert, Modal} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {styled} from "nativewind";
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedGestureHandler,
    useSharedValue,
} from 'react-native-reanimated';
import { debounce } from 'lodash';
import Svg, { Line, G } from "react-native-svg";
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
import { addFocusSegment } from "@/store/activitySlice";
import { TimerClock } from "./TimerClock";
import { TimerUtils } from "./TimerUtils";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

interface PomodoroTimerProps {
    onClose: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ onClose }) => {
    const dispatch = useDispatch();
    const pomodoroState = useSelector((state: RootState) => state.pomodoro);
    const activityState = useSelector((state: RootState) => state.activity);

    const { pomodoroDuration, remainingTime, isRunning, colorIndex, cycleCount, currentSegmentDescription } = pomodoroState;

    const [modalVisible, setModalVisible] = useState(false);
    const [sessionDescription, setSessionDescription] = useState("");
    const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>(() => () => {});

    // 제스처 관련 상태
    const rotation = useSharedValue(0);
    const size = 300;
    const radius = size / 2;

    // 포모도로 타이머 효과
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
                    startDate: pomodoroState.currentSegmentStart,
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
    }, [isRunning, remainingTime]);

    // 시계 관련 함수들
    const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
        const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

        return {
            x: centerX + (radius * Math.cos(angleInRadians)),
            y: centerY + (radius * Math.sin(angleInRadians))
        };
    };

    const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
        const start = polarToCartesian(x, y, radius, endAngle);
        const end = polarToCartesian(x, y, radius, startAngle);

        const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

        return [
            "M", start.x, start.y,
            "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(" ");
    };



    // calculateProgress 함수 수정
    const calculateProgress = () => {
        // 현재 설정된 시간을 1시간 기준으로 계산
        const durationProgress = pomodoroDuration / pomodoroState.maxDuration;
        const totalAngle = durationProgress * 360;
        // 남은 시간을 현재 설정된 시간 기준으로 계산
        const remainingProgress = remainingTime / pomodoroState.maxDuration;
        const remainingAngle = remainingProgress * 360;

        return {
            totalAngle,
            remainingAngle,
        };
    };

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

    // 제스처 핸들러 정의
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
        const progress = remainingTime / pomodoroState.maxDuration;
        const angle = progress * 360 - 90; // -90도는 12시 방향을 시작점으로 하기 위함
        const handLength = radius - 80;

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

    // 포모도로 관련 함수들
    const handleToggleRunning = () => {
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

    const canSubtractTime = () => {
        const elapsed = pomodoroDuration - remainingTime;
        return (pomodoroDuration - 600) > elapsed;
    };

    const handleDescriptionChange = (text: string) => {
        dispatch(setCurrentSegmentDescription(text));
    };

    const handleEndSession = async () => {
        dispatch(setRunning(false));

        // 현재 추적 중인 활동이 있는지 확인
        if (!activityState.trackingActivity) {
            dispatch(resetAll()); // 포모도로 타이머 상태만 초기화
            onClose();
            return;
        }

        // 포커스 세그먼트가 있는지 확인
        if (activityState.trackingActivity.focusSegments && activityState.trackingActivity.focusSegments.length === 0) {
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
                                onClose();
                            }
                        }
                    ]
                );
            } else {
                // 타이머가 실행 중이 아니었다면 바로 종료
                dispatch(resetAll()); // 포모도로 타이머 상태만 초기화
                onClose();
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

    const confirmEndSession = () => {
        dispatch(addFocusSegment({
            description: sessionDescription,
            startDate: pomodoroState.currentSegmentStart,
            endDate: new Date().toISOString(),
            elapsedTime: pomodoroState.elapsedTime
        }));

        setModalVisible(false);
        dispatch(resetAll());
        onClose();
    };

    // 시간 형식 함수
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const mm = String(mins).padStart(2, '0');
        const ss = String(secs).padStart(2, '0');
        return `${mm}:${ss}`;
    };

    return (
        <StyledView className="">
            {/* 상단 포커스 카운트 표시 */}
            <StyledView className="flex-row justify-center mb-2">
                {Array(cycleCount).fill(0).map((_, index) => (
                    <StyledView
                        key={index}
                        className="h-3 w-3 rounded-full mx-1"
                        style={{ backgroundColor: ["#FF0000","#FF7F00","#FFFF00","#00FF00","#0000FF","#4B0082","#8F00FF"][index % 7] }}
                    />
                ))}
            </StyledView>

            {/* 메인 타이머 영역 */}
            <StyledView className="items-center">
                <StyledView className="mb-4">
                    <PanGestureHandler onGestureEvent={gestureHandler}>
                        <Animated.View>
                            <TimerClock
                                size={size}
                                radius={radius}
                                progress={calculateProgress()}
                                renderClockMarks={renderClockMarks}
                                renderHourHand={renderHourHand}
                                describeArc={describeArc}
                            />
                        </Animated.View>
                    </PanGestureHandler>
                </StyledView>

                {/* 남은 시간 표시 */}
                <StyledText className="text-3xl font-bold mb-2">
                    {formatTime(remainingTime)}
                </StyledText>

                {/* 집중 내용 입력 */}
                <StyledTextInput
                    className="w-full border border-gray-300 rounded p-2 mb-4"
                    placeholder="집중 내용을 입력하세요"
                    value={currentSegmentDescription}
                    onChangeText={handleDescriptionChange}
                />
            </StyledView>

            {/* 하단 컨트롤 영역 */}
            <StyledView className="flex-row justify-center gap-2 mb-2">
                <StyledTouchableOpacity
                    className="bg-gray-200 px-3 py-2 rounded"
                    onPress={subtractTenMinutes}
                    disabled={!canSubtractTime() || isRunning}
                    style={{ opacity: (!canSubtractTime() || isRunning) ? 0.5 : 1 }}
                >
                    <StyledText>-10분</StyledText>
                </StyledTouchableOpacity>

                <StyledTouchableOpacity
                    className="bg-blue-500 px-6 py-2 rounded"
                    onPress={handleToggleRunning}
                >
                    <StyledText className="text-white font-bold">
                        {isRunning ? '일시정지' : '시작'}
                    </StyledText>
                </StyledTouchableOpacity>

                <StyledTouchableOpacity
                    className="bg-gray-200 px-3 py-2 rounded"
                    onPress={addTenMinutes}
                    disabled={isRunning}
                    style={{ opacity: isRunning ? 0.5 : 1 }}
                >
                    <StyledText>+10분</StyledText>
                </StyledTouchableOpacity>
            </StyledView>

            {/* 모달 */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <StyledView className="flex-1 justify-center items-center bg-black bg-opacity-50">
                    <StyledView className="bg-white p-6 rounded-lg w-10/12">
                        <StyledText className="text-xl font-bold mb-4">활동 종료</StyledText>
                        <StyledTextInput
                            className="border border-gray-300 rounded p-2 mb-4"
                            placeholder="활동 내용을 입력하세요"
                            value={sessionDescription}
                            onChangeText={setSessionDescription}
                        />
                        <StyledView className="flex-row justify-end">
                            <StyledTouchableOpacity
                                className="bg-gray-200 px-4 py-2 rounded mr-2"
                                onPress={handleCancel}
                            >
                                <StyledText>취소</StyledText>
                            </StyledTouchableOpacity>
                            <StyledTouchableOpacity
                                className="bg-blue-500 px-4 py-2 rounded"
                                onPress={handleConfirm}
                            >
                                <StyledText className="text-white">확인</StyledText>
                            </StyledTouchableOpacity>
                        </StyledView>
                    </StyledView>
                </StyledView>
            </Modal>
        </StyledView>
    );
};
