import React from 'react';
import {SafeAreaView, Text, TouchableOpacity, View} from 'react-native';
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

function Root() {
    const activityState = useSelector((state: RootState) => state.activity);

    return (
        <StyledSafeAreaView className="flex-1 bg-slate-100">
            {/*<Header/>*/}
            <ElapsedTimeProvider>
                {activityState.isTracking && <Timer/>}
                <Activities/>
                <RecentHistory/>
            </ElapsedTimeProvider>
        </StyledSafeAreaView>
    )
}

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);

function Header() {
    return (
        <StyledView className="flex-row items-center py-2.5 px-4 justify-between">
            {/*<StyledText className="text-lg"></StyledText>*/}
            <StyledText className="text-lg font-bold text-center flex-1">TimeKeeper</StyledText>
            <StyledTouchableOpacity className="w-6 h-6 justify-center items-center">
                <StyledText className="text-lg">⚙️</StyledText>
            </StyledTouchableOpacity>
        </StyledView>
    )
}

// 기존 스타일시트는 제거하고 Tailwind 스타일을 대신 사용합니다
