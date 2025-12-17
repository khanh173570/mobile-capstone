import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Package, 
  Clock,
  MapPin,
  Leaf,
  Bell,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  getAuctionStatusInfo,
  getAuctionSessionHarvests,
  getCurrentHarvest,
  CurrentHarvest,
  getAuctionsByStatus,
  getAuctionDetail
} from '../../../../../services/auctionService';
import { getCropById, Crop, getCropsByFarmId } from '../../../../../services/cropService';
import { getFarmById, Farm } from '../../../../../services/farmService';
import { getHarvestById } from '../../../../../services/harvestService';
import CreateBidModal from '../../../../../components/wholesaler/BidModalV2';
import BidListDisplay from '../../../../../components/wholesaler/BidListDisplay';
import AllBidsDisplay from '../../../../../components/wholesaler/AllBidsDisplay';
import HarvestImagesGallery from '../../../../../components/wholesaler/HarvestImagesGallery';
import FlipClockDigit from '../../../../../components/shared/FlipClockDigit';
import EscrowPaymentButton from '../../../../../components/wholesaler/EscrowPaymentButton';
import { useAuctionContext } from '../../../../../hooks/useAuctionContext';
import { getBidsForAuction, getAllBidsForAuction, BidResponse, BidLog } from '../../../../../services/bidService';
import { sendLocalNotification } from '../../../../../services/notificationService';
import { signalRService, BidPlacedEvent, BuyNowEvent } from '../../../../../services/signalRService';
import { getUserByUsername, User } from '../../../../../services/authService';

interface Auction {
    id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number | null;
  minBidIncrement: number;
  buyNowPrice?: number;
  status: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string;
  harvests?: Array<{
    id: string;
    harvestDate: string | null;
    startDate: string;
    totalQuantity: number;
    unit: string;
    note: string;
    salePrice: number;
    harvestGradeDetails: Array<{
      id: string;
      grade: string;
      quantity: number;
      unit: string;
    }>;
  }>;
}

