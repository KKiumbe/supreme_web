const BASEURL = import.meta.env.VITE_BASE_URL;

export type ReportKey =
  | "MISSING_METER_READINGS"
  | "ABNORMAL_METER_READINGS"
  | "PAYMENTS_REPORT"
  | "ALL_PAYMENTS_PER_MODE_PER_PERIOD_SUMMARY"
  | "PAYMENTS_PER_MODE_PER_PERIOD_SUMMARY"
  | "BILLS_AGING_REPORT"
  | "BILLS_BY_TYPE"
  | "CUSTOMERS_REPORT"
  | "DISCONNECTED_CONNECTIONS_REPORT"
  | "BILLS_BY_CUSTOMER"
  | "CUSTOMERS_REPORT1"
  | "PAYMENTS_REPORT1"
  | "METER_READINGS"
  | "TOTAL_VOLUME_CONSUMED"
  | "INCOME_PER_BILL_TYPE"
  | "ALL_INCOME_PER_BILL_TYPE_SUMMARY";

export const PAYMENT_MODES = [
  "CASH",
  "MPESA",
  "BANK_TRANSFER_EQUITY",
  "BANK_TRANSFER_CONSOLIDATED",
  "AIRTELMONEY",
] as const;

export interface BillType {
  id: number;
  name: string;
}

const currentYear = new Date().getFullYear();

const yearOptions = Array.from({ length: 5 }, (_, i) => ({
  label: String(currentYear - i),
  value: currentYear - i,
}));
export const REPORT_SECTIONS: ReportSection[] = [
  {
    section: "Customers",
    reports: [
      {
        key: "CUSTOMERS_REPORT",
        label: "Customers Report",
        params: [],
      },
      {
        key: "DISCONNECTED_CONNECTIONS_REPORT",
        label: "Disconnected Connections",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },
      {
        key: "CUSTOMERS_REPORT1",
        label: "Customers Report(coming)",
        params: [],
      },
    ],
  },

  {
    section: "Bills",
    reports: [
      {
        key: "BILLS_AGING_REPORT",
        label: "Bills Aging Report",
        params: [],
      },
      {
        key: "BILLS_BY_TYPE",
        label: "Bills by Type",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
          {
            name: "billTypeId",
            label: "Bill Type",
            type: "select",
            source: "BILL_TYPES",
          },
        ],
      },
      {
        key: "BILLS_BY_CUSTOMER",
        label: " All Bills:Detailed",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },
    ],
  },

  {
    section: "Meter Readings",
    reports: [
      {
        key: "MISSING_METER_READINGS",
        label: "Unread connections Readings",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
          {
            name: "schemeId",
            label: "Scheme",
            type: "select",
            source: "SCHEMES",
            optional: true,
          },
        ],
      },
      {
        key: "ABNORMAL_METER_READINGS",
        label: "Abnormal Meter Readings",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },
      {
        key: "METER_READINGS",
        label: "Meter Readings",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },
      {
        key: "TOTAL_VOLUME_CONSUMED",
        label: "Total Volume Consumed by Month",
        params: [
          { name: "month", label: "Month", type: "date" },
          { name: "year", label: "Year", type: "date" },
        ],
      },
    ],
  },

  {
    section: "Payments",
    reports: [
      {
        key: "PAYMENTS_REPORT",
        label: "Payments Report",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },

      {
        key: "ALL_PAYMENTS_PER_MODE_PER_PERIOD_SUMMARY",
        label: "All Payments per Mode Summary",
        params: [
          {
            name: "month",
            label: "Month",
            type: "select",
            options: [
              { label: "January", value: 1 },
              { label: "February", value: 2 },
              { label: "March", value: 3 },
              { label: "April", value: 4 },
              { label: "May", value: 5 },
              { label: "June", value: 6 },
              { label: "July", value: 7 },
              { label: "August", value: 8 },
              { label: "September", value: 9 },
              { label: "October", value: 10 },
              { label: "November", value: 11 },
              { label: "December", value: 12 },
            ],
          },
          {
            name: "year",
            label: "Year",
            type: "select",
            options: yearOptions,
          },
        ],
      },

      {
        key: "PAYMENTS_PER_MODE_PER_PERIOD_SUMMARY",
        label: "Payments per Mode per Period summary",
        params: [
          {
            name: "month",
            label: "Month",
            type: "select",
            options: [
              { label: "January", value: 1 },
              { label: "February", value: 2 },
              { label: "March", value: 3 },
              { label: "April", value: 4 },
              { label: "May", value: 5 },
              { label: "June", value: 6 },
              { label: "July", value: 7 },
              { label: "August", value: 8 },
              { label: "September", value: 9 },
              { label: "October", value: 10 },
              { label: "November", value: 11 },
              { label: "December", value: 12 },
            ],
          },
          {
            name: "year",
            label: "Year",
            type: "select",
            options: yearOptions,
          },
          {
            name: "mode",
            label: "Mode of Payment",
            type: "select",
            source: "PAYMENT_MODES",
          },
        ],
      },
    ],
  },
  {
    section: "Income",
    reports: [
      {
        key: "INCOME_PER_BILL_TYPE",
        label: "Income per Bill Type (Paid Invoices)",
        params: [
          {
            name: "billTypeId",
            label: "Bill Type",
            type: "select",
            source: "BILL_TYPES",
          },
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },
      {
        key: "ALL_INCOME_PER_BILL_TYPE_SUMMARY",
        label: "All Income per Bill Type Summary",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },
    ],
  },
];

