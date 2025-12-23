/**
 * Wallet Service Debugging Helper
 * Use this to debug wallet-related authorization issues
 * 
 * Usage:
 * import { debugWalletAuth, debugAddFunds } from '../../utils/walletDebugger';
 * 
 * // Check auth status
 * await debugWalletAuth();
 * 
 * // Check add funds flow
 * await debugAddFunds('userId', 500000);
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTokenExpired } from '../services/authService';

export interface WalletDebugInfo {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  hasUserId: boolean;
  tokenLength?: number;
  tokenExpired?: boolean;
  userId?: string;
  timestamp: string;
}

export interface AddFundsDebugInfo extends WalletDebugInfo {
  requestedUserId: string;
  userIdMatch: boolean;
  readyForAddFunds: boolean;
  issues: string[];
}

/**
 * Debug wallet authentication status
 */
export const debugWalletAuth = async (): Promise<WalletDebugInfo> => {
  try {
    const accessToken = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const userId = await AsyncStorage.getItem('userId');
    
    const debugInfo: WalletDebugInfo = {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserId: !!userId,
      timestamp: new Date().toISOString(),
    };

    if (accessToken) {
      debugInfo.tokenLength = accessToken.length;
      debugInfo.tokenExpired = isTokenExpired(accessToken);
    }

    if (userId) {
      debugInfo.userId = userId;
    }

    // Console logging with emojis for easy identification
    //console.log('🔐 ═══════════════════════════════════════');
    //console.log('🔐 WALLET AUTHENTICATION DEBUG');
    //console.log('🔐 ═══════════════════════════════════════');
    //console.log(`✓ Access Token: ${debugInfo.hasAccessToken ? '✅ Present' : '❌ Missing'}`);
    if (debugInfo.tokenLength) {
      //console.log(`  └─ Length: ${debugInfo.tokenLength} chars`);
    }
    if (debugInfo.tokenExpired !== undefined) {
      //console.log(`  └─ Expired: ${debugInfo.tokenExpired ? '⏰ YES' : '✅ NO'}`);
    }
    //console.log(`✓ Refresh Token: ${debugInfo.hasRefreshToken ? '✅ Present' : '❌ Missing'}`);
    if (debugInfo.hasRefreshToken) {
      //console.log(`  └─ Can refresh if needed`);
    }
    //console.log(`✓ User ID: ${debugInfo.hasUserId ? '✅ Present' : '❌ Missing'}`);
    if (debugInfo.userId) {
      //console.log(`  └─ User ID: ${debugInfo.userId.substring(0, 12)}...`);
    }
    //console.log(`✓ Timestamp: ${debugInfo.timestamp}`);
    //console.log('🔐 ═══════════════════════════════════════');

    return debugInfo;
  } catch (error) {
    console.error('❌ Error during wallet auth debug:', error);
    throw error;
  }
};

/**
 * Debug add funds flow
 */
