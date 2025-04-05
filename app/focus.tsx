import { ElapsedTimeProvider, useElapsedTime } from '@/components/ElapsedTimeContext';
import { TodoList } from '@/components/TodoList';
import { PomodoroTimer } from '@/components/timer/PomodoroTimer';
import { TimerUtils } from '@/components/timer/TimerUtils';
import { setElapsedTime as setActivityElapsedTime, stopTracking } from '@/store/activitySlice';
import { resetAll } from '@/store/pomodoroSlice';
import { RootState, store } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { styled } from 'nativewind';
import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Carousel from 'react-native-reanimated-carousel';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { ActivityHeatmap } from '../components/ActivityHeatmap';

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
  const { trackingActivity } = activityState || {};
  const dispatch = useDispatch();
  const isTracking = useSelector((state: RootState) => state.activity?.isTracking);
  const elapsedTime = useSelector((state: RootState) => state.activity?.elapsedTime || 0);
  const {localElapsedTimeRef, setLocalElapsedTime} = useElapsedTime();
  const { initialElapsedTime } = useLocalSearchParams<{ initialElapsedTime: string }>();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const width = Dimensions.get('window').width;
  
  // 타이머 관련 상태
  const [displayedElapsedTime, setDisplayedElapsedTime] = useState(() => {
    // 즉시 계산하여 초기값 설정
    if (initialElapsedTime) {
      return parseInt(initialElapsedTime);
    }
    
    // startDate가 있으면 경과 시간 계산
    if (trackingActivity?.startDate) {
      const elapsed = new Date().getTime() - new Date(trackingActivity.startDate).getTime();
      return Math.floor(elapsed / 1000);
    }
    
    return elapsedTime || 0;
  });
  
  // initialElapsedTime 처리 로직 개선
  useEffect(() => {
    if (initialElapsedTime) {
      const parsedTime = parseInt(initialElapsedTime);
      localElapsedTimeRef.current = parsedTime;
      setDisplayedElapsedTime(parsedTime);
      // 전역 상태도 즉시 업데이트
      dispatch(setActivityElapsedTime(parsedTime));
    } else if (trackingActivity?.startDate) {
      // 시작 시간부터 현재까지 경과 시간 계산
      const elapsed = new Date().getTime() - new Date(trackingActivity.startDate).getTime();
      const seconds = Math.floor(elapsed / 1000);
      localElapsedTimeRef.current = seconds;
      setDisplayedElapsedTime(seconds);
      dispatch(setActivityElapsedTime(seconds));
    }
  }, []);

  const [milestone, setMilestone] = useState("집중 시작!");
  const [lastMilestoneTime, setLastMilestoneTime] = useState(0);
  const timerInterval = useRef<number | NodeJS.Timeout | null>(null);
  const [timerScale] = useState(new Animated.Value(1));
  
  const insets = useSafeAreaInsets(); // 안전 영역 정보 가져오기
  
  // 현재 추적 중인 활동의 ID 찾기
  const currentActivityId = useSelector((state: RootState) => {
    if (!state.activity?.trackingActivity?.description || !state.activity?.trackingActivity?.emoji) return undefined;
    
    const foundActivity = state.activity?.menu.find(
      activity => activity.name === state.activity.trackingActivity?.description && activity.emoji === state.activity.trackingActivity?.emoji
    );
    
    return foundActivity?.id;
  });
  
  // 현재 활동 정보 가져오기
  const currentActivity = useSelector((state: RootState) => {
    if (!currentActivityId || !state.activity) return null;
    return state.activity.menu.find(item => item.id === currentActivityId) || null;
  });
  
  // 경과 시간 포맷팅
  const formatElapsedTime = useCallback((seconds: number) => {
    return TimerUtils.formatElapsedTime(seconds);
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
    return TimerUtils.getMotivationalMessage(trackingActivity?.elapsedTime || 0);
  };
  
  // 마일스톤 메시지 생성 함수
  const getMilestoneMessage = useCallback((seconds: number, lastMilestone: number) => {
    return TimerUtils.getMilestoneMessage(seconds, lastMilestone, milestone, true);
  }, [milestone]);
  
  const handleStopTracking = useCallback(() => {
    if (activityState?.trackingActivity) {
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
  }, [activityState?.trackingActivity, dispatch, localElapsedTimeRef]);
  
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
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(timerScale, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true
          }),
          Animated.timing(timerScale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
          })
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        timerScale.setValue(1);
      };
    } else {
      timerScale.setValue(1);
    }
  }, [isTracking, timerScale]);
  
  if (!trackingActivity || !activityState) {
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
    <StyledView key="overview" className="flex-1 px-4 bg-gradient-to-b from-[#F4F3FF] to-white">
      {/* 타이머 디스플레이 */}
      <StyledView className="bg-white/90 backdrop-blur-xl p-7 rounded-3xl shadow-md -mt-1 mx-2 border border-purple-100">
        <StyledView className="items-center">
          <StyledText className="text-4xl mb-4">{trackingActivity.emoji}</StyledText>
          <StyledText className="text-3xl font-semibold text-gray-800 mb-1">{trackingActivity.description}</StyledText>
        </StyledView>
        
        <StyledView>
          <StyledText className="text-center text-base text-blue-600/90 font-medium px-4">
            {getMotivationalMessage()}
          </StyledText>
          
          <StyledView className="flex-row justify-center items-center mt-2 border-t border-gray-100/80 pt-6">
            <StyledView className="items-center bg-gray-50/50 px-6 py-3 rounded-2xl">
              <StyledText className="text-gray-400 text-sm mb-1">시작 시간</StyledText>
              <StyledText className="text-2xl font-medium text-gray-800">{formatStartTime()}</StyledText>
            </StyledView>
            
            <StyledView className="items-center bg-gray-50/50 px-6 py-3 rounded-2xl">
              <StyledText className="text-gray-400 text-sm mb-1">세션</StyledText>
              <StyledText className="text-2xl font-medium text-gray-800">
                {trackingActivity.focusSegments?.length || 1}
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledView>
      
      {/* 활동 히트맵 */}
      <StyledView className="bg-white/95 backdrop-blur-xl p-5 rounded-3xl shadow-lg mt-5 mx-2 border border-gray-100">
        <StyledText className="text-lg font-semibold text-gray-800 mb-4 px-1">최근 30일 활동</StyledText>
        <ActivityHeatmap activityName={trackingActivity.description} emoji={trackingActivity.emoji} />
      </StyledView>
    </StyledView>,
  ];

  // 뽀모도로 타이머가 활성화된 경우에만 화면 추가
  if (currentActivity?.pomodoroEnabled) {
    screens.push(
      <StyledView key="pomodoro" className="flex-1 px-4">
        <StyledView className="bg-white p-4 rounded-xl shadow-sm mt-4">
          <StyledView className="flex-row items-center mb-4">
            <Ionicons name="timer-outline" size={24} color="#3B82F6" />
            <StyledText className="text-xl font-bold ml-2">뽀모도로 타이머</StyledText>
          </StyledView>
          <PomodoroTimer onClose={() => {}} />
        </StyledView>
      </StyledView>
    );
  }

  // 할일 목록이 활성화된 경우에만 화면 추가
  if (currentActivity?.todoListEnabled && currentActivityId) {
    screens.push(
      <StyledView key="todo" className="flex-1 px-4">
        <StyledView className="bg-white p-4 rounded-xl shadow-sm mt-4">
          <StyledView className="flex-row items-center mb-4">
            <Ionicons name="list-outline" size={24} color="#10B981" />
            <StyledText className="text-xl font-bold ml-2">할 일 목록</StyledText>
          </StyledView>
          <TodoList activityId={currentActivityId} />
        </StyledView>
      </StyledView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StyledSafeAreaView className="flex-1 bg-slate-100" style={{ paddingBottom: 0 }}>
        {screens.length > 1 ? (
          <>
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
              height={Dimensions.get('window').height - 120 - insets.bottom}
              data={screens}
              renderItem={({ item }) => item}
              onSnapToItem={(index: number) => setActiveIndex(index)}
              mode="parallax"
              modeConfig={{
                parallaxScrollingScale: 0.9,
                parallaxScrollingOffset: 50,
              }}
            />
          </>
        ) : (
          // 단일 화면일 때는 직접 렌더링
          <StyledView 
            style={{ 
              height: Dimensions.get('window').height - 120 - insets.bottom,
              width: width,
              transform: [{ scale: 0.9 }], // Carousel의 parallax 효과와 동일한 스케일 적용
              marginTop: 12 // 인디케이터가 없을 때의 상단 여백
            }}
          >
            {screens[0]}
          </StyledView>
        )}

        {/* 하단 탭바 스타일의 버튼 영역 */}
        <StyledView 
          className="bg-[#4B7BF5]"
          style={{ 
            paddingBottom: insets.bottom, // 안전 영역만큼 패딩 추가
          }}
        >
          <StyledView className="flex-row items-center justify-between px-4 py-2">
            <StyledView className="flex-row items-center flex-1">
              <StyledText className="text-lg mr-2">
                {trackingActivity.emoji}
              </StyledText>
              <StyledText className="text-base font-medium text-white mr-2">
                {trackingActivity.description}
              </StyledText>
              <StyledText className="text-base font-bold text-white">
                {formatElapsedTime(displayedElapsedTime)}
              </StyledText>
            </StyledView>
            
            <StyledTouchableOpacity 
              className="p-2 bg-white/20 rounded-full"
              onPress={handleStopTracking}
            >
              <Ionicons name="stop" size={20} color="white" />
            </StyledTouchableOpacity>
          </StyledView>
        </StyledView>
      </StyledSafeAreaView>
    </GestureHandlerRootView>
  );
} 