export type ReportStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type ReportFormat = "pdf" | "excel";

export interface ReportJob {
  reportJobId: string;
  reportType: string;
  status: ReportStatus;
  ready: boolean;
  downloadUrl?: string;
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export type ReportParamType = "date" | "select";

export type ReportParam =
  | {
      name: string;
      label: string;
      type: "date";
      optional?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      source?: "BILL_TYPES" | "SCHEMES" | "PAYMENT_MODES";
      options?: { label: string; value: any }[];
      optional?: boolean;
    };

export interface ReportDefinition {
  key: ReportKey;
  label: string;
  params: ReportParam[];
}

export interface ReportSection {
  section: string;
  reports: ReportDefinition[];
}

export interface ActiveReport {
  key: string;
  label: string;
  params: ReportParam[];
}

export async function requestReportJob(payload: {
  reportType: string;
  params: Record<string, unknown>;
}): Promise<ReportJob> {
  const res = await fetch(`${BASEURL}/reports/request`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error: any = new Error("Failed to request report");
    error.response = { status: res.status };
    throw error;
  }

  return res.json();
}

export async function fetchReportStatus(jobId: string): Promise<ReportJob> {
  const res = await fetch(`${BASEURL}/reports/${jobId}/status`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error: any = new Error("Failed to fetch job status");
    error.response = { status: res.status };
    throw error;
  }

  return res.json();
}

export async function fetchBillTypes(): Promise<BillType[]> {
  const res = await fetch(`${BASEURL}/get-bill-types`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error: any = new Error("Failed to load bill types");
    error.response = { status: res.status };
    throw error;
  }

  const json = await res.json();
  return json.data;
}

export interface Scheme {
  id: number;
  name: string;
}

export const PaymentsPerModeCurrentPeriodReport: ReportDefinition = {
  key: "PAYMENTS_PER_MODE_CURRENT_PERIOD",
  label: "Payments per Mode (Current Period)",
  params: [],
};

export const PaymentsPerModePerPeriodReport: ReportDefinition = {
  key: "PAYMENTS_PER_MODE_PER_PERIOD",
  label: "Payments per Mode per Period",
  params: [
    { name: "startDate", label: "Start Date", type: "date" },
    { name: "endDate", label: "End Date", type: "date" },
    {
      name: "mode",
      label: "Mode of Payment",
      type: "select",
      source: "PAYMENT_MODES",
    },
  ],
};

export async function fetchSchemes(): Promise<Scheme[]> {
  const res = await fetch(`${BASEURL}/schemes`, {
    credentials: "include",
  });

  if (!res.ok) {
    const error: any = new Error("Failed to fetch schemes");
    error.response = { status: res.status };
    throw error;
  }

  const json = await res.json();
  return json.data;
}
