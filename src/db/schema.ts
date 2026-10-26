import {
  pgTable,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  jsonb,
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 255 }).notNull(),
  balance: numeric("balance", { precision: 20, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Game configuration table
export const gameConfig = pgTable("game_config", {
  id: serial("id").primaryKey(),
  gameName: varchar("game_name", { length: 255 }).notNull().unique(),
  theme: varchar("theme", { length: 50 }).notNull().default("skyrush"),
  minBet: numeric("min_bet", { precision: 20, scale: 2 }).notNull().default("1"),
  maxBet: numeric("max_bet", { precision: 20, scale: 2 }).notNull().default("10000"),
  maxWin: numeric("max_win", { precision: 20, scale: 2 }).notNull().default("1000000"),
  roundDuration: integer("round_duration").notNull().default(60), // seconds
  countdownDuration: integer("countdown_duration").notNull().default(5),
  autoClashoutEnabled: boolean("auto_cashout_enabled").notNull().default(true),
  autoBetEnabled: boolean("auto_bet_enabled").notNull().default(true),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Crash rounds table
export const crashRounds = pgTable("crash_rounds", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id", { length: 50 }).notNull().default("skyrush"),
  roundNumber: integer("round_number").notNull(),
  crashPoint: numeric("crash_point", { precision: 20, scale: 4 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, active, crashed
  seed: varchar("seed", { length: 255 }), // for fairness
  hash: varchar("hash", { length: 255 }), // for fairness
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bets table
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  roundId: integer("round_id").notNull(),
  betAmount: numeric("bet_amount", { precision: 20, scale: 2 }).notNull(),
  multiplier: numeric("multiplier", { precision: 20, scale: 4 }),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, active, won, lost
  cashedOutAt: numeric("cashed_out_at", { precision: 20, scale: 4 }), // the multiplier value when cashed out
  winAmount: numeric("win_amount", { precision: 20, scale: 2 }),
  betPanel: integer("bet_panel").notNull().default(1), // 1 or 2
  autoBet: boolean("auto_bet").notNull().default(false),
  autoCashout: numeric("auto_cashout", { precision: 20, scale: 4 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Wallet transactions table for audit trail
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 20, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // deposit, withdraw, bet, win
  betId: integer("bet_id"),
  roundId: integer("round_id"),
  description: text("description"),
  balanceBefore: numeric("balance_before", { precision: 20, scale: 2 }).notNull(),
  balanceAfter: numeric("balance_after", { precision: 20, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Leaderboard / statistics
export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(),
  totalRounds: integer("total_rounds").notNull().default(0),
  totalWins: integer("total_wins").notNull().default(0),
  totalLosses: integer("total_losses").notNull().default(0),
  totalWagered: numeric("total_wagered", { precision: 20, scale: 2 }).notNull().default("0"),
  totalWon: numeric("total_won", { precision: 20, scale: 2 }).notNull().default("0"),
  averageCashout: numeric("average_cashout", { precision: 20, scale: 4 }).notNull().default("1"),
  bestCashout: numeric("best_cashout", { precision: 20, scale: 4 }).notNull().default("1"),
  largestWin: numeric("largest_win", { precision: 20, scale: 2 }).notNull().default("0"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bets: many(bets),
  transactions: many(transactions),
}));

export const betsRelations = relations(bets, ({ one }) => ({
  user: one(users, { fields: [bets.userId], references: [users.userId] }),
  round: one(crashRounds, { fields: [bets.roundId], references: [crashRounds.id] }),
}));

export const crashRoundsRelations = relations(crashRounds, ({ many }) => ({
  bets: many(bets),
}));
