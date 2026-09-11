/** Blue-chip assets excluded from cross-protocol leaderboard (case-insensitive). */
const MAINSTREAM_SYMBOLS = new Set([
  "ETH",
  "WETH",
  "BTC",
  "WBTC",
  "TBTC",
  "RENBTC",
  "HBTC",
  "USDC",
  "USDT",
  "DAI",
  "USDBC",
  "FRAX",
  "LUSD",
  "GUSD",
  "BUSD",
  "TUSD",
  "USDS",
  "CRVUSD",
  "STETH",
  "WSTETH",
  "CBETH",
  "RETH",
  "SFRXETH",
  "WEETH",
  "AERO",
]);

export function normalizeTokenSymbol(symbol: string): string {
  return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isMainstreamToken(symbol: string | undefined | null): boolean {
  if (!symbol) return false;
  return MAINSTREAM_SYMBOLS.has(normalizeTokenSymbol(symbol));
}
