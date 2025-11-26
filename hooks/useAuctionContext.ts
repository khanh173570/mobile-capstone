import { createContext, useContext, useState, useCallback } from 'react';

interface AuctionContextType {
  currentAuctionId: string | null;
  setCurrentAuctionId: (id: string | null) => void;
}

const AuctionContext = createContext<AuctionContextType | null>(null);

export const useAuctionContext = () => {
  const context = useContext(AuctionContext);
  if (!context) {
    throw new Error('useAuctionContext must be used within AuctionProvider');
  }
  return context;
};

export { AuctionContext };
