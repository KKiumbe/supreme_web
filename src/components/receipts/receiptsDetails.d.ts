import { FC } from "react";

interface Receipt {
  id: string;
  receiptNumber: string;
  customerName?: string;
  customer?: {
    customerName?: string;
    accountNumber?: string;
    closingBalance?: number;
  };
  amount?: number;
  phoneNumber?: string;
  modeOfPayment?: string;
  transactionCode?: string;
  createdAt?: string;
  status?: string;
  receiptInvoices?: Array<{
    id: string;
    amount: number;
    invoice?: {
      billNumber?: string;
      billPeriod?: string;
      status?: string;
    };
  }>;
}

interface ReceiptDetailsProps {
  receipt: Receipt | null;
  onClose: () => void;
}

declare const ReceiptDetails: FC<ReceiptDetailsProps>;

export default ReceiptDetails;
