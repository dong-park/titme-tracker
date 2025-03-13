// hooks/useActivityRefs.ts
import {useCallback, useRef} from 'react';

type ActivityRefType = {
    resetAnimation: () => void;
};

export function useActivityRefs(count: number) {
    // 단일 배열로 모든 ref 관리
    const refs = Array(count)
        .fill(null)
        .map(() => useRef<ActivityRefType>(null));

    // 모든 애니메이션 초기화 함수 (useCallback으로 메모이제이션)
    const resetAllAnimations = useCallback(() => {
        refs.forEach(ref => {
            if (ref.current?.resetAnimation) {
                ref.current.resetAnimation();
            }
        });
    }, [refs]);

    return {
        refs,
        resetAllAnimations
    };
}
