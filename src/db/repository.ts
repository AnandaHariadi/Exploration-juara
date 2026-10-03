import { readDatabase, writeDatabase, Invoice, Client, Installment, Payment } from "./store";

export function getProfile() {
  const db = readDatabase();
  return db.profile;
}

export function getClients(): Client[] {
  const db = readDatabase();
  return db.clients;
}

export function getInvoices(): Invoice[] {
  const db = readDatabase();
  return db.invoices;
}

export function getInvoiceByToken(token: string): { invoice: Invoice; profile: any } | null {
  const db = readDatabase();
  const invoice = db.invoices.find((inv) => inv.publicToken === token);
  if (!invoice) return null;
  return { invoice, profile: db.profile };
}

export function createInvoiceFromDraft(payload: {
  clientName: string;
  clientCategory: "campus" | "agency" | "corporate" | "general";
  description: string;
  totalAmount: number;
  scheme: "full" | "dp" | "installment";
  notes?: string;
  installments: Array<{
    label: string;
    percentage: number;
    amount: number;
    dueAt?: string;
  }>;
}): Invoice {
  const db = readDatabase();

  // Find or create client
  let client = db.clients.find(
    (c) => c.name.toLowerCase() === payload.clientName.toLowerCase()
  );
  if (!client) {
    client = {
      id: "client_" + Date.now(),
      ownerUserId: db.profile.userId,
      name: payload.clientName,
      category: payload.clientCategory,
      createdAt: new Date().toISOString(),
    };
    db.clients.push(client);
  }

  const invoiceId = "inv_" + Date.now();
  const invNumber = `INV/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${Math.floor(100 + Math.random() * 900)}`;
  const publicToken = `${payload.clientName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newInstallments: Installment[] = payload.installments.map((inst, idx) => ({
    id: `inst_${invoiceId}_${idx + 1}`,
    invoiceId,
    sequence: idx + 1,
    label: inst.label,
    percentage: inst.percentage,
    amount: inst.amount,
    dueAt: inst.dueAt || new Date(Date.now() + (idx + 1) * 7 * 86400000).toISOString().split("T")[0],
    status: idx === 0 ? "pending" : "scheduled",
    paidAmount: 0,
  }));

  const newInvoice: Invoice = {
    id: invoiceId,
    ownerUserId: db.profile.userId,
    clientId: client.id,
    clientName: client.name,
    clientCategory: client.category,
    number: invNumber,
    title: payload.description,
    currency: "IDR",
    totalAmount: payload.totalAmount,
    scheme: payload.scheme,
    status: "issued",
    issuedAt: new Date().toISOString(),
    publicToken,
    notes: payload.notes || "Dibuat otomatis oleh Asisten Keuangan AI CLARA",
    items: [
      {
        id: `item_${invoiceId}_1`,
        invoiceId,
        description: payload.description,
        quantity: 1,
        unitAmount: payload.totalAmount,
        lineTotal: payload.totalAmount,
      },
    ],
    installments: newInstallments,
  };

  db.invoices.unshift(newInvoice);
  writeDatabase(db);
  return newInvoice;
}

export function payInstallment(installmentId: string, method: string = "QRIS"): { success: boolean; invoice: Invoice | null } {
  const db = readDatabase();

  for (const inv of db.invoices) {
    const inst = inv.installments.find((i) => i.id === installmentId);
    if (inst && inst.status !== "paid") {
      inst.status = "paid";
      inst.paidAmount = inst.amount;
      inst.paidAt = new Date().toISOString();

      // Record payment
      const payment: Payment = {
        id: "pay_" + Date.now(),
        installmentId: inst.id,
        providerPaymentId: `xen_sim_${Date.now()}`,
        method,
        amount: inst.amount,
        status: "succeeded",
        paidAt: new Date().toISOString(),
      };
      db.payments.push(payment);

      // Check next installments: if there's a scheduled next installment, make it pending
      const nextInst = inv.installments.find((i) => i.sequence === inst.sequence + 1);
      if (nextInst && nextInst.status === "scheduled") {
        nextInst.status = "pending";
      }

      // Check whole invoice status
      const allPaid = inv.installments.every((i) => i.status === "paid");
      const somePaid = inv.installments.some((i) => i.status === "paid");

      if (allPaid) {
        inv.status = "paid";
      } else if (somePaid) {
        inv.status = "partially_paid";
      }

      writeDatabase(db);
      return { success: true, invoice: inv };
    }
  }

  return { success: false, invoice: null };
}

export function getFinancialMetrics() {
  const db = readDatabase();

  let totalInflow = 0;
  let totalReceivables = 0;
  let totalOverdue = 0;

  for (const inv of db.invoices) {
    for (const inst of inv.installments) {
      if (inst.status === "paid") {
        totalInflow += inst.paidAmount || inst.amount;
      } else if (inst.status === "pending" || inst.status === "scheduled") {
        totalReceivables += inst.amount;
      }
    }
  }

  return {
    totalInflow,
    totalReceivables,
    totalOverdue,
    activeInvoicesCount: db.invoices.filter((i) => i.status !== "cancelled" && i.status !== "paid").length,
    totalInvoicesCount: db.invoices.length,
  };
}
