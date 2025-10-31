import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const fetchSchemes = async () => {
  const res = await axios.get(`${BASE_URL}/schemes`,
    {
      withCredentials: true,
    },
  );
  return res.data.data;
};

export const fetchZonesByScheme = async (schemeId) => {
  const res = await axios.get(`${BASE_URL}/schemes/${schemeId}`,
    {
      withCredentials: true,
    },
  );
  return res.data.data;
};

//zones/:zoneId/routes

export const fetchRoutesByZone = async (zoneId) => {
  const res = await axios.get(`${BASE_URL}/zones/${zoneId}/routes`,
    {
      withCredentials: true,
    },
  );
  return res.data.data;
};

export const createScheme = async (payload) => {
  const res = await axios.post(`${BASE_URL}/schemes/create`, payload, {
    withCredentials: true,
  });
  return res.data.data;
};


export const createZone = async (payload) => {
  const res = await axios.post(`${BASE_URL}/zones/create`, payload,
    {
      withCredentials: true,
    },
  );
  return res.data.data;
};

export const createRoute = async (payload) => {
  const res = await axios.post(`${BASE_URL}/routes/create`, payload,
    {
      withCredentials: true,
    },
  );
  return res.data.data;
};
