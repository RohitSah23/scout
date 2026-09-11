"use client";

import { createContext, useContext } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";

const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const ScoutAuthContext = createContext({
  getAccessToken: async (): Promise<string | null> => null,
});

function PrivyAuthBridge({ children }: { children: React.ReactNode }) {
  const { getAccessToken } = usePrivy();
  return <ScoutAuthContext.Provider value={{ getAccessToken }}>{children}</ScoutAuthContext.Provider>;
}

export function useScoutAuth() {
  return useContext(ScoutAuthContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  if (!appId) {
    return <ScoutAuthContext.Provider value={{ getAccessToken: async () => null }}>{children}</ScoutAuthContext.Provider>;
  }
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: { theme: "dark", accentColor: "#22d3ee" },
        embeddedWallets: { createOnLogin: "users-without-wallets" },
      }}
    >
      <PrivyAuthBridge>{children}</PrivyAuthBridge>
    </PrivyProvider>
  );
}