export default function WholesalerAuctionDetailScreen() {
  const { auctionId } = useLocalSearchParams();
  const { setCurrentAuctionId } = useAuctionContext();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [farms, setFarms] = useState<Map<string, Farm>>(new Map());
  const [crops, setCrops] = useState<Crop[]>([]);
  const [currentHarvests, setCurrentHarvests] = useState<{ [key: string]: CurrentHarvest }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bids, setBids] = useState<BidResponse[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [selectedBidForEdit, setSelectedBidForEdit] = useState<BidResponse | undefined>(undefined);
  const [allBidLogs, setAllBidLogs] = useState<BidLog[]>([]);
  const [loadingAllBids, setLoadingAllBids] = useState(false);
  const [countdown, setCountdown] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<{ userId: string; fullName: string } | null>(null);
  const [newBidCount, setNewBidCount] = useState(0);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [lastViewedBidTime, setLastViewedBidTime] = useState<string | null>(null);
  const [displayPrice, setDisplayPrice] = useState<number>(0); // Track current price separately for instant UI update
  const [farmerData, setFarmerData] = useState<User | null>(null);
  const [loadingFarmer, setLoadingFarmer] = useState(false);

  // Debug: Log state changes
  useEffect(() => {
    console.log('📊 State allBidLogs changed, count:', allBidLogs.length);
    if (allBidLogs.length > 0) {
      console.log('📊 First bid:', allBidLogs[0].userName, '-', allBidLogs[0].type);
      const firstBidData = JSON.parse(allBidLogs[0].newEntity).Bid;
      console.log('📊 First bid amount:', firstBidData?.BidAmount || 'N/A');
      console.log('📊 First bid time:', allBidLogs[0].dateTimeUpdate);
    }
  }, [allBidLogs]);

  // When bids modal opens, ensure UI has latest data
  useEffect(() => {
    if (showBidsModal && allBidLogs.length > 0) {
      console.log('📂 Modal opened, current bid logs:', allBidLogs.length);
      const latestBid = allBidLogs.sort((a, b) => 
        new Date(b.dateTimeUpdate).getTime() - new Date(a.dateTimeUpdate).getTime()
      )[0];
      console.log('📂 Latest bid amount:', JSON.parse(latestBid.newEntity).Bid?.BidAmount);
    }
  }, [showBidsModal]);

  // Update display price when auction changes (for instant UI update)
  useEffect(() => {
    if (auction) {
      const newPrice = auction.currentPrice || auction.startingPrice;
      if (newPrice !== displayPrice) {
        console.log('💰 Display price updated:', displayPrice, '→', newPrice);
        setDisplayPrice(newPrice);
      }
    }
  }, [auction?.currentPrice, auction?.startingPrice]);

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userStr = await AsyncStorage.getItem('userProfile');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUserProfile({ userId: user.userId, fullName: user.fullName });
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  // SignalR setup for real-time updates
  useEffect(() => {
    if (auctionId) {
      // Set current auction ID for global polling
      setCurrentAuctionId(auctionId as string);
      loadAuctionDetail();

      // Connect to SignalR and join auction group
      const setupSignalR = async () => {
        try {
          console.log('📡 SignalR: Starting connection setup...');
          await signalRService.connect();
          console.log('✅ SignalR: Connected to hub');
          
          const auctionIdStr = Array.isArray(auctionId) ? auctionId[0] : auctionId;
          await signalRService.joinAuctionGroup(auctionIdStr);
          console.log('✅ SignalR: Joined auction group:', auctionIdStr);
          
          return auctionIdStr;
        } catch (error) {
          console.error('❌ SignalR: Setup failed', error);
          throw error;
        }
      };

      // Subscribe to BidPlaced events FIRST, then connect
      console.log('🔔 SignalR: Registering BidPlaced subscriber before connection...');
      const unsubscribeBidPlaced = signalRService.onBidPlaced((event: BidPlacedEvent) => {
        console.log('');
        console.log('════════════════════════════════════════════════');
        console.log('🔔🔔🔔 BidPlaced event received 🔔🔔🔔');
        console.log('════════════════════════════════════════════════');
        console.log('   Event Details:');
        console.log('     - Auction ID (event):', event.auctionId);
        console.log('     - Bidder:', event.userName, `(ID: ${event.userId.substring(0, 8)}...)`);
        console.log('     - Bid Amount:', event.bidAmount);
        console.log('     - Price:', event.previousPrice, '→', event.newPrice);
        console.log('     - Timestamp:', event.placedAt);
        
        // Convert auctionId to string for comparison (in case it's array)
        const currentAuctionId = Array.isArray(auctionId) ? auctionId[0] : auctionId;
        
        console.log('   Current Auction ID:', currentAuctionId);
        console.log('   Event Auction ID:', event.auctionId);
        console.log('   Match?', event.auctionId === currentAuctionId);
        
        // Only refresh if event is for this auction
        if (event.auctionId === currentAuctionId) {
          console.log('✅✅✅ Event matches current auction, UPDATING UI! ✅✅✅');
          console.log(`💰 Price: ${event.previousPrice} → ${event.newPrice}`);
          console.log(`👤 Bidder: ${event.userName} (${event.userId})`);
          
          // Update auction current price immediately
          setAuction(prev => {
            console.log('💰 Updating auction price:', prev?.currentPrice, '→', event.newPrice);
            return prev ? { ...prev, currentPrice: event.newPrice } : prev;
          });
          
          // Also update display price directly for instant UI render
          setDisplayPrice(event.newPrice);
          console.log('🎨 UI: Display price set to', event.newPrice);
          
          // Create optimistic bid log for instant UI update
          const optimisticBidLog: BidLog = {
            id: `${event.bidId}-optimistic`,
            bidId: event.bidId,
            userId: event.userId,
            userName: event.userName,
            type: 'Updated',
            isAutoBidding: false,
            dateTimeUpdate: event.placedAt,
            oldEntity: JSON.stringify({
              Auction: { Price: event.previousPrice },
              Bid: { BidAmount: event.previousPrice }
            }),
            newEntity: JSON.stringify({
              Auction: { Price: event.newPrice },
              Bid: {
                UserId: event.userId,
                UserName: event.userName,
                BidAmount: event.bidAmount,
                IsAutoBid: false,
                IsWinning: true,
              }
            }),
            createdAt: event.placedAt,
            updatedAt: null,
          };
          
          // Add optimistic bid immediately for instant UX
          console.log('⚡ Adding optimistic bid:', event.bidAmount);
          setAllBidLogs(prev => {
            // Check if this exact timestamp already exists (avoid duplicate optimistic)
            const exists = prev.some(log => 
              log.dateTimeUpdate === event.placedAt
            );
            if (exists) {
              console.log('✓ Bid with same timestamp exists, skipping optimistic');
              return prev;
            }
            console.log('✓ Optimistic bid added, count:', prev.length + 1);
            return [optimisticBidLog, ...prev];
          });
          
          // Update notification count if modal is not open
          if (!showBidsModal && lastViewedBidTime) {
            const bidTime = new Date(event.placedAt).getTime();
            const lastViewed = new Date(lastViewedBidTime).getTime();
            if (bidTime > lastViewed) {
              setNewBidCount(prev => prev + 1);
            }
          }
          
          // ❌ REMOVED: API polling
          // SignalR-only approach: We trust the event data for real-time updates
          // If backend broadcasts properly, UI updates instantly without API delay
          // Optional future: Add delayed API sync verification
          // setTimeout(() => {
          //   const currentAuctionIdForLoad = Array.isArray(auctionId) ? auctionId[0] : auctionId;
          //   loadAllBidsQuietly(currentAuctionIdForLoad as string);
          //   loadBidsQuietly(currentAuctionIdForLoad as string);
          // }, 5000);
        } else {
          console.log('     ❌ NO MATCH - Event is for different auction');
          console.log('     Event auctionId:', event.auctionId);
          console.log('     Current auctionId:', Array.isArray(auctionId) ? auctionId[0] : auctionId);
          console.log('     Ignoring event');
        }
        console.log('════════════════════════════════════════════════');
        console.log('');
      });

      // Subscribe to BuyNow events
      const unsubscribeBuyNow = signalRService.onBuyNow((event: BuyNowEvent) => {
        console.log('');
        console.log('════════════════════════════════════════════════');
        console.log('🔔🔔🔔 BuyNow event received 🔔🔔🔔');
        console.log('════════════════════════════════════════════════');
        console.log('   Event Details:');
        console.log('     - Auction ID:', event.auctionId);
        console.log('     - Buyer:', event.userName);
        console.log('     - Buy Now Price:', event.buyNowPrice);
        console.log('     - Purchased At:', event.purchasedAt);
        
        const currentAuctionId = Array.isArray(auctionId) ? auctionId[0] : auctionId;
        if (event.auctionId === currentAuctionId) {
          console.log('     ✅ MATCH - This is for current auction');
          console.log('✅✅✅ Reloading auction detail now! ✅✅✅');
          // Reload auction detail to get updated status
          loadAuctionDetail();
        } else {
          console.log('     ❌ NO MATCH - Event is for different auction');
          console.log('     Ignoring event');
        }
        console.log('════════════════════════════════════════════════');
        console.log('');
      });

      // NOW connect and join group (after subscriptions are registered)
      console.log('🚀 SignalR: Now connecting to hub and joining auction group...');
      setupSignalR().then((joinedAuctionId) => {
        console.log('🔔 SignalR: Ready! Connection established and handlers are active');
        console.log('🔔 SignalR: Successfully joined auction group:', joinedAuctionId);
        console.log('🔔 SignalR: Waiting for BidPlaced and BuyNow events...');
      }).catch((error) => {
        console.error('❌ SignalR: Failed to setup after registering handlers:', error);
      });

      // Cleanup: Leave auction group and unsubscribe
      return () => {
        console.log('🧹 Cleanup: Auction detail effect cleaning up');
        setCurrentAuctionId(null);
        const currentAuctionId = Array.isArray(auctionId) ? auctionId[0] : auctionId;
        signalRService.leaveAuctionGroup(currentAuctionId as string);
        unsubscribeBidPlaced();
        unsubscribeBuyNow();
        console.log('🧹 Cleanup: Unsubscribed from all SignalR events');
      };
    }
  }, [auctionId, setCurrentAuctionId]);

  const loadAuctionDetail = async () => {
    try {
      setLoading(true);
      
      // Get full auction detail including harvests
      const auctionDetailData = await getAuctionDetail(auctionId as string);
      console.log('Auction detail:', auctionDetailData);
      
      if (auctionDetailData) {
        setAuction(auctionDetailData);
        // Calculate countdown immediately
        setCountdown(calculateCountdown(auctionDetailData.endDate));

        // Get farm and crop info from harvests
        const harvests = auctionDetailData.harvests || [];
        
        if (harvests.length > 0) {
          const farmsMap = new Map<string, Farm>();
          const cropsArray: Crop[] = [];

          // For each harvest, try to get farm and crop info
          for (const harvest of harvests) {
            try {
              // Try to get harvest details by ID which should have cropID
              const harvestDetail = await getHarvestById(harvest.id);
              console.log('Harvest detail:', harvestDetail);
              
              if (harvestDetail && harvestDetail.cropID) {
                // Get crop info
                try {
                  const cropData = await getCropById(harvestDetail.cropID);
                  if (cropData) {
                    cropsArray.push(cropData);
                    
                    // Get farm info from crop
                    if (cropData.farmID) {
                      try {
                        const farmData = await getFarmById(cropData.farmID);
                        if (farmData && 'data' in farmData && farmData.data) {
                          farmsMap.set(farmData.data.id, farmData.data);
                        }
                      } catch (error) {
                        console.log('Error getting farm:', error);
                      }
                    }
                  }
                } catch (error) {
                  console.log('Error getting crop:', error);
                }
              }
            } catch (error) {
              console.log('Error getting harvest detail:', error);
            }
          }

          if (cropsArray.length > 0) {
            setCrops(cropsArray);
          }
          if (farmsMap.size > 0) {
            setFarms(farmsMap);
          }
        }
      }
    } catch (error) {
      console.error('Error loading auction detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đấu giá');
    } finally {
      setLoading(false);
    }

    // Fetch bids for this auction if loaded successfully
    if (auctionId) {
      await loadBids(auctionId as string);
      await loadAllBids(auctionId as string);
    }
  };

  // Load farmer data
  useEffect(() => {
    const loadFarmer = async () => {
      if (!auction?.farmerId) return;
      
      try {
        setLoadingFarmer(true);
        const farmerUser = await getUserByUsername(auction.farmerId);
        if (farmerUser) {
          setFarmerData(farmerUser);
        }
      } catch (error) {
        console.error('Error loading farmer data:', error);
      } finally {
        setLoadingFarmer(false);
      }
    };

    loadFarmer();
  }, [auction?.farmerId]);

  // Update countdown every second
  useEffect(() => {
    if (!auction) return;

    // Set initial countdown
    setCountdown(calculateCountdown(auction.endDate));

    // Update every second
    const interval = setInterval(() => {
      setCountdown(calculateCountdown(auction.endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [auction]);

  const loadBids = useCallback(async (auctionSessionId: string) => {
    try {
      setLoadingBids(true);
      const bidsList = await getBidsForAuction(auctionSessionId);
      console.log('✅ Fetched user bids:', bidsList.length);
      setBids(bidsList);
    } catch (error) {
      console.error('❌ Error loading bids:', error);
      // Silently fail - bids not loading shouldn't block UI
    } finally {
      setLoadingBids(false);
    }
  }, []);

  // Quiet reload without loading indicator (for SignalR updates)
  const loadBidsQuietly = useCallback(async (auctionSessionId: string) => {
    try {
      const bidsList = await getBidsForAuction(auctionSessionId);
      console.log('✅ Quiet: Fetched user bids:', bidsList.length);
      setBids(bidsList);
    } catch (error) {
      console.error('❌ Quiet reload bids error:', error);
    }
  }, []);

  // Quiet reload for all bids (no loading indicator)
  const loadAllBidsQuietly = useCallback(async (
    auctionSessionId: string, 
    retryCount = 0, 
    previousCount?: number,
    previousLatestTime?: string
  ) => {
    try {
      console.log('🔄 Quiet: loadAllBids, retry:', retryCount);
      // NO setLoadingAllBids(true)!
      
      if (retryCount > 0) {
        const delay = 300 * retryCount;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const bidLogsList = await getAllBidsForAuction(auctionSessionId);
      console.log('✅ Quiet API: Fetched', bidLogsList.length, 'bid logs');
      
      let currentCount = previousCount;
      let latestTimestamp = previousLatestTime;
      
      if (currentCount === undefined || latestTimestamp === undefined) {
        await new Promise<void>((resolve) => {
          setAllBidLogs(prev => {
            currentCount = prev.length;
            if (prev.length > 0) {
              const sorted = [...prev].sort((a, b) => 
                new Date(b.dateTimeUpdate).getTime() - new Date(a.dateTimeUpdate).getTime()
              );
              latestTimestamp = sorted[0].dateTimeUpdate;
            }
            resolve();
            return prev;
          });
        });
      }
      
      let hasNewerData = false;
      if (bidLogsList.length > 0 && latestTimestamp) {
        const apiLatestTime = new Date(bidLogsList[0].dateTimeUpdate).getTime();
        const stateLatestTime = new Date(latestTimestamp).getTime();
        hasNewerData = apiLatestTime > stateLatestTime;
      } else if (bidLogsList.length > (currentCount || 0)) {
        hasNewerData = true;
      }
      
      if (retryCount < 2 && !hasNewerData) {
        return loadAllBidsQuietly(auctionSessionId, retryCount + 1, currentCount, latestTimestamp);
      }
      
      if (!hasNewerData && retryCount >= 2) {
        console.log('⏭️ Quiet: Max retries, keeping optimistic');
        return;
      }
      
      setAllBidLogs(bidLogsList);
      console.log('✅ Quiet: State updated');
      
      // Extract and update auction current price from latest bid
      if (bidLogsList.length > 0) {
        try {
          const latestBid = bidLogsList[0];
          const newEntityData = JSON.parse(latestBid.newEntity);
          const newPrice = newEntityData?.Auction?.Price;
          
          if (newPrice && newPrice !== auction?.currentPrice) {
            console.log('💰 Quiet: Updating auction price:', auction?.currentPrice, '→', newPrice);
            setAuction(prev => prev ? { ...prev, currentPrice: newPrice } : prev);
            setDisplayPrice(newPrice);
          }
        } catch (e) {
          console.log('⚠️ Could not extract price from bid');
        }
      }
    } catch (error) {
      console.error('❌ Quiet reload error:', error);
    }
  }, []);

  const loadAllBids = useCallback(async (
    auctionSessionId: string, 
    retryCount = 0, 
    previousCount?: number,
    previousLatestTime?: string
  ) => {
    try {
      console.log('🔄 START: loadAllBids called for auction:', auctionSessionId, 'retry:', retryCount);
      setLoadingAllBids(true);
      
      // Add small delay to let backend sync
      if (retryCount > 0) {
        const delay = 300 * retryCount; // 300ms, 600ms, 900ms
        console.log(`⏳ Waiting ${delay}ms for backend to sync...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const bidLogsList = await getAllBidsForAuction(auctionSessionId);
      console.log('✅ API Response: Fetched', bidLogsList.length, 'bid logs');
      
      // Debug: Log first 3 bids
      if (bidLogsList.length > 0) {
        console.log('📋 First 3 bids from API:');
        bidLogsList.slice(0, 3).forEach((bid, idx) => {
          console.log(`  ${idx + 1}. ${bid.userName} - ${bid.type} - Amount: ${JSON.parse(bid.newEntity).Bid?.BidAmount || 'N/A'} - Time: ${bid.dateTimeUpdate}`);
        });
      }
      
      // Get current count and latest timestamp from state
      let currentCount = previousCount;
      let latestTimestamp = previousLatestTime;
      
      if (currentCount === undefined || latestTimestamp === undefined) {
        // First call, read from current state
        await new Promise<void>((resolve) => {
          setAllBidLogs(prev => {
            currentCount = prev.length;
            // Get the latest timestamp (newest bid)
            if (prev.length > 0) {
              const sorted = [...prev].sort((a, b) => 
                new Date(b.dateTimeUpdate).getTime() - new Date(a.dateTimeUpdate).getTime()
              );
              latestTimestamp = sorted[0].dateTimeUpdate;
              console.log('📊 Current state count:', currentCount, '| Latest bid time:', latestTimestamp);
            } else {
              console.log('📊 Current state count:', currentCount);
            }
            resolve();
            return prev; // Don't update yet
          });
        });
      }
      
      // Check if API has newer data by comparing timestamps
      let hasNewerData = false;
      if (bidLogsList.length > 0 && latestTimestamp) {
        const apiLatestTime = new Date(bidLogsList[0].dateTimeUpdate).getTime();
        const stateLatestTime = new Date(latestTimestamp).getTime();
        // Use >= instead of > because we want to update if data is same or newer
        // This ensures we replace optimistic bids with real data from backend
        hasNewerData = apiLatestTime >= stateLatestTime;
        console.log('🔍 API latest:', bidLogsList[0].dateTimeUpdate, '| State latest:', latestTimestamp, '| Newer?', hasNewerData);
      } else if (bidLogsList.length > (currentCount || 0)) {
        hasNewerData = true; // Count increased
        console.log('🔍 Count increased:', bidLogsList.length, '>', currentCount, '| Newer? true');
      } else if (bidLogsList.length > 0 && !latestTimestamp) {
        // First time loading bids
        hasNewerData = true;
        console.log('🔍 First load: API has', bidLogsList.length, 'bids | Newer? true');
      }
      
      // Always update state with API data (don't keep optimistic bids)
      // API data is the source of truth from backend
      if (bidLogsList.length > 0) {
        console.log('✅ Using API data (', bidLogsList.length, 'bids) as source of truth');
        setLoadingAllBids(false);
        setAllBidLogs(bidLogsList);
        console.log('📝 Setting state with', bidLogsList.length, 'bids from API');
        
        // Extract and update auction current price from latest bid
        try {
          const latestBid = bidLogsList[0];
          const newEntityData = JSON.parse(latestBid.newEntity);
          const newPrice = newEntityData?.Auction?.Price;
          
          if (newPrice && newPrice !== auction?.currentPrice) {
            console.log('💰 Updating auction price:', auction?.currentPrice, '→', newPrice);
            setAuction(prev => prev ? { ...prev, currentPrice: newPrice } : prev);
            setDisplayPrice(newPrice);
            console.log('🎨 Display price updated to:', newPrice);
          }
        } catch (e) {
          console.log('⚠️ Could not extract price from bid');
        }
        
        console.log('🏁 END: loadAllBids completed');
        return;
      }
      
      // Check if we need to retry
      if (retryCount < 2 && !hasNewerData) {
        console.log(`⚠️ No newer data yet, retrying...`);
        setLoadingAllBids(false);
        return loadAllBids(auctionSessionId, retryCount + 1, currentCount, latestTimestamp);
      }
      
      // If still no newer data after retries, keep optimistic updates
      if (!hasNewerData && retryCount >= 2) {
        console.log('⏭️ Max retries reached, keeping optimistic data');
        setLoadingAllBids(false);
        console.log('🏁 END: loadAllBids completed');
        return; // Don't update state, keep optimistic bids
      }
      
      console.log('📝 Setting state with new data...');
      // Remove optimistic bids and replace with real data
      setAllBidLogs(bidLogsList);
      console.log('✅ State setAllBidLogs called successfully');
    } catch (error) {
      console.error('❌ Error loading all bids:', error);
      // Silently fail - all bids not loading shouldn't block UI
    } finally {
      setLoadingAllBids(false);
      console.log('🏁 END: loadAllBids completed');
    }
  }, []);



  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload auction detail and bids
      if (auctionId) {
        await loadAuctionDetail();
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenBidsModal = () => {
    setShowBidsModal(true);
    setNewBidCount(0);
    if (allBidLogs.length > 0) {
      setLastViewedBidTime(allBidLogs[0].dateTimeUpdate);
    }
    // Reload bids when modal opens to show latest data
    if (auctionId) {
      const currentAuctionId = Array.isArray(auctionId) ? auctionId[0] : auctionId;
      loadAllBidsQuietly(currentAuctionId as string);
    }
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateCountdown = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) {
      return {
        days: '00',
        hours: '00',
        minutes: '00',
        seconds: '00',
        isEnded: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      isEnded: false,
    };
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Đã kết thúc';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  };

  const statusInfo = auction ? getAuctionStatusInfo(auction.status) : null;
  const currentPrice = displayPrice || (auction ? (auction.currentPrice || auction.startingPrice) : 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đấu giá</Text>
        {!loading && auction && (
          <TouchableOpacity
            style={styles.bellButton}
            onPress={handleOpenBidsModal}
          >
            <Bell size={24} color="#374151" />
            {newBidCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {newBidCount > 99 ? '99+' : newBidCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        {(loading || !auction) && <View style={{ width: 40 }} />}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : !auction ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy đấu giá</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#22C55E']}
              tintColor="#22C55E"
            />
          }
        >
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.auctionHeader}>
            {statusInfo && (
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusInfo.backgroundColor }
                ]}
              >
                <Text style={[styles.statusText, { color: statusInfo.color }]}>
                  {statusInfo.name}
                </Text>
              </View>
            )}
            <Text style={styles.sessionCode}>{auction.sessionCode}</Text>
          </View>

          <View style={styles.divider} />

          {/* Price Information */}
          <View style={styles.subsectionContainer}>
            <Text style={styles.subsectionTitle}>Thông tin giá</Text>
            <View style={styles.subsectionContent}>
              <View style={styles.infoRow}>
                {/* <DollarSign size={20} color="#059669" /> */}
                <Text style={styles.infoLabel}>Giá khởi điểm</Text>
                <Text style={styles.infoValue}>{formatCurrency(auction.startingPrice)}</Text>
              </View>

              {currentPrice > 0 && (
                <View style={styles.infoRow}>
                  {/* <DollarSign size={20} color="#DC2626" /> */}
                  <Text style={styles.infoLabel}>Giá hiện tại</Text>
                  <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: 'bold' }]}>
                    {formatCurrency(currentPrice)}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.bidIncrementText}>
                  Bước giá tối thiểu: {formatCurrency(auction.minBidIncrement)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.miniDivider} />

          {/* Time Information */}
          <View style={styles.subsectionContainer}>
            <Text style={styles.subsectionTitle}>Thời gian</Text>
            
            {/* Countdown Flip Clock */}
            {countdown && (
              <View style={styles.countdownContainer}>
                <FlipClockDigit value={countdown.days} label="Ngày" />
                <FlipClockDigit value={countdown.hours} label="Giờ" />
                <FlipClockDigit value={countdown.minutes} label="Phút" />
                <FlipClockDigit value={countdown.seconds} label="Giây" />
              </View>
            )}

            <View style={styles.subsectionContent}>
              <View style={styles.infoRow}>
                {/* <Calendar size={20} color="#16A34A" /> */}
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Bắt đầu</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(auction.publishDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                {/* <Calendar size={20} color="#16A34A" /> */}
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Kết thúc</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(auction.endDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                {/* <Calendar size={20} color="#16A34A" /> */}
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Thu hoạch dự kiến</Text>
                <Text style={styles.infoValue}>
                  {formatDate(auction.expectedHarvestDate)}
                </Text>
              </View>
            </View>
          </View>

          {/* Farmer Information */}
          {farmerData && (
            <>
              <View style={styles.miniDivider} />
              <View style={styles.subsectionContainer}>
                <Text style={styles.subsectionTitle}>Thông tin nông dân</Text>
                <View style={styles.subsectionContent}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Họ tên</Text>
                    <Text style={styles.infoValue}>
                      {farmerData.firstName && farmerData.lastName 
                        ? `${farmerData.firstName} ${farmerData.lastName}` 
                        : 'Chưa cập nhật'}
                    </Text>
                  </View>
                  {/* <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Số điện thoại</Text>
                    <Text style={styles.infoValue}>{farmerData.phoneNumber || 'Chưa cập nhật'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{farmerData.email || 'Chưa cập nhật'}</Text>
                  </View> */}
                  {farmerData.address && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Địa chỉ</Text>
                      <Text style={styles.infoValue}>{farmerData.address}</Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

        </View>

        {/* Escrow Payment Section - Only show if user is winner */}
        {userProfile && (
          <View style={styles.section}>
            <EscrowPaymentButton
              auctionId={auction.id}
              isWinner={true}
              currentPrice={currentPrice}
              onPaymentComplete={() => {
                // Reload auction detail after payment
                loadAuctionDetail();
              }}
            />
          </View>
        )}

        {/* Harvest Information */}
        {auction.harvests && auction.harvests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin vụ thu hoạch</Text>
            {auction.harvests.map((harvest, index) => (
              <View key={harvest.id} style={styles.harvestCard}>
                {/* <View style={styles.harvestHeader}>
                  <Text style={styles.harvestTitle}>Vụ {index + 1}</Text>
                </View> */}

                <View style={styles.currentHarvestDetails}>
                  {harvest.harvestDate ? (
                    <View style={styles.harvestDetailRow}>
                      {/* <Calendar size={16} color="#059669" /> */}
                      <Text style={styles.harvestDetailLabel}>Ngày thu hoạch:</Text>
                      <Text style={styles.harvestDetailValue}>
                        {formatDate(harvest.harvestDate)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.harvestDetailRow}>
                      {/* <Calendar size={16} color="#F59E0B" /> */}
                      <Text style={styles.harvestDetailLabel}>Bắt đầu:</Text>
                      <Text style={styles.harvestDetailValue}>
                        {formatDate(harvest.startDate)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.harvestDetailRow}>
                    {/* <Package size={16} color="#059669" /> */}
                    <Text style={styles.harvestDetailLabel}>Tổng số lượng:</Text>
                    <Text style={styles.harvestDetailValue}>
                      {harvest.totalQuantity} {harvest.unit}
                    </Text>
                  </View>

                  {harvest.salePrice > 0 && (
                    <View style={styles.harvestDetailRow}>
                      {/* <DollarSign size={16} color="#059669" /> */}
                      <Text style={styles.harvestDetailLabel}>Giá bán:</Text>
                      <Text style={styles.harvestDetailValue}>
                        {formatCurrency(harvest.salePrice)}
                      </Text>
                    </View>
                  )}

                  {harvest.note && harvest.note !== 'Không có' && (
                    <View style={styles.harvestDetailRow}>
                      <Text style={styles.harvestNote}>Ghi chú: {harvest.note}</Text>
                    </View>
                  )}
                </View>

                {/* Harvest Images Gallery */}
                <HarvestImagesGallery harvestId={harvest.id} />

                {/* Harvest Grade Details */}
                {harvest.harvestGradeDetails && harvest.harvestGradeDetails.length > 0 && (
                  <View style={styles.gradeDetailsSection}>
                    <Text style={styles.gradeDetailsSectionTitle}>
                      Chi tiết phân loại chất lượng:
                    </Text>
                    {harvest.harvestGradeDetails.map((gradeDetail) => {
                      const gradeMap: { [key: string]: { name: string; color: string } } = {
                        'Grade1': { name: 'Hàng Loại 1', color: '#10B981' },
                        'Grade2': { name: 'Hàng Loại 2', color: '#F59E0B' },
                        'Grade3': { name: 'Hàng Loại 3', color: '#EF4444' },
                      };
                      const gradeInfo = gradeMap[gradeDetail.grade] || { name: gradeDetail.grade, color: '#6B7280' };
                      
                      return (
                        <View key={gradeDetail.id} style={styles.gradeDetailRow}>
                          <Text style={styles.gradeName}>
                            {gradeInfo.name}
                          </Text>
                          <Text style={styles.gradeQuantity}>
                            {gradeDetail.quantity} {gradeDetail.unit || 'kg'}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Total calculation */}
                    <View style={styles.gradeTotalRow}>
                      <Text style={styles.gradeTotalLabel}>Tổng cộng:</Text>
                      <Text style={styles.gradeTotalValue}>
                        {harvest.harvestGradeDetails.reduce((sum, grade) => sum + grade.quantity, 0)} kg
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Crop Information */}
        {crops.length > 0 && crops.map((crop, cropIndex) => {
          const farm = crop.farmID ? farms.get(crop.farmID) : null;
          const currentHarvest = currentHarvests[crop.id];
          
          return (
            <View key={crop.id} style={styles.section}>
              {/* <Text style={styles.sectionTitle}>Chi tiết vườn</Text> */}

              {/* Farm Information */}
              {farm && (
                <Text style={styles.subsectionTitle}>Thông tin vườn - {farm.name}</Text>
              )}

              {/* Crop Details */}
              <View style={styles.miniDivider} />
              <Text style={styles.subsectionTitle}>Thông tin vườn trồng</Text>
              <View style={styles.cropCard}>
                <View style={styles.cropHeader}>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropTitle}>{crop.name}</Text>
                    <Text style={styles.cropSubtitle}>
                      {crop.custardAppleType} • {crop.area} m²
                    </Text>
                  </View>
                </View>

                <View style={styles.cropDetails}>
                  <View style={styles.cropDetailRow}>
                    <Text style={styles.cropDetailLabel}>Số cây:</Text>
                    <Text style={styles.cropDetailValue}>{crop.treeCount} cây</Text>
                  </View>
                  <View style={styles.cropDetailRow}>
                    <Text style={styles.cropDetailLabel}>Thời gian canh tác:</Text>
                    <Text style={styles.cropDetailValue}>{crop.farmingDuration} năm</Text>
                  </View>
                  {crop.nearestHarvestDate && (
                    <View style={styles.cropDetailRow}>
                      <Text style={styles.cropDetailLabel}>Thu hoạch gần nhất:</Text>
                      <Text style={styles.cropDetailValue}>{formatDate(crop.nearestHarvestDate)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Current Harvest Section */}
              {currentHarvest && (
                <>
                  <Text style={styles.subsectionTitle}>Vụ thu hoạch hiện tại</Text>
                  <View style={styles.harvestCard}>
                    <View style={styles.currentHarvestDetails}>
                      {currentHarvest.harvestDate ? (
                        <View style={styles.harvestDetailRow}>
                          <Calendar size={16} color="#059669" />
                          <Text style={styles.harvestDetailLabel}>Ngày thu hoạch:</Text>
                          <Text style={styles.harvestDetailValue}>
                            {formatDate(currentHarvest.harvestDate)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.harvestDetailRow}>
                          <Calendar size={16} color="#F59E0B" />
                          <Text style={styles.harvestDetailLabel}>Bắt đầu:</Text>
                          <Text style={styles.harvestDetailValue}>
                            {formatDate(currentHarvest.startDate)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.harvestDetailRow}>
                        <Package size={16} color="#059669" />
                        <Text style={styles.harvestDetailLabel}>Tổng số lượng:</Text>
                        <Text style={styles.harvestDetailValue}>
                          {currentHarvest.totalQuantity} {currentHarvest.unit}
                        </Text>
                      </View>

                      {currentHarvest.salePrice > 0 && (
                        <View style={styles.harvestDetailRow}>
                          {/* <DollarSign size={16} color="#059669" /> */}
                          <Text style={styles.harvestDetailLabel}>Giá bán:</Text>
                          <Text style={styles.harvestDetailValue}>
                            {formatCurrency(currentHarvest.salePrice)}
                          </Text>
                        </View>
                      )}

                      {currentHarvest.note && currentHarvest.note !== 'không có' && (
                        <View style={styles.harvestDetailRow}>
                          <Text style={styles.harvestNote}>Ghi chú: {currentHarvest.note}</Text>
                        </View>
                      )}
                    </View>

                    {/* Harvest Grade Details */}
                    {currentHarvest.harvestGradeDetailDTOs && currentHarvest.harvestGradeDetailDTOs.length > 0 && (
                      <View style={styles.gradeDetailsSection}>
                        <Text style={styles.gradeDetailsSectionTitle}>
                          Chi tiết phân loại chất lượng:
                        </Text>
                        {currentHarvest.harvestGradeDetailDTOs.map((gradeDetail) => {
                          const gradeNames: { [key: number]: string } = {
                            1: 'Hàng Loại 1',
                            2: 'Hàng Loại 2',
                            3: 'Hàng Loại 3',
                          };
                          const gradeColors: { [key: number]: string } = {
                            1: '#10B981', // Green
                            2: '#F59E0B', // Yellow
                            3: '#EF4444', // Red
                          };
                          return (
                            <View key={gradeDetail.id} style={styles.gradeDetailRow}>
                              <Text style={styles.gradeName}>
                                {gradeNames[gradeDetail.grade] || `Hạng ${gradeDetail.grade}`}
                              </Text>
                              <Text style={styles.gradeQuantity}>
                                {gradeDetail.quantity} {gradeDetail.unit || 'kg'}
                              </Text>
                            </View>
                          );
                        })}

                        {/* Total calculation */}
                        <View style={styles.gradeTotalRow}>
                          <Text style={styles.gradeTotalLabel}>Tổng cộng:</Text>
                          <Text style={styles.gradeTotalValue}>
                            {currentHarvest.harvestGradeDetailDTOs.reduce((sum, grade) => sum + grade.quantity, 0)} kg
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          );
        })}

        {/* Bid List Display - Show first if user has bids */}
        <BidListDisplay
          bids={bids}
          loading={loadingBids}
          minBidIncrement={auction?.minBidIncrement || 0}
          auctionStatus={auction?.status}
          onEditBid={(bid) => {
            setSelectedBidForEdit(bid);
            setShowBidModal(true);
          }}
        />

        {/* Bidding Button - Show after bid list if no bids, or after all bids if has bids */}
        {bids.length === 0 && (
          <TouchableOpacity 
            style={[
              styles.bidButton,
              (!auction || auction.status !== 'OnGoing') && styles.bidButtonDisabled
            ]}
            onPress={() => {
              if (auction?.status !== 'OnGoing') {
                Alert.alert(
                  'Không thể đấu giá',
                  'Phiên đấu giá này không còn hoạt động. Chỉ có thể xem thông tin.',
                  [{ text: 'OK' }]
                );
                return;
              }
              console.log('Bid button pressed, current auction status:', auction?.status);
              setSelectedBidForEdit(undefined);
              setShowBidModal(true);
            }}
            disabled={!auction || auction.status !== 'OnGoing'}
          >
            <Text style={[styles.bidButtonText, auction?.status !== 'OnGoing' && { color: '#9CA3AF' }]}>
              {auction?.status === 'OnGoing' ? 'Tham gia đấu giá' : 'Chỉ xem'}
            </Text>
          </TouchableOpacity>
        )}
        </ScrollView>
      )}

      {/* Create Bid Modal */}
      {auction && (
            <CreateBidModal
              visible={showBidModal}
              onClose={() => {
                console.log('Closing bid modal');
                setShowBidModal(false);
                setSelectedBidForEdit(undefined);
              }}
              onBidCreated={() => {
                // When user creates/updates bid, trigger data refresh
                console.log('✅ Bid created! Updating UI...');
                
                // Try SignalR event first (instant update)
                console.log('   1️⃣ Waiting for SignalR BidPlaced event from backend...');
                
                // But also trigger API fetch as fallback (in case SignalR doesn't send event)
                const currentAuctionIdStr = Array.isArray(auctionId) ? auctionId[0] : auctionId;
                console.log('   2️⃣ Simultaneously fetching fresh data from API...');
                
                // Fetch immediately without delay
                setTimeout(() => {
                  console.log('💬 Waiting for SignalR event to update UI...');
                }, 100); // Small delay before SignalR event should fire
              }}
              currentPrice={auction.currentPrice || auction.startingPrice}
              minBidIncrement={auction.minBidIncrement}
              auctionSessionId={auction.id}
              sessionCode={auction.sessionCode}
              existingBid={selectedBidForEdit}
              auctionStatus={auction.status}
              userProfile={userProfile}
              startingPrice={auction.startingPrice}
              buyNowPrice={auction.buyNowPrice}
            />
          )}

          {/* All Bids Modal */}
          <Modal
            visible={showBidsModal}
            animationType="slide"
            onRequestClose={() => setShowBidsModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity
                  style={styles.modalBackButton}
                  onPress={() => setShowBidsModal(false)}
                >
                  <ArrowLeft size={20} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Tất cả lượt đấu giá</Text>
                <View style={{ width: 40 }} />
              </View>
              <ScrollView style={styles.modalContent}>
                <AllBidsDisplay
                  key={`bids-${allBidLogs.length}-${allBidLogs[0]?.id || 'empty'}`}
                  bidLogs={allBidLogs}
                  loading={loadingAllBids}
                />
              </ScrollView>
            </View>
          </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  subsectionContainer: {
    marginBottom: 12,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 6,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginTop: 4,
  },
  subsectionContent: {
    paddingLeft: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  bidIncrementText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  miniDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  auctionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  sessionCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Farm Card Styles
  farmCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmInfo: {
    marginLeft: 12,
    flex: 1,
  },
  farmTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  farmSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Crop Card Styles
  cropCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F9FAFB',
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  cropSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cropDetails: {
    paddingLeft: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  cropDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cropDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  cropDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Harvest Card Styles
  harvestCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  harvestHeader: {
    marginBottom: 12,
  },
  harvestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  currentHarvestDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  harvestDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  harvestDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  harvestDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  harvestNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 24,
  },

  // Grade Details Section
  gradeDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  gradeDetailsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  gradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 6,
  },
  gradeDetailContent: {
    flex: 1,
  },
  gradeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  gradeQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  gradeBadge: {
    marginLeft: 12,
  },
  gradeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gradeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  gradeTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  gradeTotalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Bidding Button
  bidButton: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  bidButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  bidButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  bellButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBackButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
  },
});
