import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface FlipClockDigitProps {
  value: string;
  label: string;
}

export default function FlipClockDigit({ value, label }: FlipClockDigitProps) {
  return (
    <View style={styles.container}>
      <View style={styles.digitBox}>
        <Text style={styles.digitText}>{value}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  digitBox: {
    width: 50,
    height: 60,
    backgroundColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  digitText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
    fontWeight: '600',
  },
});
