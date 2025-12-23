import { useEffect, useRef } from 'react';
import { signalRService, BidPlacedEvent, BuyNowEvent } from '../services/signalRService';

interface UseAuctionSignalROptions {
  auctionId: string | null;
  onBidPlaced?: (event: BidPlacedEvent) => void;
  onBuyNow?: (event: BuyNowEvent) => void;
  autoJoin?: boolean; // Auto join/leave auction group
}

/**
 * Custom hook for using SignalR in auction detail pages
 * 
 * @example
 * ```tsx
 * useAuctionSignalR({
 *   auctionId: auction.id,
 *   onBidPlaced: (event) => {
 *     //console.log('New bid:', event.bidAmount);
 *     setCurrentPrice(event.newPrice);
 *     loadBids();
 *   },
 *   onBuyNow: (event) => {
 *     Alert.alert('Sold!', `Auction sold to ${event.userName}`);
 *   },
 * });
 * ```
 */
export const useAuctionSignalR = ({
  auctionId,
  onBidPlaced,
  onBuyNow,
  autoJoin = true,
}: UseAuctionSignalROptions) => {
  const isJoinedRef = useRef(false);

  useEffect(() => {
    if (!auctionId) return;

    // Auto join auction group if enabled
    if (autoJoin && !isJoinedRef.current) {
      const joinGroup = async () => {
        try {
          await signalRService.connect();
          await signalRService.joinAuctionGroup(auctionId);
          isJoinedRef.current = true;
          //console.log('useAuctionSignalR: Joined auction group', auctionId);
        } catch (error) {
          console.error('useAuctionSignalR: Failed to join auction group', error);
        }
      };
      joinGroup();
    }

    // Subscribe to events
    const unsubscribeBidPlaced = onBidPlaced
      ? signalRService.onBidPlaced((event) => {
          if (event.auctionId === auctionId) {
            onBidPlaced(event);
          }
        })
      : () => {};

    const unsubscribeBuyNow = onBuyNow
      ? signalRService.onBuyNow((event) => {
          if (event.auctionId === auctionId) {
            onBuyNow(event);
          }
        })
      : () => {};

    // Cleanup
    return () => {
      unsubscribeBidPlaced();
      unsubscribeBuyNow();
      
      if (autoJoin && isJoinedRef.current) {
        signalRService.leaveAuctionGroup(auctionId);
        isJoinedRef.current = false;
        //console.log('useAuctionSignalR: Left auction group', auctionId);
      }
    };
  }, [auctionId, onBidPlaced, onBuyNow, autoJoin]);
};
