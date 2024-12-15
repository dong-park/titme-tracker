import {useDispatch, useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {MenuActivity, startTracking, stopTracking} from "@/store/activitySlice";
import {PanResponder, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View} from "react-native";
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
            dispatch(stopTracking());
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
                style={styles.activityButtonContainer}
                onPress={handlePress}
                activeOpacity={0.7}
            >
                <Animated.View style={[styles.animatedBackground, animatedStyle]}/>
                <View style={[styles.activityButton]}>
                    <Text style={styles.activityEmoji} numberOfLines={1}>
                        {activity.emoji}
                    </Text>
                    <Text style={styles.activityText} numberOfLines={1}>
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
                    <Animated.View style={[styles.activityButtonContainer, editAnimatedStyle]}>
                        {!isEditMode && <Animated.View style={[styles.animatedBackground, animatedStyle]}/>}
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
                            style={[styles.activityButton]}
                        >
                            <Text style={styles.activityEmoji} numberOfLines={1}>{activity.emoji}</Text>
                            <Text style={styles.activityText} numberOfLines={1}>{activity.name}</Text>
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
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.titleArea}>
                <Text style={styles.recentTitle}>Activities</Text>
                <View>

                    <TouchableOpacity
                        style={styles.editToggleButton}
                        onPress={() => setIsEditMode(!isEditMode)}
                    >
                        <Text style={styles.editToggleButtonText}>{isEditMode ? "Done" : "Edit"}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.activityButtonsContainer}
                onScrollBeginDrag={handleScrollBegin}
                scrollEventThrottle={16}
                style={[Platform.OS === 'web' ? {overflow: 'scroll'} : {}]}  // 웹에서만 overflow 설정
                {...(Platform.OS === 'web' ? panResponder.panHandlers : {})} // 웹 환경에서만 panHandlers 적용
            >
                <View style={styles.twoRowContainer}>
                    <View style={styles.singleRowContainer}>
                        {rowOneActivities.map((activity, index) => (
                            <RenderActivityCard key={index} ref={rowOneRefs[index]} activity={activity}/>
                        ))}
                    </View>
                    <View style={styles.singleRowContainer}>
                        {rowTwoActivities.map((activity, index) => (
                            <RenderActivityCard key={index} ref={rowTwoRefs[index]} activity={activity}/>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {},
    activityButtonsContainer: {
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    twoRowContainer: {
        flexDirection: 'column',
    },
    singleRowContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    activityButtonContainer: {
        width: 90,
        height: 90,
        maxWidth: 90,
        maxHeight: 90,
        margin: 5,
        borderRadius: 10,
        overflow: 'hidden',
    },
    animatedBackground: {
        zIndex: 1,
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        height: 83,
        borderRadius: 10,
    },
    activityButton: {
        zIndex: 2,
        padding: 15,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        borderRadius: 11,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 5,
    },
    activityEmoji: {
        fontSize: 28,
        marginBottom: 2,
    },
    activityText: {
        fontSize: 16,
        fontWeight: "600",
    },
    titleArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginVertical: 4,
        alignItems: 'center',
    },
    recentTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    editToggleButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#007BFF',
        borderRadius: 8,
    },
    editToggleButtonText: {
        color: '#fff',
        fontSize: 14,
    },
    editIcon: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#d2d2d2',
        width: 26,
        height: 26,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editIconText: {
        fontSize: 12,
    },
});
