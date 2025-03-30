import React, {forwardRef, useEffect, useImperativeHandle, useRef, memo} from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';
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

// React.memo로 컴포넌트 감싸기 전에 먼저 기본 구현
const ActivityCardBase = forwardRef<ActivityCardRef, ActivityCardProps>(
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

        // 애니메이션 메모리 누수 방지를 위한 정리 함수
        const cleanupAnimations = () => {
            cancelAnimation(rotation);
            cancelAnimation(progress);
            cancelAnimation(scale);
            cancelAnimation(opacity);
        };

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
                cleanupAnimations();
            };
        }, [isEditMode]);

        // 배경색 계산을 최적화 - useMemo로 변경
        const cardBackgroundColor = React.useMemo(() => {
            return isTracking ? tintColor : (anyActivityTracking ? inactiveColor : backgroundColor);
        }, [isTracking, anyActivityTracking, tintColor, inactiveColor, backgroundColor]);

        // 텍스트 색상 계산 최적화
        const textColor = React.useMemo(() => {
            return isTracking ? 'text-white' : 'text-[#8E8E93]';
        }, [isTracking]);

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

        // 활동 전환 시 버튼 클릭 핸들러 최적화
        const handleButtonPress = React.useCallback(() => {
            resetAnimation();

            if (isEditMode) {
                router.push({
                    pathname: `/activity/edit`,
                    params: { id: activity.id },
                });
            }
        }, [isEditMode, activity.id]);

        // 롱프레스 핸들러 최적화
        const handleLongPress = React.useCallback(() => {
            if (!isEditMode) {
                resetAnimation();
                onActivityPress(activity);
            }
        }, [isEditMode, activity]);

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
                            onPress={handleButtonPress}
                            onLongPress={handleLongPress}
                            style={{ 
                                backgroundColor: cardBackgroundColor,
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
                                className={`text-sm font-medium ${textColor}`} 
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

// 불필요한 리렌더링을 방지하기 위한 props 비교 함수
const arePropsEqual = (prevProps: ActivityCardProps, nextProps: ActivityCardProps) => {
    return (
        prevProps.activity.id === nextProps.activity.id &&
        prevProps.activity.name === nextProps.activity.name &&
        prevProps.activity.emoji === nextProps.activity.emoji &&
        prevProps.isEditMode === nextProps.isEditMode &&
        prevProps.isTracking === nextProps.isTracking &&
        prevProps.anyActivityTracking === nextProps.anyActivityTracking
    );
};

// React.memo로 감싼 최종 컴포넌트 export
export const ActivityCard = memo(ActivityCardBase, arePropsEqual);
