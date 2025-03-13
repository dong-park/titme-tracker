import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {MenuActivity, startTracking, stopTracking, updateMenuActivity} from "@/store/activitySlice";
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

    const handleActivityPress = async (activity: MenuActivity) => {
        console.log('Activity pressed:', activity);
        const currentStartTime = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});

        if (activityState.isTracking) {
            await dispatch(stopTracking());
        }
        
        setLocalElapsedTime(0)
        dispatch(startTracking({
            startTime: currentStartTime,
            description: activity.name,
            emoji: activity.emoji,
            elapsedTime: 0,
        }));
    };

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
                <Text className="text-lg font-bold">내 활동</Text>
                <View className="flex-row">
                    <TouchableOpacity
                        className="py-1.5 rounded-lg flex-row items-center mr-2"
                        onPress={handleAddActivity}
                    >
                        <Icon
                            name="add-circle-outline"
                            size={18}
                            color="black"
                            style={{marginRight: 4}}
                        />
                        <Text className="text-sm">추가</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="py-1.5 rounded-lg flex-row items-center"
                        onPress={toggleEditMode}
                    >
                        <Icon
                            name={isEditMode ? "checkmark" : "pencil"}
                            size={16}
                            color="black"
                            style={{marginRight: 4}}
                        />
                        <Text className="text-sm">{isEditMode ? "완료" : "수정"}</Text>
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
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}
