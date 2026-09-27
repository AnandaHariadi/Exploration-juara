export type InvoiceIntent = {
  clientName: string | null;
  clientCategory: "campus" | "agency" | "corporate" | "general";
  description: string | null;
  totalAmountIdr: number | null;
  scheme: "full" | "dp" | "installment" | "unknown";
  dpPercentage?: number;
  installments: Array<{
    label: string;
    percentage: number;
    amountIdr: number;
    dueDate?: string;
  }>;
  tone: "casual_campus" | "professional_b2b" | "formal_corporate";
  suggestedMessage: string;
  ambiguities: string[];
};

export type ParseRequest = {
  prompt: string;
};
