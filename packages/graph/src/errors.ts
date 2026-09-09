export class GraphProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GraphProviderError";
  }
}

export class GraphMetricsError extends GraphProviderError {
  constructor(protocol: string, detail: string) {
    super(`Failed to derive on-chain metrics for ${protocol}: ${detail}`);
    this.name = "GraphMetricsError";
  }
}
