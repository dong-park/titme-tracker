import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    FlatList,
} from "react-native";
import {
    format,
    addDays,
    subDays,
    parseISO,
    differenceInCalendarDays,
} from "date-fns";

/** =============== 타임 블록(하루 내) 설정 =============== */
const HOUR_BLOCK_HEIGHT = 50;
const CHUNK_SIZE = 6; // 6시간 단위
const NUM_CHUNKS = 24 / CHUNK_SIZE; // 하루를 4개 Chunk로 분할
const BUFFER_CHUNKS = 1; // Chunk 가상화 시 버퍼

/** =============== 무한 스크롤 관련 설정 =============== */
const INITIAL_RANGE = 3; // 오늘 ±3일 → 초기 7일
const BATCH_SIZE = 2;    // 스크롤시마다 2일씩 추가
const MAX_RANGE = 14;    // ±14일 이상이면 제거

/** =============== 타입 정의 =============== */
interface DayInfo {
    dateString: string; // "2024-01-10"
    label: string;      // "Wed" 등
}

interface Activity {
    id: string;
    title: string;
    color?: string;
    startTime: string; // "2024-01-10 09:30"
    endTime: string;   // "2024-01-10 10:45"
}

interface DayData {
    dayInfo: DayInfo;         // 날짜 정보
    activities: Activity[];   // 해당 날짜의 활동(일정)
}

/** =============== 최상위 WeekView (무한 스크롤 + Chunk 가상화) =============== */
export default function WeekView() {
    const [daysData, setDaysData] = useState<DayData[]>(() =>
        generateInitialDays(INITIAL_RANGE)
    );

    /** ========== 무한 스크롤: 아래쪽 끝 도달 시 미래 날짜 로딩 ========== */
    function loadMoreFuture() {
        if (daysData.length === 0) return;

        const lastItem = daysData[daysData.length - 1];
        const lastDate = parseISO(lastItem.dayInfo.dateString);

        const newDays: DayData[] = [];
        for (let i = 1; i <= BATCH_SIZE; i++) {
            const futureDate = addDays(lastDate, i);
            newDays.push(generateDayData(futureDate));
        }

        const merged = [...daysData, ...newDays];
        setDaysData(limitRange(merged)); // ±14일 이내만 유지
    }

    /** ========== 무한 스크롤: 위쪽 끝 → 과거 날짜 로딩 ========== */
    function loadMorePast() {

        if (daysData.length === 0) return;

        const firstItem = daysData[0];
        const firstDate = parseISO(firstItem.dayInfo.dateString);

        const newDays: DayData[] = [];
        for (let i = 1; i <= BATCH_SIZE; i++) {
            const pastDate = subDays(firstDate, i);
            newDays.push(generateDayData(pastDate));
        }

        const merged = [...newDays, ...daysData];
        setDaysData(limitRange(merged)); // ±14일 이내만 유지
    }

    /** ========== 렌더 ========== */
    return (
        <FlatList
            data={daysData}
            keyExtractor={(item) => item.dayInfo.dateString}
            renderItem={({ item }) => (
                <ActivityDayView dayInfo={item.dayInfo} activities={item.activities} />
            )}
            // 하단 스크롤
            onEndReached={loadMoreFuture}
            onEndReachedThreshold={0.5}
            // 상단 스크롤 감지: FlatList에서 직접은 어려워서 onScroll offset 확인
            ListHeaderComponent={
                <View style={{ height: 50 }}>
                    {/* 유저가 스크롤 당기면 offsetY 음수 → loadMorePast() */}
                </View>
            }
            onScroll={(e) => {
                const offsetY = e.nativeEvent.contentOffset.y;
                console.log(offsetY)
                if (offsetY < -50) {
                    loadMorePast();
                }
            }}
            scrollEventThrottle={16}
        />
    );
}

