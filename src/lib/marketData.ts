const FINMIND_API_URL = "https://api.finmindtrade.com/api/v4/data";
const DEFAULT_HISTORY_LOOKBACK_DAYS = 30;

type FinMindPriceRecord = {
  date: string;
  stock_id: string;
  Trading_Volume: number;
  open: number;
  max: number;
  min: number;
  close: number;
};

type FinMindResponse = {
  msg?: string;
  status?: number;
  data?: FinMindPriceRecord[];
};

export type TaiwanStockPricePoint = {
  symbol: string;
  date: string;
  close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
};

export class MarketDataError extends Error {
  code: "NOT_FOUND" | "API_ERROR" | "NETWORK_ERROR";

  constructor(code: "NOT_FOUND" | "API_ERROR" | "NETWORK_ERROR", message: string) {
    super(message);
    this.name = "MarketDataError";
    this.code = code;
  }
}

export function normalizeTaiwanStockSymbol(stockSymbol: string) {
  return stockSymbol
    .trim()
    .toUpperCase()
    .replace(/\.TW$/, "")
    .replace(/[^0-9]/g, "");
}

function getFinMindToken() {
  return import.meta.env.VITE_FINMIND_API_TOKEN?.trim();
}

function buildHeaders() {
  const token = getFinMindToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getHistoryStartDate(days: number) {
  const start = new Date();
  start.setDate(start.getDate() - Math.max(days * 3, DEFAULT_HISTORY_LOOKBACK_DAYS));
  return formatDate(start);
}

function mapPricePoint(record: FinMindPriceRecord): TaiwanStockPricePoint {
  return {
    symbol: record.stock_id,
    date: record.date,
    close: record.close,
    open: record.open,
    high: record.max,
    low: record.min,
    volume: record.Trading_Volume,
  };
}

async function requestTaiwanStockPrice(params: Record<string, string>) {
  let response: Response;

  try {
    response = await fetch(`${FINMIND_API_URL}?${new URLSearchParams(params).toString()}`, {
      headers: buildHeaders(),
    });
  } catch (error) {
    throw new MarketDataError(
      "NETWORK_ERROR",
      error instanceof Error ? `Network error: ${error.message}` : "Network error",
    );
  }

  let payload: FinMindResponse;

  try {
    payload = (await response.json()) as FinMindResponse;
  } catch {
    throw new MarketDataError("API_ERROR", "FinMind API returned an unreadable response.");
  }

  if (!response.ok || payload.status == null || payload.status >= 400) {
    throw new MarketDataError(
      "API_ERROR",
      payload.msg || `FinMind API request failed with status ${response.status}.`,
    );
  }

  if (!payload.data || payload.data.length === 0) {
    throw new MarketDataError(
      "NOT_FOUND",
      "No stock price data was found for the requested symbol.",
    );
  }

  return payload.data;
}

export async function fetchTaiwanStockHistory(stockSymbol: string, days: number) {
  const normalizedSymbol = normalizeTaiwanStockSymbol(stockSymbol);

  if (!normalizedSymbol) {
    throw new MarketDataError("NOT_FOUND", "A valid Taiwan stock symbol is required.");
  }

  if (!Number.isInteger(days) || days <= 0) {
    throw new MarketDataError("API_ERROR", "History days must be a positive integer.");
  }

  const data = await requestTaiwanStockPrice({
    dataset: "TaiwanStockPrice",
    data_id: normalizedSymbol,
    start_date: getHistoryStartDate(days),
    end_date: formatDate(new Date()),
  });

  return data
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-days)
    .map(mapPricePoint);
}

export async function fetchTaiwanStockLatestPrice(stockSymbol: string) {
  const history = await fetchTaiwanStockHistory(stockSymbol, 1);
  const latest = history.at(-1);

  if (!latest) {
    throw new MarketDataError("NOT_FOUND", "No latest stock price data was found.");
  }

  return latest;
}
