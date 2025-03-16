import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions } from 'react-native';
import { styled } from 'nativewind';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledScrollView = styled(ScrollView);

interface TimeTrackerProps {
    startHour: number; // 시작 시간 (0-24)
    endHour: number;   // 종료 시간 (0-24)
    date: Date;        // 표시할 날짜
}

interface ActivitySegment {
    id: string;
    emoji: string;
    name: string;
    startTime: Date;
    endTime: Date;
    color: string;
}

// 활동 유형별 색상 매핑 (기본값)
const activityColors: Record<string, string> = {
    '📚': '#FFD8B1', // 독서
    '🏃': '#BAFFC9', // 달리기
    '💻': '#A7C7E7', // 코딩
    '🎮': '#C3B1E1', // 게임
    '🍽️': '#FFABAB', // 식사
    '😴': '#D8BFD8', // 수면
    '📝': '#FFFFBA', // 공부
    '🎵': '#AFEEEE', // 음악
    '🧘': '#E6E6FA', // 명상
    '🚶': '#98FB98', // 산책
    // 기본 색상들
    'default1': '#A7C7E7',
    'default2': '#C3B1E1',
    'default3': '#FFABAB',
    'default4': '#BAFFC9',
    'default5': '#FFD8B1',
};

export function TimeTracker({ startHour = 7, endHour = 24, date = new Date() }: TimeTrackerProps) {
    const [segments, setSegments] = useState<ActivitySegment[]>([]);
    const activities = useSelector((state: RootState) => state.activity.activities);
    const menuActivities = useSelector((state: RootState) => state.activity.menu);

    // 날짜 포맷팅
    const formattedDate = format(date, 'yyyy년 MM월 dd일 (EEE)', { locale: ko });

    // 시간 간격 생성 (1시간 단위)
    const hourIntervals = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

    // 활동 데이터 처리
    useEffect(() => {
        // 오늘 날짜의 시작과 끝 설정
        const today = new Date(date);
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 오늘 활동만 필터링
        const todayActivities = activities.filter(activity => {
            const activityDate = new Date(activity.startDate);
            return activityDate >= today && activityDate < tomorrow;
        });

        // 활동을 시간 세그먼트로 변환
        const activitySegments = todayActivities.map(activity => {
            const startTime = new Date(activity.startDate);

            // 종료 시간 계산 (종료 시간이 없으면 활동 시간만큼 추가)
            let endTime;
            if (activity.endDate) {
                endTime = new Date(activity.endDate);
            } else {
                endTime = new Date(startTime);
                endTime.setSeconds(endTime.getSeconds() + activity.elapsedTime);
            }

            // 활동 색상 결정 (우선순위: 활동 자체 색상 > 메뉴 활동 색상 > 이모지 기반 색상 > 기본 색상)
            let color = activity.color;

            if (!color) {
                // 메뉴에서 해당 활동 찾기
                const menuActivity = menuActivities.find(
                    item => item.name === activity.description && item.emoji === activity.emoji
                );

                if (menuActivity?.color) {
                    color = menuActivity.color;
                } else if (activityColors[activity.emoji]) {
                    color = activityColors[activity.emoji];
                } else {
                    // 기본 색상 중 하나 선택
                    color = activityColors[`default${Math.floor(Math.random() * 5) + 1}`];
                }
            }

            return {
                id: activity.index.toString(),
                emoji: activity.emoji,
                name: activity.description,
                startTime,
                endTime,
                color
            };
        });

        setSegments(activitySegments);
    }, [activities, menuActivities, date]);

    // 특정 시간대에 있는 활동 찾기
    const getActivitiesForHour = (hour: number) => {
        return segments.filter(segment => {
            const segmentStartHour = segment.startTime.getHours();
            const segmentEndHour = segment.endTime.getHours();
            const segmentEndMinutes = segment.endTime.getMinutes();

            // 종료 시간이 정각이면 이전 시간대로 간주
            const adjustedEndHour = segmentEndMinutes === 0 ? segmentEndHour - 1 : segmentEndHour;

            return segmentStartHour <= hour && adjustedEndHour >= hour;
        });
    };

    // 시간 포맷팅 함수
    const formatTime = (hour: number) => {
        return hour < 10 ? `0${hour}` : `${hour}`;
    };

    // 시간대 표시 여부 결정
    const shouldShowHourLabel = (hour: number, index: number) => {
        // 3시간 간격 또는 시작/끝 시간 표시
        return hour % 3 === 0 || hour === startHour || hour === endHour - 1;
    };

    // 모든 시간대를 한 화면에 표시하기 위한 최적 높이 계산
    // 1.5배 정도 늘림
    const timeBlockHeight = Math.min(8, Math.max(6, Math.floor(350 / (endHour - startHour) * 1.5)));

    return (
        <StyledView className="mx-4 mt-4">
            <StyledView className="flex-row justify-between items-center mb-2">
                <StyledText className="text-lg font-bold">오늘의 활동 기록</StyledText>
                <StyledText className="text-sm text-gray-500">{formattedDate}</StyledText>
            </StyledView>
            
            <StyledView className=" bg-white rounded-xl shadow-sm p-4">
                {/* 시간별 활동 표시 - 크기 조정 */}
                <StyledView className="mb-2">
                    {hourIntervals.map((hour, idx) => (
                        <StyledView key={hour} className="flex-row items-center" style={{ marginBottom: idx < hourIntervals.length - 1 ? 2 : 0 }}>
                            {/* 시간 레이블 */}
                            <StyledText className="w-6 text-xs text-gray-500 mr-2">
                                {formatTime(hour)}
                            </StyledText>

                            {/* 활동 바 컨테이너 */}
                            <StyledView
                                className="flex-1 bg-gray-100 rounded-md relative"
                                style={{ height: timeBlockHeight }}
                            >
                                {getActivitiesForHour(hour).map((segment, index) => {
                                    // 해당 시간대 내에서의 시작 위치와 길이 계산
                                    let startPos = 0;
                                    let widthPercent = 100;

                                    // 시작 시간이 현재 시간대보다 늦으면 위치 조정
                                    if (segment.startTime.getHours() === hour) {
                                        startPos = (segment.startTime.getMinutes() / 60) * 100;
                                    }

                                    // 종료 시간이 다음 시간대보다 빠르면 길이 조정
                                    if (segment.endTime.getHours() === hour) {
                                        widthPercent = (segment.endTime.getMinutes() / 60) * 100;
                                    } else if (segment.endTime.getHours() > hour) {
                                        widthPercent = 100;
                                    }

                                    // 최종 길이 계산 (종료 - 시작)
                                    const finalWidth = widthPercent - startPos;

                                    return (
                                        <StyledView
                                            key={`${hour}-${index}`}
                                            className="absolute h-full rounded-md"
                                            style={{
                                                left: `${startPos}%`,
                                                width: `${finalWidth}%`,
                                                backgroundColor: segment.color,
                                                zIndex: index + 1,
                                            }}
                                        />
                                    );
                                })}
                            </StyledView>
                        </StyledView>
                    ))}
                </StyledView>

                {/* 활동 범례 */}
                <StyledView className="flex-row flex-wrap mt-2 pt-2 border-t border-gray-100">
                    {segments.length > 0 ? (
                        // 중복 제거하여 유니크한 활동만 표시
                        Array.from(new Set(segments.map(s => s.name))).map((name, idx) => {
                            const segment = segments.find(s => s.name === name);
                            if (!segment) return null;

                            return (
                                <StyledView key={idx} className="flex-row items-center mr-4 mb-1">
                                    <StyledView
                                        className="w-3 h-3 rounded-full mr-1"
                                        style={{ backgroundColor: segment.color }}
                                    />
                                    <StyledText className="text-xs mr-1">{segment.emoji}</StyledText>
                                    <StyledText className="text-xs text-gray-700">{segment.name}</StyledText>
                                </StyledView>
                            );
                        })
                    ) : (
                        <StyledText className="text-xs text-gray-400 italic">기록된 활동이 없습니다</StyledText>
                    )}
                </StyledView>
            </StyledView>
        </StyledView>

    );
} 