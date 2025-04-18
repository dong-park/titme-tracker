import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

const StyledView = styled(View);
const StyledText = styled(Text);

interface ActivityHeatmapProps {
  activityName: string;
  emoji: string;
}

interface DayData {
  date: string;
  count: number;
  minutes: number;
  intensity: number; // 0-4 (없음, 낮음, 중간, 높음, 매우 높음)
}

export function ActivityHeatmap({ activityName, emoji }: ActivityHeatmapProps) {
  const activityState = useSelector((state: RootState) => state.activity);
  const [heatmapData, setHeatmapData] = useState<DayData[]>([]);
  
  useEffect(() => {
    // 최근 30일 데이터 생성
    const today = new Date();
    const last30Days: DayData[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      last30Days.push({
        date: dateString,
        count: 0,
        minutes: 0,
        intensity: 0
      });
    }
    
    // 활동 데이터 필터링
    const filteredActivities = activityState.activities.filter(activity => 
      activity.description === activityName && activity.emoji === emoji
    );
    
    // 날짜별 데이터 집계
    filteredActivities.forEach(activity => {
      const activityDate = new Date(activity.startDate).toISOString().split('T')[0];
      const dayIndex = last30Days.findIndex(day => day.date === activityDate);
      
      if (dayIndex !== -1) {
        last30Days[dayIndex].count += 1;
        last30Days[dayIndex].minutes += Math.floor(activity.elapsedTime / 60);
        
        // 강도 계산 (분 단위 기준)
        const minutes = last30Days[dayIndex].minutes;
        if (minutes === 0) {
          last30Days[dayIndex].intensity = 0;
        } else if (minutes < 30) {
          last30Days[dayIndex].intensity = 1;
        } else if (minutes < 60) {
          last30Days[dayIndex].intensity = 2;
        } else if (minutes < 120) {
          last30Days[dayIndex].intensity = 3;
        } else {
          last30Days[dayIndex].intensity = 4;
        }
      }
    });
    
    setHeatmapData(last30Days);
  }, [activityState.activities, activityName, emoji]);
  
  // 현재 날짜의 요일 구하기
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0: 일요일, 1: 월요일, ...
  
  // 30일 전 날짜의 요일 구하기
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const startDayOfWeek = thirtyDaysAgo.getDay();
  
  // 데이터를 6개의 행으로 그룹화 (5일씩)
  const rowGroups: DayData[][] = [];
  for (let i = 0; i < 6; i++) {
    rowGroups.push(heatmapData.slice(i * 5, (i + 1) * 5));
  }
  
  // 색상 강도에 따른 스타일 클래스
  const getIntensityClass = (intensity: number) => {
    switch (intensity) {
      case 0: return "bg-gray-100";
      case 1: return "bg-green-100";
      case 2: return "bg-green-300";
      case 3: return "bg-green-500";
      case 4: return "bg-green-700";
      default: return "bg-gray-100";
    }
  };
  
  // 총 활동 시간 계산
  const totalMinutes = heatmapData.reduce((sum, day) => sum + day.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  
  // 활동 일수 계산
  const activeDays = heatmapData.filter(day => day.count > 0).length;
  
  return (
    <StyledView className="w-full">
      {/* 요약 정보 */}
      <StyledView className="flex-row justify-between mb-4">
        <StyledView className="items-center">
          <StyledText className="text-sm text-gray-500">총 활동 시간</StyledText>
          <StyledText className="text-lg font-medium">
            {totalHours > 0 ? `${totalHours}시간 ` : ''}
            {remainingMinutes > 0 ? `${remainingMinutes}분` : totalHours > 0 ? '' : '0분'}
          </StyledText>
        </StyledView>
        
        <StyledView className="items-center">
          <StyledText className="text-sm text-gray-500">활동 일수</StyledText>
          <StyledText className="text-lg font-medium">{activeDays}일</StyledText>
        </StyledView>
        
        <StyledView className="items-center">
          <StyledText className="text-sm text-gray-500">평균 시간</StyledText>
          <StyledText className="text-lg font-medium">
            {activeDays > 0 
              ? `${Math.floor(totalMinutes / activeDays)}분` 
              : '0분'}
          </StyledText>
        </StyledView>
      </StyledView>
      
      {/* 히트맵 */}
      <StyledView className="flex-row mt-2">
        {/* 히트맵 그리드 */}
        <StyledView className="flex-1">
          {rowGroups.map((group, rowIndex) => (
            <StyledView key={`row-${rowIndex}`} className="flex-row mb-1">
              {group.map((day, dayIndex) => (
                <StyledView 
                  key={`day-${day.date}`} 
                  className={`h-8 flex-1 mx-0.5 rounded-sm ${getIntensityClass(day.intensity)}`}
                />
              ))}
            </StyledView>
          ))}
        </StyledView>
      </StyledView>
      
      {/* 범례 */}
      <StyledView className="flex-row justify-end mt-2 items-center">
        <StyledText className="text-xs text-gray-500 mr-1">적음</StyledText>
        {[0, 1, 2, 3, 4].map(intensity => (
          <StyledView 
            key={`legend-${intensity}`} 
            className={`w-4 h-4 mx-0.5 rounded-sm ${getIntensityClass(intensity)}`} 
          />
        ))}
        <StyledText className="text-xs text-gray-500 ml-1">많음</StyledText>
      </StyledView>
    </StyledView>
  );
} 