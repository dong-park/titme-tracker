// components/timer/TimerUtils.tsx
/**
 * 타이머 관련 유틸리티 함수 모음
 */
export class TimerUtils {
    /**
     * 초 단위 시간을 MM:SS 형식으로 변환
     */
    static formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    
    /**
     * 초 단위 시간을 자연어 형식으로 변환 (예: 1시간 30분 5초)
     */
    static formatElapsedTime(seconds: number): string {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? `${hrs}시간 ` : ''} ${mins > 0 ? `${mins}분` : ''} ${secs}초`;
    }
    
    /**
     * 두 개의 날짜 문자열 사이의 시간 차이를 초 단위로 계산
     */
    static calculateTimeDifference(startDate: string, endDate: string): number {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return Math.floor((end - start) / 1000);
    }
    
    /**
     * 경과 시간에 따른 마일스톤 메시지 생성
     */
    static getMilestoneMessage(seconds: number, lastMilestone: number, currentMilestone: string): string {
        // 처음 시작할 때
        if (seconds < 60) return "집중 시작!";

        // 마일스톤 달성 시점 확인
        const minutes = Math.floor(seconds / 60);
        
        // 특정 시간 달성 시 메시지 반환
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
        return currentMilestone;
    }
}