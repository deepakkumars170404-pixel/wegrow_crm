import React, { useState, useEffect } from "react";
import { Text, TextStyle, StyleProp } from "react-native";

interface LiveClockProps {
  style?: StyleProp<TextStyle>;
  prefix?: string;
  suffix?: string;
}

export const LiveClock: React.FC<LiveClockProps> = React.memo(({ style, prefix = "", suffix = "" }) => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text style={style}>
      {prefix}{time}{suffix}
    </Text>
  );
});
