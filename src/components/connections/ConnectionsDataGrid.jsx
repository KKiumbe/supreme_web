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
        width: 280,
        flex: 1.6,
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
        width: 160,
        flex: 1.1,
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
      {
        field: "connectionNumber",
        headerName: "Conn #",
        width: 160,
        flex: 1.2,
      },
      { field: "customerName", headerName: "Customer", width: 260, flex: 1.6 },
      {
        field: "customerPhoneNumber",
        headerName: "Phone",
        width: 200,
        flex: 1.4,
      },
      { field: "schemeName", headerName: "Scheme", width: 200, flex: 1.4 },
      { field: "zoneName", headerName: "Zone", width: 190, flex: 1.3 },
      {
        field: "tariffCategoryName",
        headerName: "Tariff",
        width: 220,
        flex: 1.5,
      },
      {
        field: "meterSerialNumber",
        headerName: "Meter",
        width: 200,
        flex: 1.4,
      },
    ],
    [onEditClick, onAssignMeterClick, onViewDetailsClick],
  );

  return (
    <Box
      sx={{
        flex: 1,
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
