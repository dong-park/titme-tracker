import {GestureHandlerRootView} from "react-native-gesture-handler";
import { Swipeable } from 'react-native-gesture-handler';
import {useSelector} from "react-redux";
import {RootState} from "@/store/store";
import {ScrollView, Text, View, TouchableOpacity} from "react-native";
import React, {useEffect, useState} from "react";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';
import { ActivityHeatmap } from './ActivityHeatmap';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);

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
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

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

    const toggleActivitySelection = (activityKey: string) => {
        if (selectedActivity === activityKey) {
            setSelectedActivity(null);
        } else {
            setSelectedActivity(activityKey);
        }
    };

    return (
        <GestureHandlerRootView className="flex-1 mt-4">
            <StyledView className="flex-row justify-between mx-4 mb-2 items-center">
                <StyledText className="text-lg font-bold">내 기록</StyledText>
                <StyledTouchableOpacity>
                    <StyledText className="text-sm text-blue-500">더 보기</StyledText>
                </StyledTouchableOpacity>
            </StyledView>
            <StyledScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
            >
                {/* 최근 14일 활동 요약 */}
                <StyledView className="bg-white rounded-xl p-4 mx-4 my-4 shadow-sm">
                    <StyledView className="flex-row justify-between items-center mb-4">
                        <StyledText className="text-lg font-semibold">최근 14일 활동</StyledText>
                    </StyledView>
                    
                    <StyledView className="flex-row justify-between mb-4">
                        <StyledView className="items-center">
                            <StyledText className="text-3xl font-bold text-blue-500">
                                {activityState.activities.filter(a => {
                                    const date = new Date(a.startDate);
                                    const now = new Date();
                                    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                                    return diff < 14;
                                }).length}
                            </StyledText>
                            <StyledText className="text-xs text-gray-500 mt-1">총 세션</StyledText>
                        </StyledView>
                        
                        <StyledView className="items-center">
                            <StyledText className="text-3xl font-bold text-green-500">
                                {Math.floor(activityState.activities
                                    .filter(a => {
                                        const date = new Date(a.startDate);
                                        const now = new Date();
                                        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                                        return diff < 14;
                                    })
                                    .reduce((sum, a) => sum + a.elapsedTime, 0) / 3600)}
                            </StyledText>
                            <StyledText className="text-xs text-gray-500 mt-1">총 시간(시)</StyledText>
                        </StyledView>
                        
                        <StyledView className="items-center">
                            <StyledText className="text-3xl font-bold text-purple-500">
                                {new Set(activityState.activities
                                    .filter(a => {
                                        const date = new Date(a.startDate);
                                        const now = new Date();
                                        const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                                        return diff < 14;
                                    })
                                    .map(a => new Date(a.startDate).toISOString().split('T')[0])
                                ).size}
                            </StyledText>
                            <StyledText className="text-xs text-gray-500 mt-1">활동 일수</StyledText>
                        </StyledView>
                    </StyledView>
                    
                    {/* 최근 활동 목록 */}
                    <StyledView className="mt-2">
                        {Object.values(activityState.activities
                            .filter(a => {
                                const date = new Date(a.startDate);
                                const now = new Date();
                                const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                                return diff < 14;
                            })
                            .reduce((acc: { [key: string]: { emoji: string, tag: string, count: number, totalTime: number } }, curr) => {
                                const key = `${curr.tag}-${curr.emoji}`;
                                if (!acc[key]) {
                                    acc[key] = { emoji: curr.emoji, tag: curr.tag, count: 0, totalTime: 0 };
                                }
                                acc[key].count += 1;
                                acc[key].totalTime += curr.elapsedTime;
                                return acc;
                            }, {}))
                            .sort((a, b) => b.totalTime - a.totalTime)
                            .slice(0, 3)
                            .map((activity, index) => (
                                <StyledView key={index} className="flex-row justify-between items-center py-2 border-t border-gray-100">
                                    <StyledView className="flex-row items-center">
                                        <StyledText className="text-xl mr-2">{activity.emoji}</StyledText>
                                        <StyledText className="font-medium">{activity.tag}</StyledText>
                                    </StyledView>
                                    <StyledView className="flex-row items-center">
                                        <StyledText className="text-gray-500 mr-2">{activity.count}회</StyledText>
                                        <StyledText className="text-gray-700">{formatElapsedTime(activity.totalTime)}</StyledText>
                                    </StyledView>
                                </StyledView>
                            ))}
                    </StyledView>
                </StyledView>
                
                {groupedActivities.length > 0 ? (
                    groupedActivities.map((activity, index) => (
                        <React.Fragment key={`${activity.emoji}-${activity.tag}-${index}`}>
                            <ActivitySummaryItem 
                                {...activity} 
                                isSelected={selectedActivity === `${activity.emoji}-${activity.tag}`}
                                onPress={() => toggleActivitySelection(`${activity.emoji}-${activity.tag}`)}
                            />
                            
                            {selectedActivity === `${activity.emoji}-${activity.tag}` && (
                                <StyledView className="bg-white mx-4 mb-4 p-4 rounded-b-xl shadow-sm -mt-2 border-t border-gray-100">
                                    <ActivityHeatmap activityName={activity.tag} emoji={activity.emoji} />
                                </StyledView>
                            )}
                        </React.Fragment>
                    ))
                ) : (
                    <StyledView className="bg-white rounded-xl p-6 mx-4 my-2 shadow-sm items-center justify-center">
                        <Ionicons name="calendar-outline" size={40} color="#CBD5E1" />
                        <StyledText className="text-gray-400 mt-2 text-center">
                            오늘 기록된 활동이 없습니다
                        </StyledText>
                    </StyledView>
                )}
                
            </StyledScrollView>
        </GestureHandlerRootView>
    );
}

