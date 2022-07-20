import { createContext, useContext, useEffect, useState } from 'react';
import { useMargin } from './marginContext';

// Liquidation modal context
interface LiquidationModal {
  isDisplayed: boolean;
  setIsDisplayed: (open: boolean) => void;
}
const LiquidationModalContext = createContext<LiquidationModal>({
  isDisplayed: false,
  setIsDisplayed: () => null
});

// Liquidation modal context provider
export function LiquidationModalProvider(props: { children: any }): JSX.Element {
  const [isDisplayed, setIsDisplayed] = useState(false);
  const { marginAccount } = useMargin();
  useEffect(() => {
    if (marginAccount?.isBeingLiquidated && !isDisplayed) {
      setIsDisplayed(true);
    }
  }, [isDisplayed, marginAccount?.isBeingLiquidated]);

  return (
    <LiquidationModalContext.Provider
      value={{
        isDisplayed,
        setIsDisplayed
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
