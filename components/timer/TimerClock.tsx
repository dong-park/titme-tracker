// components/timer/TimerClock.tsx
import React from "react";
import Svg, { Circle, Path, Line, G } from "react-native-svg";

interface TimerClockProps {
    size: number;
    radius: number;
    progress: {
        totalAngle: number;
        remainingAngle: number;
    };
    renderClockMarks: () => React.ReactNode[];
    renderHourHand: () => React.ReactNode;
    describeArc: (x: number, y: number, radius: number, startAngle: number, endAngle: number) => string;
}

export const TimerClock: React.FC<TimerClockProps> = React.memo(({
    size,
    radius,
    progress,
    renderClockMarks,
    renderHourHand,
    describeArc
}) => {
    return (
        <Svg width={size} height={size}>
            {/* 배경 원 */}
            <Circle
                cx={radius}
                cy={radius}
                r={radius - 10}
                stroke="#f0f0f0"
                strokeWidth="2"
                fill="white"
            />

            {/* 시계 눈금 */}
            {renderClockMarks()}

            {/* 전체 설정 시간을 나타내는 호 */}
            <Path
                d={describeArc(
                    radius,
                    radius,
                    radius - 20,
                    0,
                    progress.remainingAngle
                )}
                stroke="#E0E0FF"
                strokeWidth="10"
                fill="none"
            />

            {/* 시침 */}
            {renderHourHand()}

            {/* 중심점 */}
            <Circle
                cx={radius}
                cy={radius}
                r={5}
                fill="#333"
            />
        </Svg>
    );
});
