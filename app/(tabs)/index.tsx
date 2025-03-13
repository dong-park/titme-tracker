import React, { useState, useEffect } from 'react';
import {SafeAreaView, Text, TouchableOpacity, View, ScrollView} from 'react-native';
import {Timer} from "@/components/Timer";
import {Provider, useSelector} from 'react-redux';
import {RootState, store} from '@/store/store'
import {Activities} from "@/components/Activities";
import {RecentHistory} from "@/components/RecentActivities";
import {ElapsedTimeProvider} from "@/components/ElapsedTimeContext";
import { styled } from 'nativewind';

export default function App() {
    return (
        <Provider store={store}>
            <Root/>
        </Provider>
    );
}

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

function Root() {
    const activityState = useSelector((state: RootState) => state.activity);
    
    return (
        <StyledSafeAreaView className="flex-1 bg-slate-100">
            <ElapsedTimeProvider>
                <StyledScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ 
                        flexGrow: 1,
                        paddingBottom: 20
                    }}
                >
                    {activityState.isTracking && (
                        <View className="flex-1">
                            <Timer />
                        </View>
                    )}
                    <Activities/>
                    <RecentHistory/>
                </StyledScrollView>
            </ElapsedTimeProvider>
        </StyledSafeAreaView>
    )
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

function Header() {
    return (
        <View className="flex-row justify-between items-center px-4 py-2">
            <Text className="text-xl font-bold">Time Tracker</Text>
            <TouchableOpacity className="p-2">
                <Text>Settings</Text>
            </TouchableOpacity>
        </View>
    );
}

// 기존 스타일시트는 제거하고 Tailwind 스타일을 대신 사용합니다
