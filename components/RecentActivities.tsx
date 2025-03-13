import {GestureHandlerRootView} from "react-native-gesture-handler";
import { Swipeable } from 'react-native-gesture-handler';
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {ScrollView, Text, View} from "react-native";
import React, {useEffect, useState} from "react";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface GroupedActivity {
    emoji: string;
    tag: string;
    count: number;
    totalTime: number;
    focusSessionCount: number;
}

export function RecentHistory() {
    const activityState = useSelector((state: RootState) => state.activity);
    const [groupedActivities, setGroupedActivities] = useState<GroupedActivity[]>([]);

    useEffect(() => {
        const today = new Date().setHours(0, 0, 0, 0);
        const todayActivities = activityState.activities.filter(activity => {
            const activityDate = new Date(activity.startDate).setHours(0, 0, 0, 0);
            return activityDate === today;
        });

        const grouped = todayActivities.reduce((acc: { [key: string]: GroupedActivity }, curr) => {
            const key = `${curr.tag}-${curr.emoji}`;

            if (!acc[key]) {
                acc[key] = {
                    emoji: curr.emoji,
                    tag: curr.tag,
                    count: 0,
                    totalTime: 0,
                    focusSessionCount: 0
                };
            }

            acc[key].count += 1;
            acc[key].totalTime += curr.elapsedTime;
            acc[key].focusSessionCount += curr.focusSegments.length;

            return acc;
        }, {});

        setGroupedActivities(Object.values(grouped));
    }, [activityState.activities]);

    return (
        <GestureHandlerRootView className="flex-1 mt-4">
            <View className="flex-row justify-between mx-4 mb-2 items-center">
                <Text className="text-lg font-bold">내 기록</Text>
            </View>
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {groupedActivities.map((activity, index) => (
                    <ActivitySummaryItem key={index} {...activity} />
                ))}
            </ScrollView>
        </GestureHandlerRootView>
    );
}

function ActivitySummaryItem({ emoji, tag, count, totalTime, focusSessionCount }: GroupedActivity) {
    const hasStats = count > 0 || totalTime > 0 || focusSessionCount > 0;

    return (
        <View className="bg-white rounded-xl p-4 mx-4 my-2 shadow-sm">
            <View className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
                <Text className="text-2xl mr-3">{emoji}</Text>
                <Text className="text-lg font-semibold text-gray-800">{tag}</Text>
            </View>

            {hasStats ? (
                <View className="flex-row justify-between items-center flex-nowrap">
                    {count > 0 && (
                        <View className="items-center flex-1 px-2">
                            <View className="flex-row items-center mb-1">
                                <Icon name="clock-time-four" size={24} color="#4A90E2" />
                                <Text className="text-base font-semibold text-gray-800 ml-1">{count}</Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">Sessions</Text>
                        </View>
                    )}

                    {totalTime > 0 && (
                        <View className="items-center flex-1 px-2">
                            <View className="flex-row items-center mb-1">
                                <Icon name="timer-sand" size={24} color="#50C878" />
                                <Text className="text-base font-semibold text-gray-800 ml-1">{formatElapsedTime(totalTime)}</Text>
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">Total Time</Text>
                        </View>
                    )}

                    {focusSessionCount > 0 && (
                        <View className="items-center flex-1 px-2">
                            <View className="flex-row items-center justify-center mb-1">
                                {[...Array(Math.min(focusSessionCount, 5))].map((_, i) => (
                                    <Icon
                                        key={i}
                                        name="circle-slice-8"
                                        size={20}
                                        color="#FF6B6B"
                                        className="mx-0.5"
                                    />
                                ))}
                                {focusSessionCount > 5 && (
                                    <Text className="text-sm text-red-400 font-semibold ml-1">+{focusSessionCount - 5}</Text>
                                )}
                            </View>
                            <Text className="text-xs text-gray-500 mt-1">Focus Sessions</Text>
                        </View>
                    )}
                </View>
            ) : (
                <View className="p-4 items-center justify-center">
                    <Text className="text-gray-400 text-sm">아직 기록된 활동이 없습니다</Text>
                </View>
            )}
        </View>
    );
}

const formatElapsedTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const hrsText = hrs > 0 ? `${hrs}시간 ` : '';
    const minsText = mins > 0 ? `${mins}분 ` : '';
    const secsText = `${secs}초`;

    return `${hrsText}${minsText}${secsText}`;
};
