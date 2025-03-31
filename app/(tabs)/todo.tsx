import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { styled } from 'nativewind';

import { RootState } from '@/store/store';
import { TodoList } from '@/components/TodoList';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MenuActivity } from '@/store/activitySlice';
import { deleteTodo } from '@/store/todoSlice';

// 스타일드 컴포넌트 생성
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);

export default function TodoScreen() {
  const colorScheme = useColorScheme();
  const dispatch = useDispatch();
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const addTodoRef = useRef<(() => void) | null>(null);

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

  // 할일 추가 함수 저장
  const handleSaveAddTodoFunction = useCallback((addTodoFn: () => void) => {
    addTodoRef.current = addTodoFn;
  }, []);

  // 할일 추가 실행
  const handleAddTodo = useCallback(() => {
    if (addTodoRef.current) {
      addTodoRef.current();
    }
  }, []);

  // 할일 삭제 상태로 전환
  const handleStartDelete = useCallback((todoId: string) => {
    setPendingDeleteIds(prev => [...prev, todoId]);
  }, []);

  // 할일 삭제 확인
  const handleConfirmDelete = useCallback(() => {
    if (!selectedActivityId) return;
    
    pendingDeleteIds.forEach(todoId => {
      dispatch(deleteTodo({
        activityId: selectedActivityId,
        todoId
      }));
    });
    setPendingDeleteIds([]);
  }, [dispatch, pendingDeleteIds, selectedActivityId]);

  // 할일 삭제 취소
  const handleCancelDelete = useCallback(() => {
    setPendingDeleteIds([]);
  }, []);

  const ActivityItem = ({ activity, isSelected }: { activity: MenuActivity, isSelected: boolean }) => (
    <StyledTouchableOpacity
      className={`px-3 py-2 rounded-lg mr-2 
      ${isSelected 
        ? `bg-blue-500 shadow-sm`
        : 'bg-white/80 border border-gray-200'
      }`}
      onPress={() => setSelectedActivityId(activity.id)}
    >
      <StyledText 
        className={`text-sm font-medium 
        ${isSelected 
          ? 'text-white' 
          : 'text-gray-700'
        }`}
      >
        {activity.emoji} {activity.name}
      </StyledText>
    </StyledTouchableOpacity>
  );

  return (
    <StyledSafeAreaView className="flex-1 bg-slate-100">
      <StyledView className="mx-4">
        <View className="flex-row justify-between my-1 items-center">
          <Text className="text-lg font-semibold">할일</Text>
          <View className="flex-row items-center">
            {pendingDeleteIds.length > 0 ? (
              <>
                <TouchableOpacity
                  className="py-2 px-3 rounded-lg flex-row items-center mr-2"
                  onPress={handleConfirmDelete}
                >
                  <Ionicons name="trash" size={20} color="#FF3B30" />
                  <Text className="text-[#FF3B30] text-base ml-1">삭제</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-2 px-3 rounded-lg flex-row items-center"
                  onPress={handleCancelDelete}
                >
                  <Text className="text-gray-500 text-base">취소</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                className="py-2 px-3 rounded-lg flex-row items-center"
                onPress={handleAddTodo}
              >
                <Text className="text-[#007AFF] text-base ml-1">추가</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

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
              <TodoList 
                activityId={selectedActivityId} 
                onAddTodo={handleSaveAddTodoFunction}
                pendingDeleteIds={pendingDeleteIds}
                onConfirmDelete={handleConfirmDelete}
                onCancelDelete={handleStartDelete}
              />
            </StyledView>
          )}
        </>
      </StyledView>
    </StyledSafeAreaView>
  );
} 