import { createContext, useContext, useEffect, useState } from 'react';
import { useMargin } from './marginContext';

// Liquidation modal context
interface LiquidationModal {
  open: boolean;
  setOpen: (open: boolean) => void;
  closed: boolean;
  setClosed: (closed: boolean) => void;
}
const LiquidationModalContext = createContext<LiquidationModal>({
  open: false,
  setOpen: () => null,
  closed: false,
  setClosed: () => null
});

// Liquidation modal context provider
export function LiquidationModalProvider(props: { children: any }): JSX.Element {
  const [open, setOpen] = useState(false);
  const [closed, setClosed] = useState(false);
  const { marginAccount } = useMargin();
  useEffect(() => {
    if (marginAccount?.isBeingLiquidated && !closed) {
      setOpen(true);
    }
  }, [closed, marginAccount?.isBeingLiquidated]);

  return (
    <LiquidationModalContext.Provider
      value={{
        open,
        setOpen,
        closed,
        setClosed
      }}>
      {props.children}
    </LiquidationModalContext.Provider>
  );
}

//  Liquidation modal hook
export const useLiquidationModal = () => {
  const context = useContext(LiquidationModalContext);
  return context;
};
