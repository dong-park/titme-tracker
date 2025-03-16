import React from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';
import { styled } from 'nativewind';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { RecentHistory } from '@/components/RecentActivities';

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledText = styled(Text);
const StyledView = styled(View);

export default function HistoryScreen() {
  return (
    <Provider store={store}>
      <StyledSafeAreaView className="flex-1 bg-slate-100">
        <StyledView className="px-4 py-3">
          <StyledText className="text-2xl font-bold">활동 기록</StyledText>
        </StyledView>
        <StyledScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: 20
          }}
        >
          <RecentHistory />
        </StyledScrollView>
      </StyledSafeAreaView>
    </Provider>
  );
} 