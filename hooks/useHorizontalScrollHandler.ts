// hooks/useHorizontalScrollHandler.ts
import {useRef} from 'react';
import {PanResponder, ScrollView} from 'react-native';

export function useHorizontalScrollHandler(scrollRef: React.RefObject<ScrollView>) {
    const currentScrollX = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dx) > Math.abs(gestureState.dy); // 수평 이동 감지
            },
            onPanResponderGrant: () => {
                // PanResponder가 시작될 때 현재 스크롤 위치를 저장
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({x: currentScrollX.current, animated: false});
                }
            },
            onPanResponderMove: (_, gestureState) => {
                if (scrollRef.current) {
                    // 기존 스크롤 위치에 드래그 거리 더하기
                    const newScrollPosition = currentScrollX.current - gestureState.dx;
                    scrollRef.current.scrollTo({
                        x: newScrollPosition,
                        animated: false,
                    });
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // 드래그가 끝난 후 현재 스크롤 위치 업데이트
                currentScrollX.current -= gestureState.dx;
            },
        })
    ).current;

    return panResponder.panHandlers;
}
