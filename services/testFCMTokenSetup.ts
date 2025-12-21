import { setupPushNotifications } from '../services/pushNotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Test component to verify FCM token registration
 * Use this to test that both FCM and Expo tokens are being registered
 */
export const TestFCMTokenSetup = async () => {
  try {
    console.log('🧪 [TEST] Starting FCM token registration test...');
    console.log('');

    // Get test user ID
    const userJson = await AsyncStorage.getItem('user');
    if (!userJson) {
      console.error('❌ [TEST] No user logged in');
      return;
    }

    const user = JSON.parse(userJson);
    const userId = user.id;
    console.log('📝 [TEST] Test User ID:', userId.substring(0, 30) + '...');
    console.log('');

    // Clear previous tokens to force re-registration
    console.log('🔄 [TEST] Clearing previous tokens...');
    await AsyncStorage.removeItem('fcmToken');
    await AsyncStorage.removeItem('expoPushToken');
    await AsyncStorage.removeItem('deviceTokenRegisteredUserId');
    console.log('✓ [TEST] Previous tokens cleared');
    console.log('');

    // Run the setup
    console.log('🚀 [TEST] Running setupPushNotifications()...');
    console.log('='.repeat(60));
    const success = await setupPushNotifications(userId);
    console.log('='.repeat(60));
    console.log('');

    // Check results
    console.log('📊 [TEST] Test Results:');
    console.log('  Setup success:', success ? '✅ YES' : '❌ NO');
    console.log('');

    // Check what tokens were stored
    const fcmToken = await AsyncStorage.getItem('fcmToken');
    const expoPushToken = await AsyncStorage.getItem('expoPushToken');
    const registeredUserId = await AsyncStorage.getItem('deviceTokenRegisteredUserId');

    console.log('💾 [TEST] Stored Tokens:');
    if (fcmToken) {
      console.log('  ✅ FCM Token:', fcmToken.substring(0, 50) + '...');
      console.log(`     Length: ${fcmToken.length} chars`);
    } else {
      console.log('  ❌ FCM Token: NOT REGISTERED');
    }

    if (expoPushToken) {
      console.log('  ✅ Expo Token:', expoPushToken);
    } else {
      console.log('  ❌ Expo Token: NOT REGISTERED');
    }

    console.log('');
    console.log('👤 [TEST] Registered User ID:', registeredUserId);
    console.log('');

    // Final verdict
    console.log('🎯 [TEST] Final Verdict:');
    if (fcmToken && expoPushToken) {
      console.log('  ✅ PASS - Both FCM and Expo tokens registered!');
    } else if (fcmToken && !expoPushToken) {
      console.log('  ⚠️  PARTIAL - Only FCM token registered (expected on some devices)');
    } else if (!fcmToken && expoPushToken) {
      console.log('  ⚠️  PARTIAL - Only Expo token registered');
      console.log('     Note: This is expected on Expo Go');
      console.log('     On native APK, FCM should also work');
    } else {
      console.log('  ❌ FAIL - No tokens registered');
    }

    console.log('');
    console.log('📌 [TEST] Note: Check the logs above for any error messages');
    console.log('         Look for: "FCM token acquired" and "Expo token acquired"');
  } catch (error) {
    console.error('❌ [TEST] Test failed with error:', error);
  }
};

/**
 * Alternative: Add a button to your debug screen
 * 
 * Example usage in your debug component:
 * 
 * <TouchableOpacity onPress={() => TestFCMTokenSetup()}>
 *   <Text>Test FCM Token Setup</Text>
 * </TouchableOpacity>
 */
