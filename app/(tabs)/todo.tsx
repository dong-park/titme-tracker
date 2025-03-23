import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';

import { RootState } from '@/store/store';
import { TodoList } from '@/components/TodoList';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MenuActivity } from '@/store/activitySlice';

// 스타일드 컴포넌트 생성
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  
  // 활동 목록 가져오기
  const activities = useSelector((state: RootState) => state.activity.menu);
  
  // 할일 기능이 활성화된 활동만 필터링
  const activitiesWithTodo = activities.filter((activity: MenuActivity) => 
    activity.todoListEnabled
  );
  
  // 첫 렌더링 시 첫 번째 활동 선택
  useEffect(() => {
    if (activitiesWithTodo.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activitiesWithTodo[0].id);
    }
  }, [activitiesWithTodo, selectedActivityId]);
  
  // 선택된 활동 정보
  const selectedActivity = activities.find((activity: MenuActivity) => activity.id === selectedActivityId);
  
  const ActivityItem = ({ activity, isSelected }: { activity: MenuActivity, isSelected: boolean }) => (
    <StyledTouchableOpacity
      className={`px-3 py-1.5 rounded-full mr-2 border ${
        isSelected 
          ? `bg-[${Colors[colorScheme ?? 'light'].tint}] border-[${Colors[colorScheme ?? 'light'].tint}]` 
          : 'border-gray-300'
      }`}
      onPress={() => setSelectedActivityId(activity.id)}
    >
      <StyledText className={`text-xs font-medium ${isSelected ? 'text-white' : ''}`}>
        {activity.emoji} {activity.name}
      </StyledText>
    </StyledTouchableOpacity>
  );
  
  return (
    <StyledSafeAreaView className={`h-full bg-[${Colors[colorScheme ?? 'light'].background}]`}>
      <StyledView className="px-4">
        <StyledView className="py-2 flex-row justify-between items-center">
          <StyledText className={`text-2xl font-bold text-[${Colors[colorScheme ?? 'light'].text}]`}>
            할일 목록
          </StyledText>
        </StyledView>
        
        {activitiesWithTodo.length > 0 ? (
          <>
            {/* 활동 선택 영역 */}
            <StyledScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="py-2"
            >
              {activitiesWithTodo.map(activity => (
                <ActivityItem 
                  key={activity.id} 
                  activity={activity} 
                  isSelected={activity.id === selectedActivityId} 
                />
              ))}
            </StyledScrollView>
            
            {/* 선택된 활동의 할일 목록 */}
            {selectedActivity && selectedActivityId && (
              <StyledView className="h-[75vh] py-2">
                <TodoList activityId={selectedActivityId} />
              </StyledView>
            )}
          </>
        ) : (
          <StyledView className="h-[80vh] justify-center items-center p-5">
            <StyledText className={`text-lg font-bold text-center mb-2.5 text-[${Colors[colorScheme ?? 'light'].text}]`}>
              할일 목록 기능이 활성화된 활동이 없습니다.
            </StyledText>
            <StyledText className={`text-sm text-center mb-7.5 text-[${Colors[colorScheme ?? 'light'].text}]`}>
              활동 설정에서 할일 목록 기능을 활성화하세요.
            </StyledText>
            <StyledPressable
              className={`flex-row items-center px-5 py-3 rounded-3xl bg-[${Colors[colorScheme ?? 'light'].tint}]`}
              onPress={() => router.push({pathname: '/activity/edit'})}
            >
              <Ionicons name="add" size={24} color="white" />
              <StyledText className="text-white font-bold ml-2">새 활동 추가하기</StyledText>
            </StyledPressable>
          </StyledView>
        )}
      </StyledView>
    </StyledSafeAreaView>
  );
} 