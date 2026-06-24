import { z } from "zod";

export const stockSymbolSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z][A-Z0-9.-]{0,11}$/, "Invalid U.S. stock symbol");

export const watchlistInputSchema = z.object({
  symbol: stockSymbolSchema,
  notes: z.string().trim().max(2000).optional()
});

export const thesisInputSchema = z.object({
  symbol: stockSymbolSchema,
  title: z.string().trim().min(1).max(200),
  thesisText: z.string().trim().min(1).max(10_000),
  status: z.enum(["active", "watching", "closed"]).optional()
});

export const portfolioInputSchema = z.object({
  symbol: stockSymbolSchema,
  shares: z.coerce.number().positive().max(1_000_000_000),
  averageCost: z.coerce.number().min(0).max(1_000_000_000).nullable().optional(),
  notes: z.string().trim().max(2000).optional()
});

export const alertInputSchema = z.object({
  symbol: stockSymbolSchema,
  alertType: z.enum([
    "quality_score",
    "valuation_score",
    "expectations_score",
    "price_move",
    "event_risk"
  ]),
  threshold: z.coerce.number().min(-1_000_000_000).max(1_000_000_000).nullable().optional(),
  direction: z.enum(["above", "below", "any"]),
  note: z.string().trim().max(2000).optional()
});
