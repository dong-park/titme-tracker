import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {MenuActivity, startTracking, stopTracking, switchActivity, updateMenuActivity} from "@/store/activitySlice";
import {
    Platform,
    ScrollView,
    ScrollView as RNScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {useElapsedTime} from "@/components/ElapsedTimeContext";
import Icon from 'react-native-vector-icons/Ionicons';
import {classNames} from "@/utils/classNames";
import {ActivityCard} from "./ActivityCard";
import {useHorizontalScrollHandler} from "@/hooks/useHorizontalScrollHandler";
import {router} from "expo-router";

export function Activities() {
    const activityState = useSelector((state: RootState) => state.activity);
    const defaultActivities = activityState.menu;
    const dispatch = useDispatch();
    const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();
    const [isEditMode, setIsEditMode] = useState(false);

    // 각 활동에 대한 고유 키를 생성하기 위한 상태 추가
    const [renderKey, setRenderKey] = useState(0);

    // 컴포넌트 마운트 시 기존 활동 데이터 업데이트
    useEffect(() => {
        // 기존 활동들에 새 속성 추가
        const updatedMenu = activityState.menu.map(activity => ({
            ...activity,
            pomodoroEnabled: activity.pomodoroEnabled || false,
            todoListEnabled: activity.todoListEnabled || false
        }));

        // 스토어 업데이트
        if (updatedMenu.length > 0) {
            updatedMenu.forEach(activity => {
                dispatch(updateMenuActivity({
                    id: activity.id,
                    name: activity.name,
                    emoji: activity.emoji,
                    pomodoroEnabled: activity.pomodoroEnabled,
                    todoListEnabled: activity.todoListEnabled
                }));
            });
        }
    }, []);

    // 활동을 두 행으로 분할하는 로직 수정
    const organizeActivities = () => {
        const rowOne = [];
        const rowTwo = [];

        // If there are 6 or fewer activities, organize them in two rows
        if (defaultActivities.length <= 6) {
            for (let i = 0; i < defaultActivities.length; i++) {
                if (i < 3) {
                    rowOne.push(defaultActivities[i]);
                } else {
                    rowTwo.push(defaultActivities[i]);
                }
            }
        } else {
            // For more than 6 activities, organize them as specified
            for (let i = 0; i < 6; i++) {
                if (i < 3) {
                    rowOne.push(defaultActivities[i]);
                } else {
                    rowTwo.push(defaultActivities[i]);
                }
            }

            // Starting from the 7th activity, alternate rows
            for (let i = 6; i < defaultActivities.length; i++) {
                if (i % 2 === 0) {
                    rowOne.push(defaultActivities[i]);
                } else {
                    rowTwo.push(defaultActivities[i]);
                }
            }
        }

        return { rowOne, rowTwo };
    };


    const { rowOne, rowTwo } = organizeActivities();

    // 활동 전환 최적화를 위한 함수
    const handleActivityPress = React.useCallback(async (activity: MenuActivity) => {
        console.log('Activity pressed:', activity);
        
        // 이미 트래킹 중인 같은 활동을 다시 누르면 종료
        if (activityState.isTracking && activityState.trackingActivity?.description === activity.name) {
            dispatch(stopTracking());
            setLocalElapsedTime(0);
            return;
        }

        const currentStartTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
        
        // 타이머 확실하게 초기화
        setLocalElapsedTime(0);
        localElapsedTimeRef.current = 0;

        // 트래킹 상태 전환
        if (activityState.isTracking) {
            // 새로운 switchActivity 액션 사용 - 중간 상태 없이 바로 전환
            dispatch(switchActivity({
                startTime: currentStartTime,
                description: activity.name,
                emoji: activity.emoji,
            }));
            
            // 타이머 컴포넌트 동기화를 위해 약간의 지연 후 다시 한번 초기화
            setTimeout(() => {
                setLocalElapsedTime(0);
            }, 50);
        } else {
            // 트래킹 중이 아니면 일반 시작 액션 사용
            dispatch(startTracking({
                startTime: currentStartTime,
                description: activity.name,
                emoji: activity.emoji,
                elapsedTime: 0,  // 명시적으로 0 설정
            }));
        }
    }, [activityState.isTracking, activityState.trackingActivity, dispatch, setLocalElapsedTime, localElapsedTimeRef]);

    const toggleEditMode = () => {
        // 수정 모드 전환 시 컴포넌트를 강제로 다시 렌더링하여 애니메이션 상태 초기화
        setRenderKey(prev => prev + 1);
        setIsEditMode(!isEditMode);
    };

    const handleAddActivity = () => {
        // 새 활동 추가 로직 구현
        router.push(
            {
                pathname: `/activity/edit`
            }
        )
        // 여기에 새 활동 추가를 위한 모달이나 화면 이동 로직을 추가할 수 있습니다.
    };

    const scrollRef = useRef<RNScrollView>(null);
    const scrollHandlers = useHorizontalScrollHandler(scrollRef);

    return (
        <GestureHandlerRootView
            className="mx-4">
            <View className="flex-row justify-between my-1 items-center">
                <Text className="text-lg font-semibold">내 활동</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity
                        className="py-2 px-3 rounded-lg flex-row items-center"
                        onPress={handleAddActivity}
                    >
                        <Text className="text-[#007AFF] text-base">추가</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="py-2 px-3 rounded-lg flex-row items-center"
                        onPress={toggleEditMode}
                    >
                        <Text className="text-[#007AFF] text-base">
                            {isEditMode ? "완료" : "편집"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className={classNames(
                    Platform.OS === 'web' ? "overflow-scroll" : "",
                )}
                scrollEventThrottle={16}
                contentContainerStyle={{
                    justifyContent: defaultActivities.length <= 6 ? 'center' : 'flex-start', // 6개 이하일 경우 가운데 정렬
                }}
                {...(Platform.OS === 'web' ? scrollHandlers : {})}
            >
                <View className="flex-col">
                    <View className="flex-row">
                        {rowOne.map((activity, index) => (
                            <ActivityCard
                                key={`row1-${activity.id}-${index}-${renderKey}`}
                                activity={activity}
                                onActivityPress={handleActivityPress}
                                isEditMode={isEditMode}
                                isTracking={activityState.isTracking && activityState.trackingActivity?.description === activity.name}
                                anyActivityTracking={activityState.isTracking}
                            />
                        ))}
                    </View>
                    <View className="flex-row">
                        {rowTwo.map((activity, index) => (
                            <ActivityCard
                                key={`row2-${activity.id}-${index}-${renderKey}`}
                                activity={activity}
                                onActivityPress={handleActivityPress}
                                isEditMode={isEditMode}
                                isTracking={activityState.isTracking && activityState.trackingActivity?.description === activity.name}
                                anyActivityTracking={activityState.isTracking}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}