function ActivitySummaryItem({ emoji, tag, count, totalTime, focusSessionCount, isSelected, onPress }: GroupedActivity & { isSelected?: boolean, onPress?: () => void }) {
    const hasStats = count > 0 || totalTime > 0 || focusSessionCount > 0;

    return (
        <StyledTouchableOpacity 
            className={`bg-white rounded-${isSelected ? 't' : ''}xl p-4 mx-4 ${isSelected ? 'mb-0' : 'my-2'} shadow-sm`}
            onPress={onPress}
        >
            <StyledView className="flex-row items-center mb-4 border-b border-gray-100 pb-3">
                <StyledText className="text-2xl mr-3">{emoji}</StyledText>
                <StyledText className="text-lg font-semibold text-gray-800">{tag}</StyledText>
                <StyledView className="flex-1" />
                <Ionicons 
                    name={isSelected ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                />
            </StyledView>

            {hasStats ? (
                <StyledView className="flex-row justify-between items-center flex-nowrap">
                    {count > 0 && (
                        <StyledView className="items-center flex-1 px-2">
                            <StyledView className="flex-row items-center mb-1">
                                <Icon name="clock-time-four" size={24} color="#4A90E2" />
                                <StyledText className="text-base font-semibold text-gray-800 ml-1">{count}</StyledText>
                            </StyledView>
                            <StyledText className="text-xs text-gray-500 mt-1">세션</StyledText>
                        </StyledView>
                    )}

                    {totalTime > 0 && (
                        <StyledView className="items-center flex-1 px-2">
                            <StyledView className="flex-row items-center mb-1">
                                <Icon name="timer-sand" size={24} color="#50C878" />
                                <StyledText className="text-base font-semibold text-gray-800 ml-1">{formatElapsedTime(totalTime)}</StyledText>
                            </StyledView>
                            <StyledText className="text-xs text-gray-500 mt-1">총 시간</StyledText>
                        </StyledView>
                    )}

                    {focusSessionCount > 0 && (
                        <StyledView className="items-center flex-1 px-2">
                            <StyledView className="flex-row items-center justify-center mb-1">
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
                                    <StyledText className="text-sm text-red-400 font-semibold ml-1">+{focusSessionCount - 5}</StyledText>
                                )}
                            </StyledView>
                            <StyledText className="text-xs text-gray-500 mt-1">집중 세션</StyledText>
                        </StyledView>
                    )}
                </StyledView>
            ) : (
                <StyledView className="p-4 items-center justify-center">
                    <StyledText className="text-gray-400 text-sm">아직 기록된 활동이 없습니다</StyledText>
                </StyledView>
            )}
        </StyledTouchableOpacity>
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
