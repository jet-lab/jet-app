import { createContext, useContext, useState } from 'react';

// Copilot modal context
export interface Alert {
  status: 'neutral' | 'success' | 'failure';
  overview?: string;
  detail: JSX.Element;
  solution?: JSX.Element;
  closeable: boolean;
  action?: {
    text: string;
    onClick: () => void;
  };
}
export interface Definition {
  term: string;
  definition: string;
}
interface CopilotModal {
  alert?: Alert;
  setAlert: (alert: Alert | undefined) => void;
  definition?: Definition;
  setDefinition: (definition: Definition | undefined) => void;
}
const CopilotModalContext = createContext<CopilotModal>({
  setAlert: () => null,
  setDefinition: () => null
});

// Copilot modal context provider
export function CopilotModalProvider(props: { children: JSX.Element }): JSX.Element {
  const [alert, setAlert] = useState<Alert | undefined>();
  const [definition, setDefinition] = useState<Definition | undefined>();

  return (
    <CopilotModalContext.Provider
      value={{
        alert,
        setAlert,
        definition,
        setDefinition
      }}>
      {props.children}
    </CopilotModalContext.Provider>
  );
}

// Copilot hooks
export const useAlert = () => {
  const { alert, setAlert } = useContext(CopilotModalContext);
  return {
    alert,
    setAlert
  };
};
export const useDefinition = () => {
  const { definition, setDefinition } = useContext(CopilotModalContext);
  return {
    definition,
    setDefinition
  };
};
