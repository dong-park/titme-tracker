import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, SafeAreaView, Alert } from 'react-native';
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
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const addTodoRef = useRef<((selectedActivityId?: number) => void) | null>(null);
  const enterDeleteModeRef = useRef<(() => void) | null>(null);
  // 항상 전체보기 모드 (0)로 고정
  const selectedActivityId = 0;

  // 활동 목록 가져오기
  const activities = useSelector((state: RootState) => state.activity.menu);

  // 할일 기능이 활성화된 활동만 필터링
  const activitiesWithTodo = activities.filter((activity: MenuActivity) =>
    activity.todoListEnabled
  );

  // 할일 추가 함수 저장
  const handleSaveAddTodoFunction = useCallback((addTodoFn: (selectedActivityId?: number) => void) => {
    addTodoRef.current = addTodoFn;
  }, []);

  // 삭제 모드 진입 함수 저장
  const handleSaveEnterDeleteModeFunction = useCallback((enterDeleteModeFn: () => void) => {
    enterDeleteModeRef.current = enterDeleteModeFn;
  }, []);

  // 항상 전체보기 모드
  const isShowAllMode = true;

  // 할일 추가 실행
  const handleAddTodo = useCallback(() => {
    // 활동 선택 대화상자 표시
    if (activitiesWithTodo.length === 0) {
      Alert.alert(
        '활동 없음',
        '활성화된 할일 활동이 없습니다. 먼저 활동을 추가해주세요.',
        [
          {
            text: '확인',
            onPress: () => {}
          }
        ]
      );
      return;
    }
    
    // 사용자에게 활동 선택 요청
    Alert.alert(
      '활동 선택',
      '어떤 활동에 할일을 추가할까요?',
      [
        {
          text: '취소',
          style: 'cancel'
        },
        ...activitiesWithTodo.map(activity => ({
          text: `${activity.emoji} ${activity.name}`,
          onPress: () => {
            // 선택한 활동 ID를 직접 TodoList 컴포넌트에 전달
            if (addTodoRef.current) {
              // 할일 추가 함수 호출 시 선택한 활동 ID 전달
              addTodoRef.current(activity.id);
            }
          }
        }))
      ]
    );
  }, [activitiesWithTodo, addTodoRef]);

  // 삭제 모드 진입 실행
  const handleEnterDeleteMode = useCallback(() => {
    if (enterDeleteModeRef.current) {
      enterDeleteModeRef.current();
    }
  }, []);

  // 할일 삭제 상태로 전환
  const handleStartDelete = useCallback((todoId: string) => {
    setPendingDeleteIds(prev => [...prev, todoId]);
  }, []);

  // 할일 삭제 확인
  const handleConfirmDelete = useCallback(() => {
    if (pendingDeleteIds.length === 0) return;
    
    // Redux 상태에서 모든 활동의 할일 가져오기
    const todosByActivity = useSelector((state: RootState) => state.todos.todosByActivity);
    
    // 각 할일 ID에 대해
    pendingDeleteIds.forEach(todoId => {
      // 어떤 활동에 속하는지 확인
      let foundActivityId = null;
      
      // 모든 활동을 순회하며 할일 ID 검색
      for (const activityId in todosByActivity) {
        const todos = todosByActivity[activityId];
        if (todos.some(todo => todo.id === todoId)) {
          foundActivityId = parseInt(activityId);
          break;
        }
      }
      
      // 해당 활동 ID를 찾은 경우 삭제 실행
      if (foundActivityId !== null) {
        dispatch(deleteTodo({
          activityId: foundActivityId,
          todoId
        }));
      }
    });
    
    setPendingDeleteIds([]);
  }, [dispatch, pendingDeleteIds]);

  // 할일 삭제 취소
  const handleCancelDelete = useCallback(() => {
    setPendingDeleteIds([]);
  }, []);

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
              <>
                <TouchableOpacity
                  className="py-2 px-3 rounded-lg flex-row items-center mr-2"
                  onPress={handleEnterDeleteMode}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-2 px-3 rounded-lg flex-row items-center"
                  onPress={handleAddTodo}
                >
                  <Text className="text-[#007AFF] text-base ml-1">추가</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* 할일 목록 */}
        <StyledView className="h-[70vh] py-2">
          <TodoList 
            activityId={selectedActivityId} 
            onAddTodo={handleSaveAddTodoFunction}
            onEnterDeleteMode={handleSaveEnterDeleteModeFunction}
            pendingDeleteIds={pendingDeleteIds}
            onConfirmDelete={handleConfirmDelete}
            onCancelDelete={handleStartDelete}
            showAllActivities={true}
            activitiesWithTodo={activitiesWithTodo}
          />
        </StyledView>
      </StyledView>
    </StyledSafeAreaView>
  );
} 