import { createContext, useContext } from "react";
import type { Session } from "./lib/repository";

export const SessionContext = createContext<{
  session: Session | null;
  setSession: (session: Session | null) => void;
  loading: boolean;
}>({ session: null, setSession: () => {}, loading: true });
export function useSession() {
  return useContext(SessionContext);
}
