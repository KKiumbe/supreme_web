import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL;

// ✅ Fetch all bill types
export const fetchBillTypes = async () => {
  const res = await axios.get(`${BASEURL}/get-bill-types`, {
    withCredentials: true, // include cookies/session tokens
  });
  return res.data;
};

// ✅ Create new bill type
export const createBillType = async (name) => {
  const res = await axios.post(
    `${BASEURL}/create-bill-type`,
    { name },
    { withCredentials: true } // include credentials
  );
  return res.data;
};
