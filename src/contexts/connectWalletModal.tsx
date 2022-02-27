import { createContext, useContext, useState } from 'react';

// Connect wallet modal context
interface ConnectWalletModal {
  connecting: boolean;
  setConnecting: (connecting: boolean) => void;
}
const ConnectWalletModalContext = createContext<ConnectWalletModal>({
  connecting: false,
  setConnecting: () => {}
});

// Connect wallet modal context provider
export function ConnectWalletModalProvider(props: { children: any }) {
  const [connecting, setConnecting] = useState(false);
  return (
    <ConnectWalletModalContext.Provider
      value={{
        connecting,
        setConnecting
      }}>
      {props.children}
    </ConnectWalletModalContext.Provider>
  );
}

//  Connect wallet modal hook
export const useConnectWalletModal = () => {
  const context = useContext(ConnectWalletModalContext);
  return context;
};
