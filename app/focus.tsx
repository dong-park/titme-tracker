import React, { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { SafeAreaView, Text, View, ScrollView, TouchableOpacity, Animated, Vibration, Dimensions } from 'react-native';
import { useSelector, Provider, useDispatch } from 'react-redux';
import { RootState, store } from '@/store/store';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { TodoList } from '@/components/TodoList';
import { PomodoroTimer } from '@/components/timer/PomodoroTimer';
import { ActivityHeatmap } from '../components/ActivityHeatmap';
import { ElapsedTimeProvider, useElapsedTime } from '@/components/ElapsedTimeContext';
import { setElapsedTime as setActivityElapsedTime, stopTracking } from '@/store/activitySlice';
import { resetAll } from '@/store/pomodoroSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledAnimatedView = styled(Animated.View);
const StyledAnimatedText = styled(Animated.Text);

export default function FocusPageWrapper() {
  return (
    <Provider store={store}>
      <Stack.Screen options={{ headerShown: false }} />
      <ElapsedTimeProvider>
        <FocusPage />
      </ElapsedTimeProvider>
    </Provider>
  );
}

function FocusPage() {
  const activityState = useSelector((state: RootState) => state.activity);
  const { trackingActivity } = activityState;
  const dispatch = useDispatch();
  const isTracking = useSelector((state: RootState) => state.activity.isTracking);
  const elapsedTime = useSelector((state: RootState) => state.activity.elapsedTime);
  const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const width = Dimensions.get('window').width;
  
  // 타이머 관련 상태
  const [displayedElapsedTime, setDisplayedElapsedTime] = useState(elapsedTime);
  const [milestone, setMilestone] = useState("집중 시작!");
  const [lastMilestoneTime, setLastMilestoneTime] = useState(0);
  const timerInterval = useRef<number | NodeJS.Timeout | null>(null);
  const [timerScale] = useState(new Animated.Value(1));
  
  const insets = useSafeAreaInsets(); // 안전 영역 정보 가져오기
  
  // 현재 추적 중인 활동의 ID 찾기
  const currentActivityId = useSelector((state: RootState) => {
    if (!trackingActivity?.description || !trackingActivity?.emoji) return undefined;
    
    const foundActivity = state.activity.menu.find(
      activity => activity.name === trackingActivity.description && activity.emoji === trackingActivity.emoji
    );
    
    return foundActivity?.id;
  });
  
  // 현재 활동 정보 가져오기
  const currentActivity = useSelector((state: RootState) => {
    if (!currentActivityId) return null;
    return state.activity.menu.find(item => item.id === currentActivityId) || null;
  });
  
  // 경과 시간 포맷팅
  const formatElapsedTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? `${hrs}시간 ` : ''}${mins > 0 ? `${mins}분 ` : ''}${secs}초`;
  }, []);
  
  // 활동 시작 시간 포맷팅
  const formatStartTime = () => {
    if (!trackingActivity?.startDate) return '';
    
    const date = new Date(trackingActivity.startDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };
  
  // 동기 부여 메시지 생성
  const getMotivationalMessage = () => {
    const elapsedMinutes = Math.floor(trackingActivity?.elapsedTime || 0) / 60;
    
    if (elapsedMinutes < 5) return '집중을 시작했어요! 화이팅!';
    if (elapsedMinutes < 15) return '좋은 출발이에요. 계속 집중해보세요!';
    if (elapsedMinutes < 30) return '훌륭해요! 집중력이 대단합니다.';
    if (elapsedMinutes < 60) return '놀라운 집중력이에요! 절반을 지났어요.';
    if (elapsedMinutes < 90) return '1시간 이상 집중하다니 정말 대단해요!';
    return '믿기지 않는 집중력! 당신은 진정한 프로입니다.';
  };
  
  // 마일스톤 메시지 생성 함수
  const getMilestoneMessage = useCallback((seconds: number, lastMilestone: number) => {
    // 처음 시작할 때
    if (seconds < 60) return "집중 시작!";

    // 마일스톤 달성 시점 (5분, 10분, 15분, 30분, 45분, 1시간, 1시간 30분, 2시간...)
    const minutes = Math.floor(seconds / 60);

    if (minutes === 5 && lastMilestone < 5 * 60) return "5분 달성! 좋은 출발이에요";
    if (minutes === 10 && lastMilestone < 10 * 60) return "10분 달성! 계속 집중하세요";
    if (minutes === 15 && lastMilestone < 15 * 60) return "15분 달성! 잘 하고 있어요";
    if (minutes === 30 && lastMilestone < 30 * 60) return "30분 달성! 대단해요";
    if (minutes === 45 && lastMilestone < 45 * 60) return "45분 달성! 끝까지 화이팅!";

    if (minutes === 60 && lastMilestone < 60 * 60) return "1시간 달성! 놀라운 집중력이에요";
    if (minutes === 90 && lastMilestone < 90 * 60) return "1시간 30분! 정말 대단해요";
    if (minutes === 120 && lastMilestone < 120 * 60) return "2시간 달성! 프로 집중러!";

    // 30분 단위로 계속 마일스톤 제공
    if (minutes % 30 === 0 && lastMilestone < minutes * 60)
      return `${minutes}분 달성! 믿기지 않는 집중력!`;

    // 마일스톤 사이의 메시지
    return milestone; // 기존 메시지 유지
  }, [milestone]);
  
  const handleStopTracking = useCallback(() => {
    if (activityState.trackingActivity) {
      dispatch(stopTracking());
      Vibration.vibrate(500);
      localElapsedTimeRef.current = 0;
      setDisplayedElapsedTime(0);
      setMilestone("집중 시작!");
      setLastMilestoneTime(0);

      // 포모도로 타이머도 초기화
      dispatch(resetAll());
      
      // 메인 화면으로 돌아가기
      router.back();
    }
  }, [activityState.trackingActivity, dispatch, localElapsedTimeRef]);
  
  // 일반 타이머 흐르게하는 useEffect
  useEffect(() => {
    if (isTracking) {
      timerInterval.current = setInterval(() => {
        ++localElapsedTimeRef.current;
        setDisplayedElapsedTime(localElapsedTimeRef.current);

        // 마일스톤 메시지 업데이트
        const newMilestone = getMilestoneMessage(localElapsedTimeRef.current, lastMilestoneTime);
        if (newMilestone !== milestone) {
          setMilestone(newMilestone);
          setLastMilestoneTime(localElapsedTimeRef.current);

          // 새 마일스톤 달성 시 진동 피드백 (선택적)
          Vibration.vibrate(100);

          // 마일스톤 달성 시 애니메이션 효과
          Animated.sequence([
            Animated.timing(timerScale, {toValue: 1.3, duration: 300, useNativeDriver: true}),
            Animated.timing(timerScale, {toValue: 1, duration: 300, useNativeDriver: true}),
          ]).start();
        }
      }, 1000);
    } else if (timerInterval.current !== null) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    return () => {
      if (timerInterval.current !== null) {
        clearInterval(timerInterval.current);
      }
    };
  }, [isTracking, milestone, lastMilestoneTime, getMilestoneMessage, timerScale]);

  useEffect(() => {
    if (isTracking) {
      dispatch(setActivityElapsedTime(localElapsedTimeRef.current));
    }
  }, [isTracking, dispatch, localElapsedTimeRef]);

  useEffect(() => {
    if (isTracking) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(timerScale, {toValue: 1.05, duration: 1000, useNativeDriver: true}),
          Animated.timing(timerScale, {toValue: 1, duration: 1000, useNativeDriver: true}),
        ])
      ).start();
    } else {
      timerScale.setValue(1);
    }
  }, [isTracking, timerScale]);
  
  if (!trackingActivity) {
    return (
      <StyledSafeAreaView className="flex-1 bg-slate-100 items-center justify-center">
        <StyledText className="text-lg text-gray-500">현재 진행 중인 활동이 없습니다</StyledText>
        <StyledTouchableOpacity 
          className="mt-4 bg-blue-500 px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <StyledText className="text-white font-medium">돌아가기</StyledText>
        </StyledTouchableOpacity>
      </StyledSafeAreaView>
    );
  }

  // 캐러셀에 표시할 화면들
  const screens: ReactElement[] = [
    // 첫 번째 콩알: 개요 화면
    <StyledView key="overview" className="flex-1 px-4">
      {/* 타이머 디스플레이 */}
      <StyledView className="bg-white p-5 rounded-xl shadow-sm mt-4">
        <StyledView className="items-center mb-4">
          <StyledText className="text-5xl mb-2">{trackingActivity.emoji}</StyledText>
          <StyledAnimatedText
            className="text-2xl font-bold text-gray-800 text-center"
            style={{transform: [{scale: timerScale}]}}
          >
            {milestone}
          </StyledAnimatedText>
        </StyledView>
        
        <StyledView className="mt-4">
          <StyledText className="text-center text-lg text-blue-600 font-medium">
            {getMotivationalMessage()}
          </StyledText>
          
          <StyledView className="flex-row justify-between mt-6">
            <StyledView className="items-center">
              <StyledText className="text-gray-500 text-sm">시작 시간</StyledText>
              <StyledText className="text-lg font-medium">{formatStartTime()}</StyledText>
            </StyledView>
            
            <StyledView className="items-center">
              <StyledText className="text-gray-500 text-sm">집중 시간</StyledText>
              <StyledText className="text-lg font-medium">
                {formatElapsedTime(displayedElapsedTime)}
              </StyledText>
            </StyledView>
            
            <StyledView className="items-center">
              <StyledText className="text-gray-500 text-sm">세션</StyledText>
              <StyledText className="text-lg font-medium">
                {trackingActivity.focusSegments.length || 1}
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledView>
      
      {/* 활동 히트맵 */}
      <StyledView className="bg-white p-4 rounded-xl shadow-sm mt-6">
        <StyledText className="text-lg font-bold mb-4">최근 14일 활동</StyledText>
        <ActivityHeatmap activityName={trackingActivity.description} emoji={trackingActivity.emoji} />
      </StyledView>
    </StyledView>,
    
    // 두 번째 콩알: 뽀모도로 타이머
    <StyledView key="pomodoro" className="flex-1 px-4">
      {currentActivity?.pomodoroEnabled ? (
        <StyledView className="bg-white p-4 rounded-xl shadow-sm mt-4">
          <StyledView className="flex-row items-center mb-4">
            <Ionicons name="timer-outline" size={24} color="#3B82F6" />
            <StyledText className="text-xl font-bold ml-2">뽀모도로 타이머</StyledText>
          </StyledView>
          <PomodoroTimer onClose={() => {}} />
        </StyledView>
      ) : (
        <StyledView className="flex-1 items-center justify-center">
          <Ionicons name="timer-outline" size={60} color="#CBD5E1" />
          <StyledText className="text-gray-400 mt-4 text-center">
            이 활동에는 뽀모도로 타이머가 활성화되어 있지 않습니다
          </StyledText>
        </StyledView>
      )}
    </StyledView>,
    
    // 세 번째 콩알: 투두 리스트
    <StyledView key="todo" className="flex-1 px-4">
      {currentActivity?.todoListEnabled && currentActivityId ? (
        <StyledView className="bg-white p-4 rounded-xl shadow-sm mt-4">
          <StyledView className="flex-row items-center mb-4">
            <Ionicons name="list-outline" size={24} color="#10B981" />
            <StyledText className="text-xl font-bold ml-2">할 일 목록</StyledText>
          </StyledView>
          <TodoList activityId={currentActivityId} />
        </StyledView>
      ) : (
        <StyledView className="flex-1 items-center justify-center">
          <Ionicons name="list-outline" size={60} color="#CBD5E1" />
          <StyledText className="text-gray-400 mt-4 text-center">
            이 활동에는 할 일 목록이 활성화되어 있지 않습니다
          </StyledText>
        </StyledView>
      )}
    </StyledView>
  ];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledSafeAreaView className="flex-1 bg-slate-100" style={{ paddingBottom: 0 }}>
        {/* <StyledView className="flex-row items-center justify-between px-4 py-3 bg-white shadow-sm">
          <StyledTouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </StyledTouchableOpacity>
          <StyledText className="text-lg font-bold">{trackingActivity.emoji} {trackingActivity.description}</StyledText>
          <StyledTouchableOpacity onPress={handleStopTracking}>
            <Ionicons name="close-outline" size={24} color="#EF4444" />
          </StyledTouchableOpacity>
        </StyledView> */}
        
        {/* 캐러셀 인디케이터 */}
        <StyledView className="flex-row justify-center mt-2 mb-1">
          {screens.map((_, index) => (
            <StyledView 
              key={index} 
              className={`h-2 w-2 rounded-full mx-1 ${activeIndex === index ? 'bg-blue-500' : 'bg-gray-300'}`}
            />
          ))}
        </StyledView>
        
        {/* 캐러셀 */}
        <Carousel
          width={width}
          height={Dimensions.get('window').height - 120 - insets.bottom} // 하단 영역 높이 조정
          data={screens}
          renderItem={({ item }) => item}
          onSnapToItem={(index: number) => setActiveIndex(index)}
          mode="parallax"
          modeConfig={{
            parallaxScrollingScale: 0.9,
            parallaxScrollingOffset: 50,
          }}
        />

        {/* 하단 탭바 스타일의 버튼 영역 - 더 간결하게 */}
        <StyledView 
          className="border-t border-gray-200 bg-white/95 backdrop-blur-lg"
          style={{ 
            paddingBottom: insets.bottom, // 안전 영역만큼 패딩 추가
          }}
        >
          <StyledView className="flex-row justify-between items-center h-14 px-5">
            <StyledTouchableOpacity onPress={() => router.back()}>
              <StyledView className="flex-row items-center">
                <Ionicons name="chevron-back" size={18} color="#007AFF" />
                <StyledText className="text-[#007AFF] font-medium ml-1">뒤로</StyledText>
              </StyledView>
            </StyledTouchableOpacity>

            <StyledView className="flex-1 items-center justify-center">
              <StyledText className="text-base font-semibold text-gray-800">{trackingActivity.emoji}{trackingActivity.description}</StyledText>
            </StyledView>
            
            <StyledTouchableOpacity 
              className="flex-row items-center justify-center bg-[#FF3B30]/10 px-4 py-2 rounded-full" 
              onPress={handleStopTracking}
            >
              <Ionicons name="stop-circle" size={18} color="#FF3B30" />
              <StyledText className="text-[#FF3B30] font-medium ml-1">종료</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledSafeAreaView>
    </GestureHandlerRootView>
  );
} 