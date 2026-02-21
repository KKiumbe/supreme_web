import React, { useMemo } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Edit, Visibility, Devices } from "@mui/icons-material";

const ConnectionsDataGrid = ({
  connections,
  loading,
  page,
  pageSize,
  rowsPerPage,
  total,
  onPageChange,
  onPageSizeChange,
  onEditClick,
  onAssignMeterClick,
  onViewDetailsClick,
}) => {
  const columns = useMemo(
    () => [
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        align: "center",
        renderCell: (params) => (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <Tooltip title="Edit Connection">
              <IconButton
                size="small"
                color="theme.palette.primary.contrastText"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(params.row);
                }}
              >
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>

            {!params?.row?.meterId ? (
              <Tooltip title="Assign Meter">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignMeterClick(params.row);
                  }}
                >
                  <Devices fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="info"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetailsClick(params.row);
                  }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        renderCell: (params) => (
          <Chip
            label={params.value}
            color={
              params.value === "ACTIVE"
                ? "success"
                : params.value === "PENDING_METER"
                  ? "warning"
                  : params.value === "DISCONNECTED"
                    ? "error"
                    : "default"
            }
            size="small"
          />
        ),
      },
      { field: "connectionNumber", headerName: "Conn #", width: 100 },
      { field: "customerName", headerName: "Customer", width: 150 },
      { field: "customerPhoneNumber", headerName: "Phone", width: 120 },
      { field: "schemeName", headerName: "Scheme", width: 120 },
      { field: "zoneName", headerName: "Zone", width: 110 },
      { field: "tariffCategoryName", headerName: "Tariff", width: 140 },
      { field: "meterSerialNumber", headerName: "Meter", width: 120 },
    ],
    [onEditClick, onAssignMeterClick, onViewDetailsClick],
  );

  return (
    <Box
      sx={{
        flex: connections.length > 0 ? "0 0 55%" : "1",
        overflow: "hidden",
        borderRadius: 1,
        boxShadow: 1,
        transition: "flex 0.3s ease",
        bgcolor: "background.paper",
      }}
    >
      {loading ? (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={connections}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationModel={{ page, pageSize: rowsPerPage }}
          onPaginationModelChange={({ page: p, pageSize: ps }) => {
            onPageChange(p);
            onPageSizeChange(ps);
          }}
          rowCount={total}
          paginationMode="server"
          disableRowSelectionOnClick
          sx={{
            height: "100%",
            border: "none",
            "& .MuiDataGrid-columnHeaders": {
              bgcolor: "background.default",
              fontWeight: 600,
            },
          }}
          localeText={{ noRowsLabel: "No connections found" }}
        />
      )}
    </Box>
  );
};

export default ConnectionsDataGrid;
