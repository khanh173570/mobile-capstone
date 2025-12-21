/**
 * Test FCM Send Notification Component
 * Use this component to test sending FCM notifications
 */

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useFCMNotification } from '../../hooks/useFCMNotification';

const TestFCMSendNotification = () => {
  const { loading, error, success, response, sendSimple, reset } = useFCMNotification();

  // Form state
  const [deviceToken, setDeviceToken] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dataJson, setDataJson] = useState('{}');

  const handleSendNotification = async () => {
    try {
      const data = dataJson ? JSON.parse(dataJson) : undefined;
      await sendSimple(deviceToken, title, body, data);
    } catch (err) {
      console.error('Error sending notification:', err);
    }
  };

  const handleReset = () => {
    reset();
    setDeviceToken('');
    setTitle('');
    setBody('');
    setDataJson('{}');
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        📤 Send FCM Notification by Device Token
      </Text>

      {/* Device Token Input */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#555' }}>
          Device Token *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 10,
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
          }}
          placeholder="Enter device token"
          value={deviceToken}
          onChangeText={setDeviceToken}
          editable={!loading}
        />
      </View>

      {/* Title Input */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#555' }}>
          Title *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 10,
            borderRadius: 6,
            fontSize: 14,
          }}
          placeholder="Enter notification title"
          value={title}
          onChangeText={setTitle}
          editable={!loading}
        />
      </View>

      {/* Body Input */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#555' }}>
          Body *
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 10,
            borderRadius: 6,
            fontSize: 14,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          placeholder="Enter notification body"
          value={body}
          onChangeText={setBody}
          multiline
          editable={!loading}
        />
      </View>

      {/* Data JSON Input */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, fontWeight: '600', marginBottom: 4, color: '#555' }}>
          Data (JSON) - Optional
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#ddd',
            padding: 10,
            borderRadius: 6,
            fontFamily: 'monospace',
            fontSize: 12,
            minHeight: 80,
            textAlignVertical: 'top',
          }}
          placeholder='{"key": "value"}'
          value={dataJson}
          onChangeText={setDataJson}
          multiline
          editable={!loading}
        />
      </View>

      {/* Loading State */}
      {loading && (
        <View style={{ alignItems: 'center', marginVertical: 16 }}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={{ marginTop: 8, color: '#666' }}>Sending notification...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View
          style={{
            backgroundColor: '#ffebee',
            borderWidth: 1,
            borderColor: '#ef5350',
            padding: 12,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#c62828', fontWeight: '600' }}>❌ Error</Text>
          <Text style={{ color: '#d32f2f', marginTop: 4 }}>{error}</Text>
        </View>
      )}

      {/* Success State */}
      {success && response && (
        <View
          style={{
            backgroundColor: '#e8f5e9',
            borderWidth: 1,
            borderColor: '#81c784',
            padding: 12,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ color: '#2e7d32', fontWeight: '600' }}>✅ Success</Text>
          <Text style={{ color: '#388e3c', marginTop: 4 }}>
            {response.message}
          </Text>
          {response.data && (
            <View style={{ marginTop: 8, padding: 8, backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 4 }}>
              <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#1b5e20' }}>
                {JSON.stringify(response.data, null, 2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#4CAF50',
            padding: 12,
            borderRadius: 6,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handleSendNotification}
          disabled={loading || !deviceToken || !title || !body}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Send Notification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: '#757575',
            padding: 12,
            borderRadius: 6,
            alignItems: 'center',
            opacity: loading ? 0.6 : 1,
          }}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box */}
      <View
        style={{
          backgroundColor: '#e3f2fd',
          borderWidth: 1,
          borderColor: '#90caf9',
          padding: 12,
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#1565c0', fontWeight: '600', marginBottom: 8 }}>
          ℹ️ API Endpoint
        </Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11, color: '#1565c0' }}>
          POST /api/messaging-service/Test/fcm-send-to-token
        </Text>
        <Text style={{ color: '#1565c0', marginTop: 8, fontSize: 12 }}>
          Parameters: deviceToken, title, body, dataJson (optional)
        </Text>
      </View>
    </ScrollView>
  );
};

export default TestFCMSendNotification;
