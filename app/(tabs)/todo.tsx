import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { RootState } from '@/store/store';
import { TodoList } from '@/components/TodoList';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MenuActivity } from '@/store/activitySlice';

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
  
  // 스타일 컴포넌트
  const StyledContainer = ({ children }: { children: React.ReactNode }) => (
    <View style={[
      styles.container, 
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      {children}
    </View>
  );
  
  const StyledHeader = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.header}>
      <Text style={[
        styles.headerText, 
        { color: Colors[colorScheme ?? 'light'].text }
      ]}>
        {children}
      </Text>
    </View>
  );
  
  const ActivityItem = ({ activity, isSelected }: { activity: MenuActivity, isSelected: boolean }) => (
    <TouchableOpacity
      style={[
        styles.activityItem,
        isSelected && { 
          backgroundColor: Colors[colorScheme ?? 'light'].tint,
          borderColor: Colors[colorScheme ?? 'light'].tint,
        }
      ]}
      onPress={() => setSelectedActivityId(activity.id)}
    >
      <Text style={[
        styles.activityName,
        isSelected && { color: '#fff' }
      ]}>
        {activity.emoji} {activity.name}
      </Text>
    </TouchableOpacity>
  );
  
  return (
    <StyledContainer>
      <StyledHeader>할일 목록</StyledHeader>
      
      {activitiesWithTodo.length > 0 ? (
        <>
          {/* 활동 선택 영역 */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activitiesContainer}
          >
            {activitiesWithTodo.map(activity => (
              <ActivityItem 
                key={activity.id} 
                activity={activity} 
                isSelected={activity.id === selectedActivityId} 
              />
            ))}
          </ScrollView>
          
          {/* 선택된 활동의 할일 목록 */}
          {selectedActivity && selectedActivityId && (
            <View style={styles.todoContainer}>
              <TodoList activityId={selectedActivityId} />
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: Colors[colorScheme ?? 'light'].text }]}>
            할일 목록 기능이 활성화된 활동이 없습니다.
          </Text>
          <Text style={[styles.emptySubText, { color: Colors[colorScheme ?? 'light'].text }]}>
            활동 설정에서 할일 목록 기능을 활성화하세요.
          </Text>
          <Pressable
            style={[styles.addButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => router.push({pathname: '/activity/edit'})}
          >
            <Ionicons name="add" size={24} color="white" />
            <Text style={styles.addButtonText}>새 활동 추가하기</Text>
          </Pressable>
        </View>
      )}
    </StyledContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  activitiesContainer: {
    paddingVertical: 10,
  },
  activityItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
  },
  todoContainer: {
    flex: 1,
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 