
const BASEURL = import.meta.env.VITE_BASE_URL;

export type ReportKey =
  | "MISSING_METER_READINGS"
  | "ABNORMAL_METER_READINGS"
  | "PAYMENTS_REPORT"
  | "PAYMENTS_PER_MODE_CURRENT_PERIOD"
  | "BILLS_AGING_REPORT"
  | "BILLS_BY_TYPE"
  | "CUSTOMERS_REPORT"
  | "DISCONNECTED_CONNECTIONS_REPORT"
  | "BILLS_BY_CUSTOMER"
  | "CUSTOMERS_REPORT1"
  |"PAYMENTS_REPORT1"

  | "METER_READINGS";

export const PAYMENT_MODES = [
  "CASH",
  "MPESA",
  "BANK_TRANSFER",
  "CREDIT_CARD",
  "DEBIT_CARD",
  "AIRTELMONEY",
] as const;

    export interface BillType {
  id: number;
  name: string;
}
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
  key: "PAYMENTS_PER_MODE_CURRENT_PERIOD",
  label: "Payments per Mode (Current Period)",
  params: [
    {
      name: "mode",
      label: "Mode of Payment",
      type: "select",
      source: "PAYMENT_MODES",
    },
  ],
},
    {
        key: "PAYMENTS_REPORT1",
        label: "Payments Report(coming)",
        params: [
          { name: "startDate", label: "Start Date", type: "date" },
          { name: "endDate", label: "End Date", type: "date" },
        ],
      },

     
    ],
  },
];


export type ReportStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

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

export type ReportParamType =
  | "date"
  | "select";

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
      source: "BILL_TYPES" | "SCHEMES" | "PAYMENT_MODES";
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
    throw new Error("Failed to request report");
  }

  return res.json();
}

export async function fetchReportStatus(
  jobId: string
): Promise<ReportJob> {
  const res = await fetch(
    `${BASEURL}/reports/${jobId}/status`,
    { credentials: "include" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch job status");
  }

  return res.json();
}


export async function fetchBillTypes(): Promise<BillType[]> {
  const res = await fetch(`${BASEURL}/get-bill-types`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to load bill types");
  }

  const json = await res.json();
  return json.data;
}


export interface Scheme {
  id: number;
  name: string;
}

export async function fetchSchemes(): Promise<Scheme[]> {
  const res = await fetch(`${BASEURL}/schemes`, {
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch schemes");
  }

  const json = await res.json();
  return json.data;
}
