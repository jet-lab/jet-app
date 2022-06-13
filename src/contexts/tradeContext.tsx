import { Pool } from '@jet-lab/margin';
import { createContext, useContext, useState } from 'react';

// Jet V1
import { Reserve } from '../v1/models/JetTypes';

// Current trade info UI context
export type TradeAction = 'deposit' | 'withdraw' | 'borrow' | 'repay';
interface TradeInfo {
  /** @deprecated */
  currentReserve: Reserve | null;
  /** @deprecated */
  setCurrentReserve: (reserve: Reserve) => void;
  currentPool: Pool | undefined;
  setCurrentPool: (pool: Pool) => void;
  currentAction: TradeAction;
  setCurrentAction: (action: TradeAction) => void;
  currentAmount: number | null;
  setCurrentAmount: (amount: number | null) => void;
  sendingTrade: boolean;
  setSendingTrade: (sending: boolean) => void;
}
const TradeContext = createContext<TradeInfo>({
  currentReserve: null,
  setCurrentReserve: () => null,
  currentPool: undefined,
  setCurrentPool: () => null,
  currentAction: 'deposit',
  setCurrentAction: () => null,
  currentAmount: null,
  setCurrentAmount: () => null,
  sendingTrade: false,
  setSendingTrade: () => null
});

// Trade info context provider
export function TradeContextProvider(props: { children: JSX.Element }): JSX.Element {
  const [currentReserve, setCurrentReserve] = useState<Reserve | null>(null);
  const [currentPool, setCurrentPool] = useState<Pool | undefined>();
  const [currentAction, setCurrentAction] = useState('deposit' as TradeAction);
  const [currentAmount, setCurrentAmount] = useState<number | null>(null);
  const [sendingTrade, setSendingTrade] = useState<boolean>(false);

  return (
    <TradeContext.Provider
      value={{
        currentReserve,
        setCurrentReserve,
        currentPool,
        setCurrentPool,
        currentAction,
        setCurrentAction,
        currentAmount,
        setCurrentAmount,
        sendingTrade,
        setSendingTrade
      }}>
      {props.children}
    </TradeContext.Provider>
  );
}

// Trade info hook
export const useTradeContext = () => {
  const context = useContext(TradeContext);
  return context;
};
