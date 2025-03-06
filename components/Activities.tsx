import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {MenuActivity, startTracking, stopTracking} from "@/store/activitySlice";
import {PanResponder, Platform, ScrollView, Text, TouchableOpacity, View} from "react-native";
import React, {forwardRef, useImperativeHandle, useRef, useState} from "react";
import Animated, {useAnimatedStyle, useSharedValue, withRepeat, withTiming} from 'react-native-reanimated';
import {GestureHandlerRootView, LongPressGestureHandler, State} from 'react-native-gesture-handler';
import {HandlerStateChangeEvent} from "react-native-gesture-handler/lib/typescript/handlers/gestureHandlerCommon";
import {ScrollView as RNScrollView} from 'react-native';
import {useElapsedTime} from "@/components/ElapsedTimeContext";
import {router} from "expo-router";

export function Activities() {
    const activityState = useSelector((state: RootState) => state.activity);
    const defaultActivities = activityState.menu;
    const rowOneActivities = defaultActivities.filter((_, index) => index % 2 === 0);
    const rowTwoActivities = defaultActivities.filter((_, index) => index % 2 !== 0);
    const dispatch = useDispatch();
    const currentScrollX = useRef(0);
    const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();
    const [isEditMode, setIsEditMode] = useState(false);


    const handleActivityPress = async (activity: MenuActivity) => {
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

    const RenderActivityCard = forwardRef(({activity}: { activity: MenuActivity }, ref) => {
        const progress = useSharedValue(0);
        const scale = useSharedValue(1);
        const opacity = useSharedValue(1);
        const isAnimating = useRef(false);
        const rotation = useSharedValue(0);

        const animatedStyle = useAnimatedStyle(() => ({
            backgroundColor: progress.value >= 1 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(135, 206, 250, 0.4)',
            width: `${progress.value * 100}%`,
            transform: [{scale: scale.value}],
            opacity: opacity.value,
        }));

        const editAnimatedStyle = useAnimatedStyle(() => ({
            transform: [
                {rotate: `${rotation.value}deg`},
            ],
        }));
        const onLongPressStateChange = (event: HandlerStateChangeEvent) => {
            if (event.nativeEvent.state === State.BEGAN) {
                progress.value = withTiming(1, {duration: 500});
                isAnimating.current = true;
            } else if (event.nativeEvent.state === State.END) {
                resetAnimation();
            } else if (event.nativeEvent.state === State.CANCELLED) {
                resetAnimation();
            }

            if (progress.value >= 1) {
                if (!isEditMode) {
                    handleActivityPress(activity);
                }
            }
        };

        const resetAnimation = () => {
            progress.value = 0;
            scale.value = withTiming(1);
            opacity.value = withTiming(1);
            isAnimating.current = false;
        };

        const handlePress = () => {
            resetAnimation();
            handleActivityPress(activity);
        };

        useImperativeHandle(ref, () => ({
            resetAnimation,
        }));

        if (isEditMode) {
            rotation.value = withRepeat(withTiming(3, {duration: 100}), -1, true);
        } else {
            resetAnimation();
        }

        return Platform.OS === 'web' ? (
            // 웹 환경에서는 클릭 이벤트만 사용
            <TouchableOpacity
                className="w-[90px] h-[90px] max-w-[90px] max-h-[90px] m-[5px] rounded-[10px] overflow-hidden"
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Animated.View style={[
                    {
                        zIndex: 1,
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        right: 0,
                        bottom: 0,
                        height: 83,
                        borderRadius: 10,
                    },
                    animatedStyle
                ]}/>
                <View className="z-[2] p-[15px] bg-white items-center rounded-[11px] border-b border-b-[#e5e7eb] shadow-md">
                    <Text className="text-[28px] mb-[2px]" numberOfLines={1}>
                        {activity.emoji}
                    </Text>
                    <Text className="text-base font-semibold" numberOfLines={1}>
                        {activity.name}
                    </Text>
                </View>
            </TouchableOpacity>
        ) : (
            <LongPressGestureHandler
                onHandlerStateChange={onLongPressStateChange}
                minDurationMs={500}
            >
                <View>
                    <Animated.View style={[
                        { width: 90, height: 90, maxWidth: 90, maxHeight: 90, margin: 5, borderRadius: 10, overflow: 'hidden' },
                        editAnimatedStyle
                    ]}>
                        {!isEditMode && <Animated.View style={[
                            {
                                zIndex: 1,
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                right: 0,
                                bottom: 0,
                                height: 83,
                                borderRadius: 10,
                            },
                            animatedStyle
                        ]}/>}
                        <TouchableOpacity
                            onPress={() => {
                                resetAnimation()

                                if (isEditMode) {
                                    router.push(
                                        {
                                            pathname: `/activity/edit`,
                                            params: {id: activity.id},
                                        }
                                    )
                                }
                            }}
                            className="z-[2] p-[15px] bg-white items-center rounded-[11px] border-b border-b-[#e5e7eb] shadow-md"
                        >
                            <Text className="text-[28px] mb-[2px]" numberOfLines={1}>{activity.emoji}</Text>
                            <Text className="text-base font-semibold" numberOfLines={1}>{activity.name}</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </LongPressGestureHandler>
        );
    });

    // ref 타입 정의
    const rowOneRefs = rowOneActivities.map(() => useRef<{ resetAnimation: () => void }>(null));
    const rowTwoRefs = rowTwoActivities.map(() => useRef<{ resetAnimation: () => void }>(null));

    const handleScrollBegin = () => {
        rowOneRefs.concat(rowTwoRefs).forEach(ref => {
            if (ref.current?.resetAnimation) {
                ref.current.resetAnimation();
            }
        });
    };

    // ScrollView 타입을 명시적으로 설정
    const scrollRef = useRef<RNScrollView>(null);
    // PanResponder 설정에서 scrollRef.current를 직접 사용
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy); // 수평 이동 감지
            },
            onPanResponderGrant: () => {
                // PanResponder가 시작될 때 현재 스크롤 위치를 저장
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({x: currentScrollX.current, animated: false});
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (scrollRef.current) {
                    // 기존 스크롤 위치에 드래그 거리 더하기
                    const newScrollPosition = currentScrollX.current - gestureState.dx;
                    scrollRef.current.scrollTo({
                        x: newScrollPosition,
                        animated: false,
                    });
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // 드래그가 끝난 후 현재 스크롤 위치 업데이트
                currentScrollX.current -= gestureState.dx;
            },
        })
    ).current;

    return (
        <GestureHandlerRootView>
            <View className="flex-row justify-between mx-4 my-1 items-center">
                <Text className="text-lg font-bold">Activities</Text>
                <View>
                    <TouchableOpacity
                        className="px-3 py-1.5 bg-[#007BFF] rounded-lg"
                        onPress={() => setIsEditMode(!isEditMode)}
                    >
                        <Text className="text-white text-sm">{isEditMode ? "Done" : "Edit"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                className={Platform.OS === 'web' ? "overflow-scroll" : ""}
                contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center' }}
                onScrollBeginDrag={handleScrollBegin}
                scrollEventThrottle={16}
                {...(Platform.OS === 'web' ? panResponder.panHandlers : {})} // 웹 환경에서만 panHandlers 적용
            >
                <View className="flex-col">
                    <View className="flex-row mb-[5px]">
                        {rowOneActivities.map((activity, index) => (
                            <RenderActivityCard key={index} ref={rowOneRefs[index]} activity={activity}/>
                        ))}
                    </View>
                    <View className="flex-row mb-[5px]">
                        {rowTwoActivities.map((activity, index) => (
                            <RenderActivityCard key={index} ref={rowTwoRefs[index]} activity={activity}/>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}
