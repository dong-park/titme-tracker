import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { HandlerStateChangeEvent } from "react-native-gesture-handler/lib/typescript/handlers/gestureHandlerCommon";
import { MenuActivity } from "@/store/activitySlice";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

export interface ActivityCardRef {
    resetAnimation: () => void;
}

interface ActivityCardProps {
    activity: MenuActivity;
    onActivityPress: (activity: MenuActivity) => void;
    isEditMode: boolean;
    isTracking?: boolean;
}

export const ActivityCard = forwardRef<ActivityCardRef, ActivityCardProps>(
    ({ activity, onActivityPress, isEditMode, isTracking }, ref) => {
        const progress = useSharedValue(0);
        const scale = useSharedValue(1);
        const opacity = useSharedValue(1);
        const isAnimating = useRef(false);
        const rotation = useSharedValue(0);

        useEffect(() => {
            if (isEditMode) {
                // 편집 모드일 때 흔들림 애니메이션 시작
                rotation.value = withRepeat(withTiming(3, { duration: 100 }), -1, true);
            } else {
                // 편집 모드가 아닐 때 애니메이션 초기화
                rotation.value = 0;
                resetAnimation();
            }

            // 컴포넌트가 언마운트될 때 애니메이션 정리
            return () => {
                rotation.value = 0;
            };
        }, [isEditMode]);

        const animatedStyle = useAnimatedStyle(() => ({
            backgroundColor: progress.value >= 1 ? 'rgba(135, 206, 250, 0.6)' : 'rgba(135, 206, 250, 0.4)',
            width: `${progress.value * 100}%`,
            transform: [{ scale: scale.value }],
            opacity: opacity.value,
        }));

        const editAnimatedStyle = useAnimatedStyle(() => ({
            transform: [
                { rotate: `${rotation.value}deg` },
            ],
        }));

        const resetAnimation = () => {
            progress.value = 0;
            scale.value = withTiming(1);
            opacity.value = withTiming(1);
            isAnimating.current = false;
        };

        const handlePress = () => {
            resetAnimation();
            onActivityPress(activity);
        };

        const onLongPressStateChange = (event: HandlerStateChangeEvent) => {
            if (event.nativeEvent.state === State.BEGAN) {
                progress.value = withTiming(1, { duration: 500 });
                isAnimating.current = true;
            } else if (event.nativeEvent.state === State.END && isAnimating.current) {
                if (progress.value >= 1) {
                    if (!isEditMode) {
                        onActivityPress(activity);
                    }
                }
                resetAnimation();
            } else if (event.nativeEvent.state === State.CANCELLED || event.nativeEvent.state === State.FAILED) {
                resetAnimation();
            }
        };

        useImperativeHandle(ref, () => ({
            resetAnimation,
        }));

        return (
            <LongPressGestureHandler
                onHandlerStateChange={onLongPressStateChange}
                minDurationMs={500}
            >
                <View className="mr-2">
                    <Animated.View
                        className={`w-[100px] h-[100px] rounded-[10px] overflow-hidden`}
                        style={editAnimatedStyle}>
                        {!isEditMode && <Animated.View
                            className="z-[2] absolute left-0 top-0 w-[90px] h-[90px] rounded-[10px]"
                            style={animatedStyle}
                        />}
                        <TouchableOpacity
                            onPress={() => {
                                resetAnimation()

                                if (isEditMode) {
                                    router.push(
                                        {
                                            pathname: `/activity/edit`,
                                            params: { id: activity.id },
                                        }
                                    )
                                }
                            }}
                            onLongPress={() => {
                                if (!isEditMode) {
                                    resetAnimation();
                                    onActivityPress(activity);
                                }
                            }}
                            className={`z-[1] p-[15px] items-center rounded-[11px] border-b border-b-[#e5e7eb] ${
                                isTracking 
                                    ? 'bg-[#E3F2FD] shadow-lg' 
                                    : 'bg-white shadow-md'
                            }`}
                        >
                            <Text className="text-[28px] mb-[2px]" numberOfLines={1}>{activity.emoji}</Text>
                            <Text className="text-base font-semibold" numberOfLines={1}>{activity.name}</Text>
                            
                            {/* 기능 아이콘 표시 */}
                            {/* <View className="flex-row mt-1">
                                {activity.pomodoroEnabled && (
                                    <Ionicons name="timer-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                                )}
                                {activity.todoListEnabled && (
                                    <Ionicons name="list-outline" size={14} color="#666" />
                                )}
                            </View> */}
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </LongPressGestureHandler>
        );
    }
);
