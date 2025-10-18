import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CloudRain, Sun, Cloud, Thermometer, Droplets, Wind, Eye, TriangleAlert as AlertTriangle, Settings, Bell, BellOff } from 'lucide-react-native';

interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    icon: string;
    humidity: number;
    windSpeed: number;
    visibility: number;
    uvIndex: number;
  };
  alerts: Array<{
    id: string;
    type: 'rain' | 'heat' | 'storm';
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    icon: string;
    rainChance: number;
  }>;
}

export default function WeatherScreen() {
  const [weatherData, setWeatherData] = useState<WeatherData>({
    current: {
      temperature: 32,
      condition: 'Nắng ít mây',
      icon: 'sun',
      humidity: 68,
      windSpeed: 12,
      visibility: 10,
      uvIndex: 8
    },
    alerts: [
      {
        id: '1',
        type: 'rain',
        title: 'Cảnh báo mưa lớn',
        description: 'Dự báo mưa lớn từ 14:00 - 18:00 hôm nay. Khuyến nghị hoãn việc phun thuốc.',
        severity: 'medium'
      },
      {
        id: '2',
        type: 'heat',
        title: 'Cảnh báo nắng nóng',
        description: 'Nhiệt độ có thể đạt 38°C vào cuối tuần. Tăng cường tưới nước cho cây Na.',
        severity: 'high'
      }
    ],
    forecast: [
      { day: 'Hôm nay', high: 32, low: 24, condition: 'Nắng ít mây', icon: 'sun', rainChance: 30 },
      { day: 'Ngày mai', high: 29, low: 22, condition: 'Mưa rào', icon: 'rain', rainChance: 80 },
      { day: 'Thứ 3', high: 31, low: 23, condition: 'Nhiều mây', icon: 'cloud', rainChance: 60 },
      { day: 'Thứ 4', high: 34, low: 25, condition: 'Nắng', icon: 'sun', rainChance: 20 },
      { day: 'Thứ 5', high: 36, low: 27, condition: 'Nắng nóng', icon: 'sun', rainChance: 10 },
      { day: 'Thứ 6', high: 35, low: 26, condition: 'Nắng ít mây', icon: 'sun', rainChance: 15 },
      { day: 'Thứ 7', high: 33, low: 24, condition: 'Mưa rào', icon: 'rain', rainChance: 70 }
    ]
  });

  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getWeatherIcon = (iconName: string, size: number = 24, color: string = '#6B7280') => {
    switch (iconName) {
      case 'sun':
        return <Sun size={size} color={color} strokeWidth={2} />;
      case 'rain':
        return <CloudRain size={size} color={color} strokeWidth={2} />;
      case 'cloud':
        return <Cloud size={size} color={color} strokeWidth={2} />;
      default:
        return <Sun size={size} color={color} strokeWidth={2} />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  const getAlertBgColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#FEE2E2';
      case 'medium':
        return '#FEF3C7';
      case 'low':
        return '#DBEAFE';
      default:
        return '#F3F4F6';
    }
  };

  const getUVLevel = (uvIndex: number) => {
    if (uvIndex <= 2) return { level: 'Thấp', color: '#22C55E' };
    if (uvIndex <= 5) return { level: 'Trung bình', color: '#F59E0B' };
    if (uvIndex <= 7) return { level: 'Cao', color: '#EF4444' };
    return { level: 'Rất cao', color: '#7C2D12' };
  };

  const uvLevel = getUVLevel(weatherData.current.uvIndex);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <CloudRain size={32} color="#22C55E" strokeWidth={2} />
          <View>
            <Text style={styles.headerTitle}>Thời tiết</Text>
            <Text style={styles.headerLocation}>Tây Ninh, Việt Nam</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          {notificationsEnabled ? (
            <Bell size={24} color="#22C55E" strokeWidth={2} />
          ) : (
            <BellOff size={24} color="#6B7280" strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Current Weather */}
        <View style={styles.currentWeatherCard}>
          <View style={styles.currentWeatherMain}>
            <View style={styles.temperatureSection}>
              <Text style={styles.temperature}>{weatherData.current.temperature}°</Text>
              <Text style={styles.condition}>{weatherData.current.condition}</Text>
            </View>
            {getWeatherIcon(weatherData.current.icon, 80, '#22C55E')}
          </View>
          
          <View style={styles.weatherDetails}>
            <View style={styles.detailItem}>
              <Droplets size={20} color="#3B82F6" strokeWidth={2} />
              <Text style={styles.detailLabel}>Độ ẩm</Text>
              <Text style={styles.detailValue}>{weatherData.current.humidity}%</Text>
            </View>
            <View style={styles.detailItem}>
              <Wind size={20} color="#6B7280" strokeWidth={2} />
              <Text style={styles.detailLabel}>Gió</Text>
              <Text style={styles.detailValue}>{weatherData.current.windSpeed} km/h</Text>
            </View>
            <View style={styles.detailItem}>
              <Eye size={20} color="#8B5CF6" strokeWidth={2} />
              <Text style={styles.detailLabel}>Tầm nhìn</Text>
              <Text style={styles.detailValue}>{weatherData.current.visibility} km</Text>
            </View>
            <View style={styles.detailItem}>
              <Sun size={20} color="#F59E0B" strokeWidth={2} />
              <Text style={styles.detailLabel}>UV</Text>
              <Text style={[styles.detailValue, { color: uvLevel.color }]}>
                {weatherData.current.uvIndex} ({uvLevel.level})
              </Text>
            </View>
          </View>
        </View>

        {/* Weather Alerts */}
        {weatherData.alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <View style={styles.sectionHeader}>
              <AlertTriangle size={20} color="#EF4444" strokeWidth={2} />
              <Text style={styles.sectionTitle}>Cảnh báo thời tiết</Text>
            </View>
            
            {weatherData.alerts.map(alert => (
              <View 
                key={alert.id} 
                style={[
                  styles.alertCard,
                  { 
                    backgroundColor: getAlertBgColor(alert.severity),
                    borderLeftColor: getAlertColor(alert.severity)
                  }
                ]}
              >
                <Text style={[styles.alertTitle, { color: getAlertColor(alert.severity) }]}>
                  {alert.title}
                </Text>
                <Text style={[styles.alertDescription, { color: getAlertColor(alert.severity) }]}>
                  {alert.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 7-Day Forecast */}
        <View style={styles.forecastSection}>
          <Text style={styles.sectionTitle}>Dự báo 7 ngày</Text>
          
          {weatherData.forecast.map((day, index) => (
            <View key={index} style={styles.forecastItem}>
              <Text style={styles.forecastDay}>{day.day}</Text>
              <View style={styles.forecastCondition}>
                {getWeatherIcon(day.icon, 24, '#6B7280')}
                <Text style={styles.forecastConditionText}>{day.condition}</Text>
              </View>
              <View style={styles.forecastRain}>
                <Droplets size={16} color="#3B82F6" strokeWidth={2} />
                <Text style={styles.forecastRainText}>{day.rainChance}%</Text>
              </View>
              <View style={styles.forecastTemp}>
                <Text style={styles.forecastHigh}>{day.high}°</Text>
                <Text style={styles.forecastLow}>{day.low}°</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Farming Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>🌱 Lời khuyên cho nông trại</Text>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>☀️</Text>
              <Text style={styles.tipText}>
                Nhiệt độ cao (32°C): Tưới nước vào sáng sớm và chiều mát
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>💧</Text>
              <Text style={styles.tipText}>
                Độ ẩm 68%: Điều kiện lý tưởng cho cây Na phát triển
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🌪️</Text>
              <Text style={styles.tipText}>
                Gió nhẹ 12 km/h: Thuận lợi cho việc phun thuốc bảo vệ thực vật
              </Text>
            </View>
            
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>☂️</Text>
              <Text style={styles.tipText}>
                Dự báo mưa: Hoãn việc thu hoạch và phun thuốc trong 2 ngày tới
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  headerLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
  },
  notificationButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  currentWeatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  currentWeatherMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  temperatureSection: {
    flex: 1,
  },
  temperature: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 72,
  },
  condition: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 4,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailItem: {
    alignItems: 'center',
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  alertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  forecastSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  forecastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  forecastDay: {
    width: 80,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  forecastCondition: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  forecastConditionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  forecastRain: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  forecastRainText: {
    fontSize: 12,
    color: '#3B82F6',
    marginLeft: 4,
  },
  forecastTemp: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  forecastHigh: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  forecastLow: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  tipsCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065F46',
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 16,
    width: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
});