import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import Icon from 'react-native-vector-icons/Ionicons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PomodoroScreen } from "@/pomodoro/pomodoro.screen";
import { TodoList } from '@/components/TodoList';
import { Stopwatch } from '@/components/Stopwatch';

// 책갈피 탭 타입 정의
type BookmarkTab = {
  id: string;
  title: string;
  icon: string;
};

export default function ClockScreen() {
  const colorScheme = useColorScheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState<string>('clock');
  
  // 책갈피 탭 목록
  const bookmarkTabs: BookmarkTab[] = [
    { id: 'clock', title: '시계', icon: 'time-outline' },
    { id: 'todo', title: '할 일', icon: 'checkbox-outline' },
    { id: 'pomodoro', title: '뽀모도로', icon: 'timer-outline' },
    { id: 'stopwatch', title: '스톱워치', icon: 'stopwatch-outline' },
  ];

  // 시계 업데이트를 위한 타이머
  useEffect(() => {
    // 시계 탭이 활성화되어 있을 때만 타이머 실행
    if (activeTab === 'clock') {
      const timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }
  }, [activeTab]);

  // 시간 포맷팅 함수
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // 날짜 포맷팅 함수
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    };
    return date.toLocaleDateString('ko-KR', options);
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'clock':
        return (
          <View style={styles.clockContainer}>
            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
            <Text style={styles.dateText}>{formatDate(currentTime)}</Text>
          </View>
        );
      case 'todo':
        return (
          <View style={styles.todoContainer}>
            <TodoList />
          </View>
        );
      case 'pomodoro':
        return (
          <GestureHandlerRootView style={styles.pomodoroContainer}>
            <PomodoroScreen />
          </GestureHandlerRootView>
        );
      case 'stopwatch':
        return (
          <View style={styles.stopwatchContainer}>
            <Stopwatch />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      {/* 책갈피 탭 */}
      <View style={styles.bookmarkContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bookmarkScroll}
        >
          {bookmarkTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.bookmarkTab,
                activeTab === tab.id && styles.activeBookmarkTab
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon 
                name={tab.icon} 
                size={24} 
                color={activeTab === tab.id ? '#007AFF' : '#888'} 
              />
              <Text 
                style={[
                  styles.bookmarkText,
                  activeTab === tab.id && styles.activeBookmarkText
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* 탭 컨텐츠 */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  bookmarkContainer: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  bookmarkScroll: {
    paddingHorizontal: 15,
  },
  bookmarkTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeBookmarkTab: {
    backgroundColor: '#e6f2ff',
  },
  bookmarkText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#888',
  },
  activeBookmarkText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockContainer: {
    alignItems: 'center',
  },
  timeText: {
    fontSize: 60,
    fontWeight: '300',
    letterSpacing: 2,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 18,
    color: '#666',
  },
  placeholderContainer: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 15,
    fontSize: 16,
    color: '#888',
  },
  pomodoroContainer: {
    flex: 1,
    width: '100%',
  },
  todoContainer: {
    flex: 1,
    width: '100%',
  },
  stopwatchContainer: {
    flex: 1,
    width: '100%',
  },
}); 