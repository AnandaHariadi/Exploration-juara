import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  brandName: text("brand_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  phone: text("phone"),
  timezone: text("timezone").default("Asia/Jakarta"),
  onboardedAt: text("onboarded_at"),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name").notNull(),
  category: text("category").default("general"), // campus | agency | corporate | general
  email: text("email"),
  phone: text("phone"),
  createdAt: text("created_at").notNull(),
});

export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  ownerUserId: text("owner_user_id").notNull(),
  clientId: text("client_id").notNull(),
  number: text("number").notNull().unique(),
  title: text("title").notNull(),
  currency: text("currency").default("IDR"),
  totalAmount: integer("total_amount").notNull(),
  scheme: text("scheme").notNull(), // full | dp | installment
  status: text("status").notNull().default("draft"), // draft | issued | partially_paid | paid | cancelled
  issuedAt: text("issued_at"),
  publicToken: text("public_token").notNull().unique(),
  notes: text("notes"),
});

export const invoiceItems = sqliteTable("invoice_items", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitAmount: integer("unit_amount").notNull(),
  lineTotal: integer("line_total").notNull(),
});

export const installments = sqliteTable("installments", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  sequence: integer("sequence").notNull(),
  label: text("label").notNull(),
  percentage: integer("percentage"),
  amount: integer("amount").notNull(),
  dueAt: text("due_at"),
  status: text("status").notNull().default("scheduled"), // scheduled | pending | paid | cancelled
  paidAmount: integer("paid_amount").default(0),
  paidAt: text("paid_at"),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  installmentId: text("installment_id").notNull(),
  providerPaymentId: text("provider_payment_id"),
  method: text("method").default("QRIS"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("succeeded"),
  paidAt: text("paid_at").notNull(),
});
