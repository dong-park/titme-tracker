import React, {forwardRef, useEffect, useImperativeHandle, useRef} from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { HandlerStateChangeEvent } from "react-native-gesture-handler/lib/typescript/handlers/gestureHandlerCommon";
import { MenuActivity } from "@/store/activitySlice";
import { router } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export interface ActivityCardRef {
    resetAnimation: () => void;
}

interface ActivityCardProps {
    activity: MenuActivity;
    onActivityPress: (activity: MenuActivity) => void;
    isEditMode: boolean;
    isTracking?: boolean;
    anyActivityTracking?: boolean;
}

export const ActivityCard = forwardRef<ActivityCardRef, ActivityCardProps>(
    ({ activity, onActivityPress, isEditMode, isTracking, anyActivityTracking }, ref) => {
        const progress = useSharedValue(0);
        const scale = useSharedValue(1);
        const opacity = useSharedValue(1);
        const isAnimating = useRef(false);
        const rotation = useSharedValue(0);
        const colorScheme = useColorScheme();
        const tintColor = Colors[colorScheme ?? 'light'].tint;
        const backgroundColor = Colors[colorScheme ?? 'light'].background;
        const inactiveColor = '#F2F2F7'; // iOS 기본 회색 배경

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
                            style={{ 
                                // 활성화된 카드는 항상 tintColor, 
                                // 어떤 활동이라도 트래킹 중인 경우 비활성화된 카드는 회색,
                                // 아무것도 트래킹하지 않는 경우 모든 카드는 흰색
                                backgroundColor: isTracking 
                                    ? tintColor 
                                    : (anyActivityTracking ? inactiveColor : backgroundColor),
                                borderRadius: 16,
                                padding: 15,
                                alignItems: 'center',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                                elevation: 2
                            }}
                            className="z-[1]"
                        >
                            <Text className="text-[28px] mb-[5px]" numberOfLines={1}>{activity.emoji}</Text>
                            <Text 
                                className={`text-sm font-medium ${
                                    isTracking ? 'text-white' : 'text-[#8E8E93]'
                                }`} 
                                numberOfLines={1}
                            >
                                {activity.name}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </LongPressGestureHandler>
        );
    }
);
