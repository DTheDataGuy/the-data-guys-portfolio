import { createContext, useContext, useState, type ReactNode } from 'react';

export type PersonaType =
  | 'nonprofit'
  | 'construction'
  | 'government'
  | 'economic-development'
  | 'education'
  | null;

interface PersonaContextValue {
  persona: PersonaType;
  setPersona: (persona: PersonaType) => void;
}

const PersonaContext = createContext<PersonaContextValue | undefined>(undefined);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<PersonaType>(null);

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersona must be used within a PersonaProvider');
  }
  return context;
}