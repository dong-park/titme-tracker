import React, {createContext, useContext, useRef, useState, ReactNode} from 'react';

interface ElapsedTimeContextType {
    localElapsedTimeRef: React.MutableRefObject<number>;
    setLocalElapsedTime: (time: number) => void;
}

const ElapsedTimeContext = createContext<ElapsedTimeContextType | undefined>(undefined);

export const useElapsedTime = () => {
    const context = useContext(ElapsedTimeContext);
    if (!context) {
        throw new Error("useElapsedTime must be used within a ElapsedTimeProvider");
    }
    return context;
};

interface ElapsedTimeProviderProps {
    children: ReactNode; // children 속성 타입 추가
}

export const ElapsedTimeProvider: React.FC<ElapsedTimeProviderProps> = ({children}) => {
    const localElapsedTimeRef = useRef(0);
    const [, forceRender] = useState(0); // 리렌더 트리거

    const setLocalElapsedTime = (time: number) => {
        localElapsedTimeRef.current = time;
        forceRender(prev => prev + 1); // 강제 리렌더링
    };

    return (
        <ElapsedTimeContext.Provider value={{localElapsedTimeRef, setLocalElapsedTime}}>
            {children}
        </ElapsedTimeContext.Provider>
    );
};
