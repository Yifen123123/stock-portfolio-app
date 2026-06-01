import type { Account, Holding, PortfolioSummary } from "./types";

export const calculateHoldingMarketValue = (holding: Holding) => holding.price * holding.shares;

export const calculateHoldingProfitLoss = (holding: Holding) =>
  (holding.price - holding.avgCost) * holding.shares;

export const calculateHoldingReturnRate = (holding: Holding) => {
  if (holding.avgCost === 0) return 0;
  return ((holding.price - holding.avgCost) / holding.avgCost) * 100;
};

export const calculateTotalStockValue = (holdings: Holding[]) =>
  holdings.reduce((sum, holding) => sum + calculateHoldingMarketValue(holding), 0);

export const calculateTotalCashValue = (accounts: Account[]) =>
  accounts.reduce((sum, account) => sum + account.balance, 0);

export const calculateTotalAssets = (accounts: Account[], holdings: Holding[]) =>
  calculateTotalCashValue(accounts) + calculateTotalStockValue(holdings);

export const calculatePortfolioSummary = (
  accounts: Account[],
  holdings: Holding[],
): PortfolioSummary => {
  const stockValue = calculateTotalStockValue(holdings);
  const bankBalance = accounts
    .filter((account) => account.type === "bank")
    .reduce((sum, account) => sum + account.balance, 0);
  const brokerCash = accounts
    .filter((account) => account.type === "brokerage")
    .reduce((sum, account) => sum + account.balance, 0);
  const cash = accounts
    .filter((account) => account.type === "cash")
    .reduce((sum, account) => sum + account.balance, 0);
  const investableCash = accounts.reduce((sum, account) => sum + account.investable, 0);
  const cost = holdings.reduce((sum, holding) => sum + holding.avgCost * holding.shares, 0);
  const todayPnL = holdings.reduce(
    (sum, holding) => sum + (holding.price - holding.prevClose) * holding.shares,
    0,
  );
  const totalPnL = holdings.reduce((sum, holding) => sum + calculateHoldingProfitLoss(holding), 0);
  const totalCash = bankBalance + brokerCash + cash;

  return {
    total: stockValue + totalCash,
    stockValue,
    bankBalance,
    brokerCash,
    cash,
    totalCash,
    investableCash,
    todayPnL,
    totalPnL,
    cost,
  };
};
