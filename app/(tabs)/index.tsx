import React, { useState, useEffect } from 'react';
import {SafeAreaView, Text, TouchableOpacity, View, ScrollView} from 'react-native';
import {Timer} from "@/components/Timer";
import {Provider, useSelector} from 'react-redux';
import {RootState, store} from '@/store/store'
import {Activities} from "@/components/Activities";
import {ElapsedTimeProvider} from "@/components/ElapsedTimeContext";
import { styled } from 'nativewind';
import { TimeTracker } from '@/components/TimeTracker';

export default function App() {
    return (
        <Provider store={store}>
            <Root/>
        </Provider>
    );
}

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);

function Root() {
    const activityState = useSelector((state: RootState) => state.activity);
    
    return (
        <StyledSafeAreaView className="flex-1 bg-slate-100">
            <ElapsedTimeProvider>
                <StyledScrollView
                    showsVerticalScrollIndicator={false}
                >
                    <Activities/>
                    
                    <TimeTracker 
                        startHour={7} 
                        endHour={24} 
                        date={new Date()} 
                    />
                </StyledScrollView>
            </ElapsedTimeProvider>
        </StyledSafeAreaView>
    )
}

const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
