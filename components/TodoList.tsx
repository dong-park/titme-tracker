import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { addTodo, toggleTodo, deleteTodo, TodoItem } from '@/store/todoSlice';
import { createSelector } from '@reduxjs/toolkit';

interface TodoListProps {
  activityId: number;
}

// 메모이제이션된 셀렉터 생성
const selectTodosByActivityId = createSelector(
  [(state: RootState) => state.todos?.todosByActivity, (state: RootState, activityId: number) => activityId],
  (todosByActivity, activityId) => todosByActivity?.[activityId] || []
);

export function TodoList({ activityId }: TodoListProps) {
  const dispatch = useDispatch();
  
  // 메모이제이션된 셀렉터 사용
  const todos = useSelector((state: RootState) => selectTodosByActivityId(state, activityId));
  
  const [newTodo, setNewTodo] = useState('');

  // 새 Todo 추가
  const handleAddTodo = useCallback(() => {
    if (newTodo.trim() === '') return;
    
    dispatch(addTodo({
      activityId,
      text: newTodo.trim()
    }));
    
    setNewTodo('');
  }, [dispatch, activityId, newTodo]);

  // Todo 완료 상태 토글
  const handleToggleTodo = useCallback((todoId: string) => {
    dispatch(toggleTodo({
      activityId,
      todoId
    }));
  }, [dispatch, activityId]);

  // Todo 삭제
  const handleDeleteTodo = useCallback((todoId: string) => {
    dispatch(deleteTodo({
      activityId,
      todoId
    }));
  }, [dispatch, activityId]);

  // Todo 아이템 렌더링
  const renderTodoItem = useCallback((item: TodoItem) => (
    <View style={styles.todoItem} key={item.id}>
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={() => handleToggleTodo(item.id)}
      >
        {item.completed ? (
          <Icon name="checkmark-circle" size={24} color="#4CAF50" />
        ) : (
          <Icon name="ellipse-outline" size={24} color="#888" />
        )}
      </TouchableOpacity>
      
      <Text 
        style={[
          styles.todoText,
          item.completed && styles.completedText
        ]}
      >
        {item.text}
      </Text>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDeleteTodo(item.id)}
      >
        <Icon name="trash-outline" size={20} color="#FF5252" />
      </TouchableOpacity>
    </View>
  ), [handleToggleTodo, handleDeleteTodo]);

  // 투두 아이템 목록 메모이제이션
  const todoItems = useMemo(() => {
    return todos.map(item => renderTodoItem(item));
  }, [todos, renderTodoItem]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>할 일 목록</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="새로운 할 일 추가..."
          value={newTodo}
          onChangeText={setNewTodo}
          onSubmitEditing={handleAddTodo}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddTodo}
        >
          <Icon name="add-circle" size={36} color="#007AFF" />
        </TouchableOpacity>
      </View>
      
      {todos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="list" size={50} color="#ddd" />
          <Text style={styles.emptyText}>할 일이 없습니다</Text>
        </View>
      ) : (
        <ScrollView style={styles.list}>
          {todoItems}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  addButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
    maxHeight: 300, // 최대 높이 제한
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  checkbox: {
    marginRight: 10,
  },
  todoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    padding: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
}); 