import { createContext, useContext, useState } from 'react';

// Jet V1
import { Reserve } from '../v1/models/JetTypes';

// Current trade info UI context
export type TradeAction = 'deposit' | 'withdraw' | 'borrow' | 'repay';
interface TradeInfo {
  currentReserve: Reserve | null;
  setCurrentReserve: (reserve: Reserve) => void;
  currentAction: TradeAction;
  setCurrentAction: (action: TradeAction) => void;
}
const TradeContext = createContext<TradeInfo>({
  currentReserve: null,
  setCurrentReserve: () => null,
  currentAction: 'deposit',
  setCurrentAction: () => null
});

// Trade info context provider
export function TradeContextProvider(props: { children: JSX.Element }): JSX.Element {
  const [currentReserve, setCurrentReserve] = useState<Reserve | null>(null);
  const [currentAction, setCurrentAction] = useState('deposit' as TradeAction);

  return (
    <TradeContext.Provider
      value={{
        currentReserve,
        setCurrentReserve,
        currentAction,
        setCurrentAction
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
