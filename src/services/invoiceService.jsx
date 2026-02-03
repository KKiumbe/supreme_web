import axios from "axios";
import env from "../config/env";

const BASE_URL = env.BASE_URL;

export const fetchInvoices = async () => {
  const { data } = await axios.get(`${BASE_URL}/invoices/all`, {
    headers: { "Content-Type": "application/json" },
  });

  return data;
};

export const fetchInvoiceById = async (id) => {
  const { data } = await axios.get(`${BASE_URL}/invoices/${id}`);
  return data;
};