export const debugAddFunds = async (
  userId: string,
  amount: number
): Promise<AddFundsDebugInfo> => {
  try {
    //console.log('💳 ═══════════════════════════════════════');
    //console.log('💳 ADD FUNDS DEBUG');
    //console.log('💳 ═══════════════════════════════════════');
    
    const authDebug = await debugWalletAuth();
    
    const authenticatedUserId = await AsyncStorage.getItem('userId');
    const userIdMatch = authenticatedUserId === userId;
    
    const issues: string[] = [];
    
    // Check each requirement
    if (!authDebug.hasAccessToken) {
      issues.push('❌ No access token - User not authenticated');
    }
    
    if (authDebug.tokenExpired) {
      issues.push('⏰ Access token expired - Need to refresh or re-login');
    }
    
    if (!authDebug.hasRefreshToken) {
      issues.push('⚠️ No refresh token - Cannot auto-refresh token');
    }
    
    if (!authDebug.hasUserId) {
      issues.push('❌ No user ID in storage - Session may be corrupted');
    }
    
    if (!userIdMatch) {
      issues.push(`⚠️ User ID mismatch: Authenticated=${authenticatedUserId}, Requested=${userId}`);
    }
    
    if (amount < 10000) {
      issues.push('❌ Amount below minimum (10,000 VND)');
    }
    
    if (amount > 100000000) {
      issues.push('❌ Amount above maximum (100,000,000 VND)');
    }
    
    const debugInfo: AddFundsDebugInfo = {
      ...authDebug,
      requestedUserId: userId,
      userIdMatch,
      readyForAddFunds: issues.length === 0 && authDebug.hasAccessToken && !authDebug.tokenExpired && userIdMatch,
      issues,
    };

    // Console output
    //console.log(`💳 Request Details:`);
    //console.log(`  ├─ Requested User ID: ${userId.substring(0, 12)}...`);
    //console.log(`  ├─ Amount: ${amount.toLocaleString('vi-VN')} VND`);
    //console.log(`  └─ Authenticated User: ${authenticatedUserId ? '✅ YES' : '❌ NO'}`);
    
    if (authenticatedUserId) {
      //console.log(`💳 User Match: ${userIdMatch ? '✅ YES' : '❌ NO'}`);
      if (!userIdMatch) {
        //console.log(`  └─ ⚠️ Will likely cause 403/401 error`);
      }
    }
    
    //console.log(`💳 Status: ${debugInfo.readyForAddFunds ? '✅ READY' : '❌ NOT READY'}`);
    
    if (issues.length > 0) {
      //console.log(`💳 Issues Found (${issues.length}):`);
      issues.forEach((issue, idx) => {
        //console.log(`  ${idx + 1}. ${issue}`);
      });
    }
    
    //console.log('💳 ═══════════════════════════════════════');

    return debugInfo;
  } catch (error) {
    console.error('❌ Error during add funds debug:', error);
    throw error;
  }
};

/**
 * Clear authentication and force re-login
 * (Use carefully - will logout the user)
 */
export const clearAuthAndRelogin = async (): Promise<void> => {
  try {
    console.warn('🗑️ Clearing authentication tokens...');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('userId');
    //console.log('✅ Tokens cleared. User will be redirected to login.');
  } catch (error) {
    console.error('❌ Error clearing auth:', error);
    throw error;
  }
};

/**
 * Log transaction flow
 */
export const logTransactionFlow = (step: string, data?: any): void => {
  const timestamp = new Date().toLocaleTimeString('vi-VN');
  //console.log(`[${timestamp}] 🔄 ${step}`);
  if (data) {
    //console.log('  └─ Data:', data);
  }
};

/**
 * Create a debug report for support
 */
export const generateDebugReport = async (): Promise<string> => {
  try {
    const authDebug = await debugWalletAuth();
    
    const report = `
═══════════════════════════════════════════════════════════════
WALLET SERVICE DEBUG REPORT
═══════════════════════════════════════════════════════════════

Generated: ${new Date().toISOString()}

AUTHENTICATION STATUS:
├─ Access Token: ${authDebug.hasAccessToken ? 'Present' : 'Missing'}
│  └─ Length: ${authDebug.tokenLength || 'N/A'}
│  └─ Expired: ${authDebug.tokenExpired !== undefined ? (authDebug.tokenExpired ? 'Yes' : 'No') : 'Unknown'}
├─ Refresh Token: ${authDebug.hasRefreshToken ? 'Present' : 'Missing'}
├─ User ID: ${authDebug.hasUserId ? 'Present' : 'Missing'}
│  └─ Value: ${authDebug.userId ? authDebug.userId.substring(0, 20) + '...' : 'N/A'}
└─ Timestamp: ${authDebug.timestamp}

RECOMMENDATIONS:
${authDebug.tokenExpired ? '1. Token has expired - Click "Refresh" or re-login\n' : ''}
${!authDebug.hasAccessToken ? '1. No access token found - Must login first\n' : ''}
${!authDebug.hasRefreshToken ? '2. No refresh token - Auto-refresh unavailable\n' : ''}
${!authDebug.hasUserId ? '3. No user ID - Session may be corrupted\n' : ''}
${authDebug.hasAccessToken && !authDebug.tokenExpired && authDebug.hasUserId ? 'All checks passed ✅' : ''}

═══════════════════════════════════════════════════════════════
    `;

    //console.log(report);
    return report;
  } catch (error) {
    console.error('❌ Error generating debug report:', error);
    throw error;
  }
};

export default {
  debugWalletAuth,
  debugAddFunds,
  clearAuthAndRelogin,
  logTransactionFlow,
  generateDebugReport,
};