/** =============== ActivityDayView: '하루' 단위로 Chunk(6시간) 가상화 =============== */
function ActivityDayView({
                             dayInfo,
                             activities,
                         }: {
    dayInfo: DayInfo;
    activities: Activity[];
}) {
    const [visibleChunks, setVisibleChunks] = useState<number[]>([]);

    const chunkHeight = CHUNK_SIZE * HOUR_BLOCK_HEIGHT; // 6시간 chunk 높이
    const totalDayHeight = 24 * HOUR_BLOCK_HEIGHT;

    function onDayScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
        const scrollY = e.nativeEvent.contentOffset.y;
        const currentChunkIndex = Math.floor(scrollY / chunkHeight);

        const newVisible: number[] = [];
        for (
            let i = currentChunkIndex - BUFFER_CHUNKS;
            i <= currentChunkIndex + BUFFER_CHUNKS;
            i++
        ) {
            if (i >= 0 && i < NUM_CHUNKS) {
                newVisible.push(i);
            }
        }
        setVisibleChunks(newVisible);
    }

    return (
        <View style={styles.dayContainer}>
            {/* 날짜 헤더 */}
            <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderLabel}>{dayInfo.label}</Text>
                <Text style={styles.dayHeaderLabel}>{dayInfo.dateString}</Text>
            </View>

            {/* 내부 스크롤(24h) -> 6시간씩 가상화 */}
            <ScrollView
                style={{ height: totalDayHeight }}
                onScroll={onDayScroll}
                scrollEventThrottle={16}
            >
                <View style={[styles.absoluteWrapper, { height: totalDayHeight }]}>
                    {Array.from({ length: NUM_CHUNKS }, (_, i) => i).map((chunkIndex) => {
                        if (!visibleChunks.includes(chunkIndex)) return null;
                        return (
                            <TimeChunkView
                                key={chunkIndex}
                                chunkIndex={chunkIndex}
                                dayInfo={dayInfo}
                                activities={activities}
                            />
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

/** =============== TimeChunkView: 6시간 단위 =============== */
function TimeChunkView({
                           chunkIndex,
                           dayInfo,
                           activities,
                       }: {
    chunkIndex: number;
    dayInfo: DayInfo;
    activities: Activity[];
}) {
    const chunkStartHour = chunkIndex * CHUNK_SIZE; // 0,6,12,18
    const chunkEndHour = chunkStartHour + CHUNK_SIZE;
    const chunkTop = chunkStartHour * HOUR_BLOCK_HEIGHT;
    const chunkHeight = CHUNK_SIZE * HOUR_BLOCK_HEIGHT;

    // 시간 슬롯 (ex. 6~7,7~8,...)
    const hoursInChunk = Array.from(
        { length: CHUNK_SIZE },
        (_, i) => chunkStartHour + i
    );

    // 해당 청크에 겹치는 액티비티 필터
    const chunkActivities = activities.filter((act) =>
        isActivityOverlapChunk(act, dayInfo.dateString, chunkStartHour, chunkEndHour)
    );

    return (
        <View
            style={[
                styles.chunkContainer,
                { top: chunkTop, height: chunkHeight },
            ]}
        >
            {hoursInChunk.map((h) => (
                <View key={h} style={styles.hourSlot}>
                    <Text style={styles.hourText}>
                        {String(h).padStart(2, "0")}:00
                    </Text>
                </View>
            ))}

            {chunkActivities.map((act) => {
                const { top, height } = calculateActivityBlock(act, chunkStartHour);
                return (
                    <View
                        key={act.id}
                        style={[
                            styles.activityBlock,
                            {
                                backgroundColor: act.color || "#ccc",
                                top,
                                height,
                            },
                        ]}
                    >
                        <Text style={styles.activityBlockText}>{act.title}</Text>
                    </View>
                );
            })}
        </View>
    );
}

/** 액티비티가 청크와 Overlap 되는지 */
function isActivityOverlapChunk(
    activity: Activity,
    dateString: string,
    chunkStartHour: number,
    chunkEndHour: number
) {
    if (!activity.startTime.startsWith(dateString)) return false;

    const [sHour, sMin] = parseTime(activity.startTime);
    const [eHour, eMin] = parseTime(activity.endTime);

    const startTotal = sHour * 60 + sMin;
    const endTotal = eHour * 60 + eMin;
    const chunkStart = chunkStartHour * 60;
    const chunkEnd = chunkEndHour * 60;

    return startTotal < chunkEnd && endTotal > chunkStart;
}

/** 액티비티 블록의 위치/높이 계산(분 단위) */
function calculateActivityBlock(
    activity: Activity,
    chunkStartHour: number
) {
    const [sHour, sMin] = parseTime(activity.startTime);
    const [eHour, eMin] = parseTime(activity.endTime);

    const startMin = sHour * 60 + sMin;
    const endMin = eHour * 60 + eMin;

    const chunkStartMin = chunkStartHour * 60;

    const top = ((startMin - chunkStartMin) / 60) * HOUR_BLOCK_HEIGHT;
    const height = ((endMin - startMin) / 60) * HOUR_BLOCK_HEIGHT;

    return { top, height };
}

/** 파싱: "2024-01-10 09:30" -> [9, 30] */
function parseTime(timeStr: string): [number, number] {
    const hh = parseInt(timeStr.slice(11, 13), 10);
    const mm = parseInt(timeStr.slice(14, 16), 10);
    return [hh, mm];
}

/** =============== 초기 데이터 생성 / 유틸 =============== */

/** 오늘을 기준으로 ±range일 → DayData[] */
function generateInitialDays(range: number): DayData[] {
    const today = new Date();
    const output: DayData[] = [];

    for (let i = -range; i <= range; i++) {
        const d = addDays(today, i);
        output.push(generateDayData(d));
    }
    return output;
}

/** 주어진 Date를 DayData로 생성 */
function generateDayData(date: Date): DayData {
    const dayInfo = {
        dateString: format(date, "yyyy-MM-dd"), // ex. "2024-01-10"
        label: format(date, "EEE"),            // ex. "Wed"
    };
    const activities = generateMockActivities(dayInfo.dateString);
    return { dayInfo, activities };
}

/** mock 일정(액티비티) 생성: 실제로는 서버/API에서 해당 날짜 데이터를 fetch */
function generateMockActivities(dateString: string): Activity[] {
    // 간단 예시: 무조건 1~2개 랜덤 생성
    // 실제론 Redux나 DB 연동
    const randomNum = Math.floor(Math.random() * 2) + 1; // 1~2개
    const arr: Activity[] = [];
    for (let i = 0; i < randomNum; i++) {
        const startH = 8 + i * 2; // 8시, 10시 등
        const endH = startH + 1;
        arr.push({
            id: dateString + "-" + i,
            title: `Activity ${i + 1}`,
            startTime: `${dateString} ${String(startH).padStart(2, "0")}:00`,
            endTime: `${dateString} ${String(endH).padStart(2, "0")}:30`,
            color: i % 2 === 0 ? "#fd5c63" : "#6b8ac9",
        });
    }
    return arr;
}

/** ±MAX_RANGE(14일)를 초과하는 날짜 제거 */
function limitRange(list: DayData[]): DayData[] {
    const today = new Date();
    return list.filter((d, index) => {
        const diff = differenceInCalendarDays(parseISO(d.dayInfo.dateString), today);
        console.log(d, index, Math.abs(diff) <= MAX_RANGE, MAX_RANGE);
        return Math.abs(diff) <= MAX_RANGE;
    });
}

/** =============== 스타일 =============== */
const styles = StyleSheet.create({
    dayContainer: {
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    dayHeader: {
        backgroundColor: "#f8f9fb",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    dayHeaderLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#0f172a",
    },
    absoluteWrapper: {
        position: "relative",
    },
    chunkContainer: {
        position: "absolute",
        left: 0,
        right: 0,
    },
    hourSlot: {
        height: HOUR_BLOCK_HEIGHT,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f1f1",
        justifyContent: "center",
        paddingHorizontal: 4,
    },
    hourText: {
        fontSize: 12,
        color: "#64748b",
    },
    activityBlock: {
        position: "absolute",
        left: 10,
        right: 10,
        borderRadius: 4,
        justifyContent: "center",
        padding: 4,
    },
    activityBlockText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },
});
