import { createContext, useContext, useState } from 'react';

// If currently sending a trancation
interface SendingInfo {
  sendingTransaction: boolean;
  setSendingTransaction: (sending: boolean) => void;
}
const SendingTransaction = createContext<SendingInfo>({
  sendingTransaction: false,
  setSendingTransaction: () => null
});

// Sending transaction provider
export function SendingTransactionProvider(props: { children: JSX.Element }): JSX.Element {
  const [sendingTransaction, setSendingTransaction] = useState<boolean>(false);

  return (
    <SendingTransaction.Provider
      value={{
        sendingTransaction,
        setSendingTransaction
      }}>
      {props.children}
    </SendingTransaction.Provider>
  );
}

// Sending transaction hook
export const useSendingTransaction = () => {
  const context = useContext(SendingTransaction);
  return context;
};
