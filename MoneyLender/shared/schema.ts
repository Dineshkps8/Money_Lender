import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, date, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerNumber: text("customer_number").notNull().unique(),
  name: text("name").notNull(),
  areaName: text("area_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  amountGiven: decimal("amount_given", { precision: 10, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  documentCharge: decimal("document_charge", { precision: 10, scale: 2 }).notNull().default("0"),
  numberOfWeeks: integer("number_of_weeks").notNull().default(10),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  collectionLine: text("collection_line").notNull(),
  status: text("status").notNull().default("active"), // active, completed, overdue
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const dailyCollections = pgTable("daily_collections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  collectionDate: date("collection_date").notNull(),
  collectionLine: text("collection_line").notNull(),
  dueAmount: decimal("due_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMode: text("payment_mode").notNull().default("cash"), // cash, gpay, bank_transfer
  paymentStatus: text("payment_status").notNull().default("pending"), // paid, partial, pending
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const dailyEntries = pgTable("daily_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryDate: date("entry_date").notNull(),
  collectionLine: text("collection_line").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalCollected: decimal("total_collected", { precision: 10, scale: 2 }).notNull().default("0"),
  expenses: decimal("expenses", { precision: 10, scale: 2 }).notNull().default("0"),
  newLoansGiven: integer("new_loans_given").notNull().default(0),
  newLoansAmount: decimal("new_loans_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  documentCharges: decimal("document_charges", { precision: 10, scale: 2 }).notNull().default("0"),
  completedLoans: integer("completed_loans").notNull().default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  totalAmount: true,  // Will be calculated server-side
  endDate: true,      // Will be calculated server-side
}).extend({
  amountGiven: z.string().transform(val => parseFloat(val)),
  interestAmount: z.string().transform(val => parseFloat(val)),
  documentCharge: z.string().transform(val => parseFloat(val)),
  phoneNumber: z.string().min(10, "Phone number must be 10 digits").max(10, "Phone number must be 10 digits"),
});

export const insertDailyCollectionSchema = createInsertSchema(dailyCollections).omit({
  id: true,
  createdAt: true,
}).extend({
  dueAmount: z.string().transform(val => parseFloat(val)),
  amountPaid: z.string().transform(val => parseFloat(val)),
});

export const insertDailyEntrySchema = createInsertSchema(dailyEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  targetAmount: z.string().transform(val => parseFloat(val)),
  totalCollected: z.string().transform(val => parseFloat(val)),
  expenses: z.string().transform(val => parseFloat(val)),
  newLoansAmount: z.string().transform(val => parseFloat(val)),
  documentCharges: z.string().transform(val => parseFloat(val)),
  newLoansGiven: z.number(),
  completedLoans: z.number(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type DailyCollection = typeof dailyCollections.$inferSelect;
export type InsertDailyCollection = z.infer<typeof insertDailyCollectionSchema>;
export type DailyEntry = typeof dailyEntries.$inferSelect;
export type InsertDailyEntry = z.infer<typeof insertDailyEntrySchema>;

export const expenseSchema = z.object({
  id: z.string(),
  date: z.string(),
  collectionLine: z.string(),
  category: z.string(),
  amount: z.number(),
  description: z.string(),
  createdAt: z.string(),
});

export type Expense = z.infer<typeof expenseSchema>;

export const insertExpenseSchema = z.object({
  date: z.string(),
  collectionLine: z.string(),
  category: z.string(),
  amount: z.number(),
  description: z.string(),
});

export type InsertExpense = z.infer<typeof insertExpenseSchema>;