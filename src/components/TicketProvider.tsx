"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Show } from "@/data/site";
import TicketWidgetModal from "./TicketWidgetModal";

type TicketContextValue = {
  openTickets: (show?: Show) => void;
};

const TicketContext = createContext<TicketContextValue | null>(null);

type TicketState = {
  show?: Show;
  isOpen: boolean;
  revision: number;
};

export function TicketProvider({ children }: { children: ReactNode }) {
  const [ticket, setTicket] = useState<TicketState | null>(null);
  const revision = useRef(0);

  const openTickets = useCallback((show?: Show) => {
    revision.current += 1;
    setTicket({ show, isOpen: true, revision: revision.current });
  }, []);

  const closeTickets = useCallback(() => {
    setTicket((current) => current?.isOpen ? { ...current, isOpen: false } : current);
  }, []);
  const finishClosing = useCallback((closedRevision: number) => {
    setTicket((current) => current && !current.isOpen && current.revision === closedRevision ? null : current);
  }, []);
  const value = useMemo(() => ({ openTickets }), [openTickets]);

  return (
    <TicketContext.Provider value={value}>
      {children}
      {ticket && (
        <TicketWidgetModal
          show={ticket.show}
          isOpen={ticket.isOpen}
          revision={ticket.revision}
          onClose={closeTickets}
          onExited={finishClosing}
        />
      )}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (!context) throw new Error("useTickets must be used within TicketProvider");
  return context;
}

