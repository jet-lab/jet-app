import { createContext, useContext, useState } from 'react';

// Copilot modal context
interface Alert {
  status: 'neutral' | 'success' | 'failure';
  overview?: string;
  detail: string;
  solution?: string;
  action?: {
    text: string;
    onClick: () => void;
  };
}
interface Definition {
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
  setAlert: () => {},
  setDefinition: () => {}
});

// Copilot modal context provider
export function CopilotModalProvider(props: { children: any }) {
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
