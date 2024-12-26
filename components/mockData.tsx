// 예: 일주일치 가데이터
// 'startTime'과 'endTime'은 YYYY-MM-DD HH:mm 형식(또는 Date 객체)
export const mockActivities = [
    {
        id: 1,
        title: "독서",
        startTime: "2024-01-01 09:00",
        endTime: "2024-01-01 10:30",
        color: "#fd5c63", // 타임블록 배경색
    },
    {
        id: 2,
        title: "헬스",
        startTime: "2024-01-02 08:00",
        endTime: "2024-01-02 14:00",
        color: "#6b8ac9",
    },
    {
        id: 3,
        title: "회의",
        startTime: "2024-02ㄱ-02 09:30",
        endTime: "2024-01-02 11:00",
        color: "#3b506d",
    },
    // 필요에 따라 더 추가
];


// 2024-01-01(월)부터 2024-01-07(일)이라고 가정
export const weekDates = [
    {date: "2024-01-01", label: "Mon"},
    {date: "2024-01-02", label: "Tue"},
    {date: "2024-01-03", label: "Wed"},
    {date: "2024-01-04", label: "Thu"},
    {date: "2024-01-05", label: "Fri"},
    {date: "2024-01-06", label: "Sat"},
    {date: "2024-01-07", label: "Sun"},
];
