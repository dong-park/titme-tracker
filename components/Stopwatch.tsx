import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface LapTime {
  id: number;
  time: number;
  formattedTime: string;
}

export function Stopwatch() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<LapTime[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const lapStartTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startStopwatch = () => {
    if (isRunning) {
      // 스톱워치 정지
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // 스톱워치 시작
      const startTime = Date.now() - time;
      startTimeRef.current = startTime;
      
      if (laps.length === 0) {
        lapStartTimeRef.current = startTime;
      }
      
      intervalRef.current = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        setTime(elapsedTime);
      }, 10);
    }
    
    setIsRunning(!isRunning);
  };

  const resetStopwatch = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setTime(0);
    setIsRunning(false);
    setLaps([]);
    startTimeRef.current = 0;
    lapStartTimeRef.current = 0;
  };

  const recordLap = () => {
    if (!isRunning) return;
    
    const currentTime = Date.now();
    const lapTime = currentTime - lapStartTimeRef.current;
    lapStartTimeRef.current = currentTime;
    
    const newLap: LapTime = {
      id: laps.length + 1,
      time: lapTime,
      formattedTime: formatTime(lapTime)
    };
    
    setLaps([newLap, ...laps]);
  };

  const formatTime = (timeInMs: number) => {
    const ms = Math.floor((timeInMs % 1000) / 10).toString().padStart(2, '0');
    const seconds = Math.floor((timeInMs / 1000) % 60).toString().padStart(2, '0');
    const minutes = Math.floor((timeInMs / (1000 * 60)) % 60).toString().padStart(2, '0');
    const hours = Math.floor(timeInMs / (1000 * 60 * 60)).toString().padStart(2, '0');
    
    return hours === '00' 
      ? `${minutes}:${seconds}.${ms}` 
      : `${hours}:${minutes}:${seconds}.${ms}`;
  };

  const renderLapItem = ({ item, index }: { item: LapTime, index: number }) => (
    <View style={styles.lapItem}>
      <Text style={styles.lapNumber}>랩 {item.id}</Text>
      <Text style={styles.lapTime}>{item.formattedTime}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(time)}</Text>
      </View>
      
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.resetButton]} 
          onPress={resetStopwatch}
        >
          <Icon name="refresh" size={24} color="#FF5252" />
          <Text style={styles.resetButtonText}>초기화</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.startStopButton,
            isRunning ? styles.stopButton : styles.startButton
          ]} 
          onPress={startStopwatch}
        >
          <Icon 
            name={isRunning ? "pause" : "play"} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.startStopButtonText}>
            {isRunning ? '정지' : '시작'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            styles.lapButton,
            !isRunning && styles.disabledButton
          ]} 
          onPress={recordLap}
          disabled={!isRunning}
        >
          <Icon name="flag" size={24} color={isRunning ? "#007AFF" : "#ccc"} />
          <Text style={[
            styles.lapButtonText,
            !isRunning && styles.disabledButtonText
          ]}>랩</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.lapsContainer}>
        <Text style={styles.lapsTitle}>랩 타임</Text>
        {laps.length === 0 ? (
          <View style={styles.emptyLapsContainer}>
            <Text style={styles.emptyLapsText}>랩 타임이 없습니다</Text>
          </View>
        ) : (
          <FlatList
            data={laps}
            renderItem={renderLapItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.lapsList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  timeContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  timeText: {
    fontSize: 60,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  startStopButton: {
    minWidth: 100,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#FF9800',
  },
  resetButton: {
    backgroundColor: '#f5f5f5',
  },
  lapButton: {
    backgroundColor: '#f5f5f5',
  },
  disabledButton: {
    opacity: 0.5,
  },
  startStopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  resetButtonText: {
    color: '#FF5252',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  lapButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  disabledButtonText: {
    color: '#ccc',
  },
  lapsContainer: {
    flex: 1,
  },
  lapsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  lapsList: {
    flex: 1,
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  lapNumber: {
    fontSize: 16,
    color: '#666',
  },
  lapTime: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    color: '#333',
  },
  emptyLapsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyLapsText: {
    color: '#888',
    fontSize: 16,
  },
}); 