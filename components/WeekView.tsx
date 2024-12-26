import React, {useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
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

/** =============== 무한 스크롤(범위제한) 관련 설정 =============== */
const INITIAL_RANGE = 0; // 오늘 ±3일 → 초기 7일
const BATCH_SIZE = 2;    // 한 번 로드 시 2일씩 추가
const MAX_RANGE = 14;    // ±14일 범위를 넘어가면 제거

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

/** =============== 최상위 WeekView =============== */
export default function WeekView() {
    const [daysData, setDaysData] = useState<DayData[]>(() =>
        generateInitialDays(INITIAL_RANGE)
    );
    const [isLoading, setIsLoading] = useState(false);

    const isDateInList = (list: DayData[], dateString: string) => {
        return list.some((d) => d.dayInfo.dateString === dateString);
    };

    /** ========== 위로 당겨서 과거 날짜 로딩 ========== */
    async function loadMorePast() {
        // 이미 로딩중이면 더 이상 호출하지 않음
        if (daysData.length === 0 || isLoading) return;
        // setIsLoading(true);

        const firstItem = daysData[0];
        const firstDate = parseISO(firstItem.dayInfo.dateString);

        // 1초 정도 딜레이 (예: 서버 호출 대기 시뮬레이션)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // BATCH_SIZE 만큼 과거 날짜 생성
        const newDays: DayData[] = [];
        for (let i = 1; i <= BATCH_SIZE; i++) {

        }
        const pastDate = subDays(firstDate, 1);
        const pastDateString = format(pastDate, "yyyy-MM-dd");

        if (!isDateInList(daysData, pastDateString)) {
            newDays.push(generateDayData(pastDate));
        }


        // 기존 날짜와 병합 → ±14일 범위 제한
        const merged = [...newDays, ...daysData];
        setDaysData(limitRange(merged));
        // setIsLoading(false);
    }

    /** ========== 아래로 당겨서 미래 날짜 로딩 ========== */
    async function loadMoreFuture() {
        if (daysData.length === 0 || isLoading) return;
        setIsLoading(true);

        const lastItem = daysData[daysData.length - 1];
        const lastDate = parseISO(lastItem.dayInfo.dateString);

        await new Promise((resolve) => setTimeout(resolve, 500));

        const newDays: DayData[] = [];
        for (let i = 1; i <= BATCH_SIZE; i++) {
            const futureDate = addDays(lastDate, i);
            newDays.push(generateDayData(futureDate));
        }

        const merged = [...daysData, ...newDays];
        setDaysData(limitRange(merged));
        setIsLoading(false);
    }

    /** ========== FlatList 렌더 ========== */
    return (
        <View style={{flex: 1}}>
            <FlatList
                data={daysData}
                keyExtractor={(item) => item.dayInfo.dateString}
                renderItem={({item}) => (
                    <ActivityDayView
                        dayInfo={item.dayInfo}
                        activities={item.activities}
                    />
                )}
                refreshing={isLoading}
                onRefresh={() => {
                    loadMorePast(); // 위로 당길 때 호출
                }}
                onScroll={(e) => {
                    const offsetY = e.nativeEvent.contentOffset.y;
                    const layoutHeight = e.nativeEvent.layoutMeasurement.height;
                    const contentHeight = e.nativeEvent.contentSize.height;
                    // console.log(offsetY);

                    // 위로 당기기
                    // if (offsetY < -50) {
                    //     loadMorePastDebounced();
                    // }
                    // 아래로 당기기
                    if (offsetY + layoutHeight > contentHeight + 50) {
                        loadMoreFuture();
                    }
                }}
                scrollEventThrottle={16}
            />

            {/* 하단에 로딩 표시 (활성화 시) */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    {/* 예시로 ActivityIndicator 대신 Text로 표시해도 됩니다 */}
                    <ActivityIndicator size="large" color="#999"/>
                    <Text style={{marginTop: 8, color: "#444"}}>
                        Loading...
                    </Text>
                </View>
            )}
        </View>
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
                style={{height: totalDayHeight}}
                onScroll={onDayScroll}
                scrollEventThrottle={16}
                onMomentumScrollBegin={(e) => {
                    const offsetY = e.nativeEvent.contentOffset.y;
                    console.log("event up");
                    // 위로 당기는 동작 감지
                    if (offsetY < 0) {

                    }
                }}
            >
                <View style={[styles.absoluteWrapper, {height: totalDayHeight}]}>
                    {Array.from({length: NUM_CHUNKS}, (_, i) => i).map((chunkIndex) => {
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
        {length: CHUNK_SIZE},
        (_, i) => chunkStartHour + i
    );

    // 해당 청크에 겹치는 액티비티만 필터
    const chunkActivities = activities.filter((act) =>
        isActivityOverlapChunk(act, dayInfo.dateString, chunkStartHour, chunkEndHour)
    );

    return (
        <View
            style={[
                styles.chunkContainer,
                {top: chunkTop, height: chunkHeight},
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
                const {top, height} = calculateActivityBlock(act, chunkStartHour);
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

/** 액티비티 블록 위치/높이 계산(분 단위) */
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

    return {top, height};
}

/** "2024-01-10 09:30" -> [9, 30] */
function parseTime(timeStr: string): [number, number] {
    const hh = parseInt(timeStr.slice(11, 13), 10);
    const mm = parseInt(timeStr.slice(14, 16), 10);
    return [hh, mm];
}

/** =============== 초기 데이터 / 유틸 =============== */

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
        dateString: format(date, "yyyy-MM-dd"),
        label: format(date, "EEE"),
    };
    const activities = generateMockActivities(dayInfo.dateString);
    return {dayInfo, activities};
}

/** Mock 일정(액티비티) 생성 */
function generateMockActivities(dateString: string): Activity[] {
    // 간단 예시: 무조건 1~2개 랜덤 생성
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

/** ±MAX_RANGE(14일) 초과 날짜 제거 */
function limitRange(list: DayData[]): DayData[] {
    const today = new Date();
    return list.filter((d) => {
        const diff = differenceInCalendarDays(parseISO(d.dayInfo.dateString), today);
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
    loadingOverlay: {
        position: "absolute",
        bottom: 20,
        alignSelf: "center",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.8)",
        padding: 16,
        borderRadius: 8,
    },
});
