"use client";

import dynamic from "next/dynamic";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Show } from "@/data/site";

const TicketWidgetModal = dynamic(() => import("./TicketWidgetModal"), {
  ssr: false,
});

type TicketContextValue = {
  openTickets: (show?: Show) => void;
};

const TicketContext = createContext<TicketContextValue | null>(null);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<Show>();

  const openTickets = useCallback((show?: Show) => {
    setSelectedShow(show);
    setIsOpen(true);
  }, []);

  const closeTickets = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ openTickets }), [openTickets]);

  return (
    <TicketContext.Provider value={value}>
      {children}
      {isOpen && (
        <TicketWidgetModal show={selectedShow} onClose={closeTickets} />
      )}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used within TicketProvider");
  return context;
}
