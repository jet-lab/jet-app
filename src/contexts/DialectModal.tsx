import { createContext, useContext, useState } from 'react';

interface DialectModalControl {
  modalOpen: boolean;
  setModalOpen: (connecting: boolean) => void;
}
const DialectModalContext = createContext<DialectModalControl>({
  modalOpen: false,
  setModalOpen: () => null
});

export function DialectModalProvider(props: { children: any }): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <DialectModalContext.Provider
      value={{
        modalOpen,
        setModalOpen
      }}>
      {props.children}
    </DialectModalContext.Provider>
  );
}

export const useDialectModal = () => {
  const context = useContext(DialectModalContext);
  return context;
};
