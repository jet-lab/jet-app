import { createContext, useContext, useEffect, useState } from 'react';
import type { ReserveData } from '@jet-lab/jet-engine';
import { market } from '../../hooks/jet-engine/useClient';

// Borrow / repay input amount
interface InputInfo {
  inputAmount: number | null;
  setInputAmount: (amount: number | null) => void;
}
const BorrowRepayInput = createContext<InputInfo>({
  inputAmount: null,
  setInputAmount: () => null
});

// Borrow / repay input amount provider
export function BorrowRepayInputProvider(props: { children: JSX.Element }): JSX.Element {
  const [inputAmount, setInputAmount] = useState<number | null>(null);

  return (
    <BorrowRepayInput.Provider
      value={{
        inputAmount,
        setInputAmount
      }}>
      {props.children}
    </BorrowRepayInput.Provider>
  );
}

// Borrow / repay input amount hook
export const useBorrowRepayInput = () => {
  const context = useContext(BorrowRepayInput);
  return context;
};
