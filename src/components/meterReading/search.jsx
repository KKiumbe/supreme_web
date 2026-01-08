import React, { useEffect, useState } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import axios from "axios";

const BASEURL = import.meta.env.VITE_BASE_URL;

export default function MeterReadingSearch({ onSelect }) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchReadings = async (query) => {
    if (!query || query.length < 2) return;

    setLoading(true);
    const res = await axios.get(`${BASEURL}/get-meter-readings`, {
      params: { search: query, limit: 10 },
      withCredentials: true,
    });

    setOptions(res.data.data || []);
    setLoading(false);
  };

  return (
    <Autocomplete
      options={options}
      loading={loading}
      getOptionLabel={(o) => o?.connectionNumber || ""}
      onInputChange={(_, value) => searchReadings(value)}
      onChange={(_, value) => onSelect(value)}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search meter reading"
          placeholder="Connection number, name or phone"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress size={18} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

MeterReadingSearch.propTypes = {
  onSelect: PropTypes.func.isRequired,
};
