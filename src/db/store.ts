import fs from "fs";
import path from "path";

export interface Profile {
  userId: string;
  brandName: string;
  contactEmail: string;
  phone?: string;
  timezone: string;
  onboardedAt: string;
}

export interface Client {
  id: string;
  ownerUserId: string;
  name: string;
  category: "campus" | "agency" | "corporate" | "general";
  email?: string;
  phone?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitAmount: number;
  lineTotal: number;
}

export interface Installment {
  id: string;
  invoiceId: string;
  sequence: number;
  label: string;
  percentage?: number;
  amount: number;
  dueAt?: string;
  status: "scheduled" | "pending" | "paid" | "cancelled";
  paidAmount: number;
  paidAt?: string;
}

export interface Invoice {
  id: string;
  ownerUserId: string;
  clientId: string;
  clientName: string;
  clientCategory: "campus" | "agency" | "corporate" | "general";
  number: string;
  title: string;
  currency: string;
  totalAmount: number;
  scheme: "full" | "dp" | "installment";
  status: "draft" | "issued" | "partially_paid" | "paid" | "cancelled";
  issuedAt: string;
  publicToken: string;
  notes?: string;
  items: InvoiceItem[];
  installments: Installment[];
}

export interface Payment {
  id: string;
  installmentId: string;
  providerPaymentId?: string;
  method: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  paidAt: string;
}

interface DatabaseSchema {
  profile: Profile;
  clients: Client[];
  invoices: Invoice[];
  payments: Payment[];
}

const dbDir = path.resolve(process.cwd(), "data");
const dbFile = path.resolve(dbDir, "db.json");

function getInitialData(): DatabaseSchema {
  return {
    profile: {
      userId: "user_freelancer_01",
      brandName: "Arka Studio Visual",
      contactEmail: "arka.freelance@gmail.com",
      phone: "081234567890",
      timezone: "Asia/Jakarta",
      onboardedAt: new Date().toISOString(),
    },
    clients: [
      {
        id: "client_himatifa",
        ownerUserId: "user_freelancer_01",
        name: "HIMATIFA UPNVJT",
        category: "campus",
        email: "himatifa.upnvjt@gmail.com",
        phone: "085712345678",
        createdAt: "2026-09-01T08:00:00Z",
      },
      {
        id: "client_jagoan",
        ownerUserId: "user_freelancer_01",
        name: "Jagoan Hosting (PT Beon Intermedia)",
        category: "agency",
        email: "billing@jagoanhosting.com",
        phone: "081233445566",
        createdAt: "2026-09-15T12:00:00Z",
      },
    ],
    invoices: [
      {
        id: "inv_001",
        ownerUserId: "user_freelancer_01",
        clientId: "client_himatifa",
        clientName: "HIMATIFA UPNVJT",
        clientCategory: "campus",
        number: "INV/2026/09/HMT-001",
        title: "Pembuatan Website Dies Natalis Informatika",
        currency: "IDR",
        totalAmount: 1000000,
        scheme: "dp",
        status: "partially_paid",
        issuedAt: "2026-09-20T10:00:00Z",
        publicToken: "himatifa-dies-01",
        notes: "Paket landing page dan sistem registrasi peserta lomba.",
        items: [
          {
            id: "item_01",
            invoiceId: "inv_001",
            description: "Jasa Pembuatan Landing Page Dies Natalis",
            quantity: 1,
            unitAmount: 1000000,
            lineTotal: 1000000,
          },
        ],
        installments: [
          {
            id: "inst_001_1",
            invoiceId: "inv_001",
            sequence: 1,
            label: "Termin 1 (Uang Muka 30%)",
            percentage: 30,
            amount: 300000,
            dueAt: "2026-09-20",
            status: "paid",
            paidAmount: 300000,
            paidAt: "2026-09-21T14:30:00Z",
          },
          {
            id: "inst_001_2",
            invoiceId: "inv_001",
            sequence: 2,
            label: "Termin 2 (Pelunasan 70%)",
            percentage: 70,
            amount: 700000,
            dueAt: "2026-10-05",
            status: "pending",
            paidAmount: 0,
          },
        ],
      },
      {
        id: "inv_002",
        ownerUserId: "user_freelancer_01",
        clientId: "client_jagoan",
        clientName: "Jagoan Hosting (PT Beon Intermedia)",
        clientCategory: "agency",
        number: "INV/2026/09/JH-002",
        title: "Pengembangan Custom Plugin & Optimasi Server Cloud",
        currency: "IDR",
        totalAmount: 4500000,
        scheme: "dp",
        status: "issued",
        issuedAt: "2026-09-25T11:00:00Z",
        publicToken: "jagoan-hosting-cloud-02",
        notes: "Termin DP 50% di awal sebelum integrasi server cloud dimulai.",
        items: [
          {
            id: "item_02",
            invoiceId: "inv_002",
            description: "Integrasi API Cloud Hosting & Custom Dashboard Plugin",
            quantity: 1,
            unitAmount: 4500000,
            lineTotal: 4500000,
          },
        ],
        installments: [
          {
            id: "inst_002_1",
            invoiceId: "inv_002",
            sequence: 1,
            label: "Termin 1 (DP 50%)",
            percentage: 50,
            amount: 2250000,
            dueAt: "2026-09-28",
            status: "pending",
            paidAmount: 0,
          },
          {
            id: "inst_002_2",
            invoiceId: "inv_002",
            sequence: 2,
            label: "Termin 2 (Pelunasan 50%)",
            percentage: 50,
            amount: 2250000,
            dueAt: "2026-10-15",
            status: "scheduled",
            paidAmount: 0,
          },
        ],
      },
    ],
    payments: [
      {
        id: "pay_001",
        installmentId: "inst_001_1",
        providerPaymentId: "xen_pay_89123891",
        method: "QRIS",
        amount: 300000,
        status: "succeeded",
        paidAt: "2026-09-21T14:30:00Z",
      },
    ],
  };
}

export function readDatabase(): DatabaseSchema {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    const initial = getInitialData();
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(dbFile, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    const initial = getInitialData();
    fs.writeFileSync(dbFile, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
}

export function writeDatabase(data: DatabaseSchema): void {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), "utf-8");
}
