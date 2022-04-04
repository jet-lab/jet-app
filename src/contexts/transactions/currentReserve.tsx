import { createContext, useContext, useEffect, useState } from 'react';
import type { ReserveData } from '@jet-lab/jet-engine';
import { market } from '../../hooks/jet-engine/useClient';

// Current reserve
interface ReserveInfo {
  currentReserve: ReserveData | null;
  setCurrentReserve: (reserve: ReserveData | null) => void;
}
const CurrentReserve = createContext<ReserveInfo>({
  currentReserve: null,
  setCurrentReserve: () => null
});

// Current reserve provider
export function CurrentReserveProvider(props: { children: JSX.Element }): JSX.Element {
  const [currentReserve, setCurrentReserve] = useState<ReserveData | null>(null);
  useEffect(() => setCurrentReserve(market.reserves.SOL), [market.marketInit]);

  return (
    <CurrentReserve.Provider
      value={{
        currentReserve,
        setCurrentReserve
      }}>
      {props.children}
    </CurrentReserve.Provider>
  );
}

// Current reserve hook
export const useCurrentReserve = () => {
  const context = useContext(CurrentReserve);
  return context;
};
