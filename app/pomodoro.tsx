// PomodoroScreen.tsx
import React, {useEffect, useState} from "react";
import {Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View} from "react-native";
import {Provider, useDispatch, useSelector} from "react-redux";
import {useNavigation} from "@react-navigation/native";
import Svg, {Circle, Line, Path} from 'react-native-svg';
import {RootState, store} from "@/store/store";
import {
    setPomodoroDuration,
    setRunning,
    incrementColorIndex,
    incrementCycleCount,
    resetAll,
    tick,
    setElapsedTime,
    setCurrentSegmentDescription, setRemainingTime, resetJustTimer
} from "@/store/pomodoroSlice";
import {
    startTracking,
    stopTracking,
    addFocusSegment,
    Activity,
    ActivityState,
    FocusSegment
} from "@/store/activitySlice";
import {createSelector} from "reselect";

export default function App() {
    return (
        <Provider store={store}>
            <PomodoroScreen />
        </Provider>
    );
}

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

function PomodoroScreen() {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const pomodoroState = useSelector((state: RootState) => state.pomodoro);
    const activityState: ActivityState = useSelector((state: RootState) => state.activity);

    const {pomodoroDuration, remainingTime, isRunning, colorIndex, cycleCount, currentSegmentDescription, currentSegmentStart} = pomodoroState;
    const {activities, trackingActivity, isTracking, elapsedTime} = activityState;

    const [sessionDescription, setSessionDescription] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    const [resolvePromise, setResolvePromise] = useState<(value: boolean) => void>(() => () => {});

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
        dispatch(setPomodoroDuration(Math.max(60, pomodoroDuration - 600)));
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
        dispatch(setPomodoroDuration(inputMin * 60));
        setModalVisible(false);
    };

    const elapsed = pomodoroDuration - remainingTime;
    const progress = pomodoroDuration ? elapsed / pomodoroDuration : 0;
    const angle = progress * 360;
    const size = 200;
    const radius = size / 2;
    const startAngle = -90;
    const endAngle = startAngle + angle;
    const startX = radius + radius * Math.cos((startAngle * Math.PI) / 180);
    const startY = radius + radius * Math.sin((startAngle * Math.PI) / 180);
    const endX = radius + radius * Math.cos((endAngle * Math.PI) / 180);
    const endY = radius + radius * Math.sin((endAngle * Math.PI) / 180);
    const largeArcFlag = angle > 180 ? 1 : 0;
    const arcPath = `M ${radius} ${radius} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
    const handLength = radius * 0.9;
    const handX = radius + handLength * Math.cos((endAngle * Math.PI) / 180);
    const handY = radius + handLength * Math.sin((endAngle * Math.PI) / 180);

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
        dispatch(stopTracking());
        navigation.goBack();
    };

    const handleEndSession = async () => {
        dispatch(setRunning(false));
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

    return (
        <View style={styles.screenContainer}>
            {/* 원형 타이머 영역 */}
            <TouchableOpacity onPress={handleToggleRunning} activeOpacity={0.8}>
                <View style={styles.circleContainer}>
                    <Svg width={size} height={size}>
                        <Circle cx={radius} cy={radius} r={radius} fill="#f0f0f0" />
                        {progress > 0 && (
                            <Path d={arcPath} fill={["#FF0000","#FF7F00","#FFFF00","#00FF00","#0000FF","#4B0082","#8F00FF"][colorIndex]} />
                        )}
                        <Line x1={radius} y1={radius} x2={handX} y2={handY} stroke="#000" strokeWidth={3} strokeLinecap="round" />
                    </Svg>
                </View>
            </TouchableOpacity>

            <View style={styles.bottomContainer}>
                <Text style={styles.remainingTimeText}>{formatTime(elapsed)} / {formatTime(pomodoroDuration)}</Text>
                <Text style={styles.cycleCountText}>총 {cycleCount} 바퀴</Text>
            </View>

            {/* Focus Description Input */}
            <TextInput
                // style={}
                placeholder="집중 내용을 입력하세요"
                value={currentSegmentDescription}
                onChangeText={handleDescriptionChange}
            />

            <View style={styles.adjustContainer}>
                <TouchableOpacity onPress={addTenMinutes} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>+10분</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={subtractTenMinutes} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>-10분</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={setCustomTimeModal} style={styles.adjustButton}>
                    <Text style={styles.adjustButtonText}>직접입력</Text>
                </TouchableOpacity>
            </View>

            <View style={{marginTop: 20}}>
                <TouchableOpacity onPress={handleEndSession} style={styles.endButton}>
                    <Text style={styles.endButtonText}>종료</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
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

            {focusSegments && (
                <View style={styles.sessionListContainer}>
                    <Text style={styles.sessionListTitle}>집중한 세션</Text>
                    <FlatList
                        data={focusSegments}
                        keyExtractor={(item, index) => `focusSegment-${index}`}
                        renderItem={renderSegmentItem}
                        style={{marginTop: 10}}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    circleContainer: {
        marginBottom: 20,
    },
    bottomContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    remainingTimeText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 20
    },
    cycleCountText: {
        fontSize: 16,
        color: '#333',
    },
    adjustContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    adjustButton: {
        backgroundColor: '#eaeaea',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 5
    },
    adjustButtonText: {
        fontSize: 16,
        color: '#333',
    },
    endButton: {
        backgroundColor: '#ff5a5f',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalContainer: {
        backgroundColor: '#fff',
        width: '80%',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 18,
        marginBottom: 10
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        width: '100%',
        padding: 10,
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 16
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%'
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        backgroundColor: '#eaeaea',
        borderRadius: 5,
        marginHorizontal: 5
    },
    sessionListContainer: {
        marginTop: 20,
        width: '80%'
    },
    sessionListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center'
    },
    sessionItem: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 10,
        marginBottom: 10
    },
    sessionText: {
        fontSize: 14,
        color: '#333'
    },
    segmentItem: {
        backgroundColor: "#eaeaea",
        borderRadius: 8,
        padding: 8,
        marginVertical: 5,
    },
    segmentText: {
        fontSize: 12,
        color: "#555",
    },
});
