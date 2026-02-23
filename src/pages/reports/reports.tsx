import React, { useEffect, useMemo, useState } from "react";
// @ts-ignore
import {
  PermissionDeniedUI,
  isPermissionDenied,
} from "../../utils/permissionHelper";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Stack,
  Collapse,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import {
  ActiveReport,
  BillType,
  fetchBillTypes,
  fetchReportStatus,
  fetchSchemes,
  PAYMENT_MODES,
  REPORT_SECTIONS,
  ReportFormat,
  ReportJob,
  requestReportJob,
  Scheme,
} from "./reportSections";

const BASEURL = import.meta.env.VITE_BASE_URL;

/* ---------------- PARAM NORMALIZER ---------------- */
function normalizeParams(params?: any) {
  if (!Array.isArray(params)) {
    return [];
  }
  return params.map((p) =>
    typeof p === "string"
      ? { name: p, label: p, type: "date", optional: false }
      : p,
  );
}

export default function ReportsPage() {
  const [jobs, setJobs] = useState<ReportJob[]>([]);
  const [activeReport, setActiveReport] = useState<ActiveReport | null>(null);
  const [params, setParams] = useState<Record<string, any>>({});
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [billTypes, setBillTypes] = useState<BillType[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [search, setSearch] = useState("");

  /* ---------------- LOAD LOOKUPS ---------------- */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [billTypesData, schemesData] = await Promise.all([
          fetchBillTypes(),
          fetchSchemes(),
        ]);
        setBillTypes(billTypesData);
        setSchemes(schemesData);
      } catch (err: any) {
        if (isPermissionDenied(err)) {
          setPermissionDenied(true);
        }
      }
    };
    loadData();
  }, []);

  /* ---------------- PARAMS ---------------- */
  const normalizedParams = useMemo(
    () => normalizeParams(activeReport?.params),
    [activeReport],
  );

  const missingRequiredParams = useMemo(() => {
    return normalizedParams.filter((p) => !p.optional && !params[p.name]);
  }, [normalizedParams, params]);

  const canSubmit =
    !!activeReport &&
    !!format &&
    missingRequiredParams.length === 0 &&
    !submitting;

  /* ---------------- REQUEST REPORT ---------------- */
  async function handleRequestReport() {
    if (!canSubmit || !activeReport) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const requestPayload = {
        reportType: activeReport.key,
        params: { ...params, format },
      };

      const job = await requestReportJob(requestPayload);

      setJobs((prev) => [job, ...prev]);
      setActiveReport(null);
      setParams({});
    } catch (err: any) {
      if (isPermissionDenied(err)) {
        setPermissionDenied(true);
      } else {
        setError(err.message ?? "Failed to request report");
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------------- POLLING ---------------- */
  useEffect(() => {
    const pending = jobs.filter(
      (j) => j.status !== "COMPLETED" && j.status !== "FAILED",
    );
    if (!pending.length) {
      return;
    }

    const poll = async () => {
      const updates = await Promise.all(
        pending.map((j) => fetchReportStatus(j.reportJobId)),
      );

      setJobs((prev) =>
        prev.map(
          (j) => updates.find((u) => u.reportJobId === j.reportJobId) ?? j,
        ),
      );
    };

    poll();
    const interval = setInterval(poll, 6000);
    return () => clearInterval(interval);
  }, [jobs]);

  /* ---------------- COLUMNS ---------------- */
  const columns: GridColDef[] = [
    { field: "reportType", headerName: "Report", flex: 1 },
    { field: "createdAt", headerName: "Requested At", width: 180 },
    {
      field: "status",
      headerName: "Status",
      width: 180,
      renderCell: (p) => (
        <Stack spacing={0.5}>
          <Chip
            size="small"
            label={p.value}
            color={
              p.value === "COMPLETED"
                ? "success"
                : p.value === "FAILED"
                  ? "error"
                  : "warning"
            }
          />
          {p.value !== "COMPLETED" && p.value !== "FAILED" && (
            <LinearProgress />
          )}
        </Stack>
      ),
    },
    {
      field: "actions",
      headerName: "",
      width: 160,
      renderCell: (p) =>
        p.row.status === "COMPLETED" ? (
          <Button
            size="small"
            onClick={() =>
              (window.location.href = `${BASEURL}${p.row.downloadUrl}`)
            }
          >
            Download
          </Button>
        ) : (
          <CircularProgress size={16} />
        ),
    },
  ];

  /* ---------------- FILTER ---------------- */
  const filteredSections = useMemo(() => {
    if (!search) {
      return REPORT_SECTIONS;
    }
    return REPORT_SECTIONS.map((s) => ({
      ...s,
      reports: s.reports.filter((r) =>
        r.label.toLowerCase().includes(search.toLowerCase()),
      ),
    })).filter((s) => s.reports.length > 0);
  }, [search]);

  /* ---------------- RENDER ---------------- */
  return (
    <Box sx={{ height: "100vh", px: 4, py: 3, minWidth: 1200 }}>
      {permissionDenied ? (
        <PermissionDeniedUI permission="reports:view" />
      ) : (
        <>
          <Typography variant="h5" fontWeight={700}>
            Reports
          </Typography>

          <Divider sx={{ my: 3 }} />

          {error && <Alert severity="error">{error}</Alert>}

          <Paper sx={{ p: 3, mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
              <Typography fontWeight={600}>Select Report</Typography>
              <TextField
                size="small"
                placeholder="Search report…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Stack>

            {filteredSections.map((section) => (
              <Box key={section.section} mb={3}>
                <Typography variant="subtitle2">{section.section}</Typography>

                <Grid container spacing={3} mt={1}>
                  {section.reports.map((r) => {
                    const isActive = activeReport?.key === r.key;

                    return (
                      <Grid item xs={12} md={6} lg={4} key={r.key}>
                        <Paper
                          variant={isActive ? "elevation" : "outlined"}
                          sx={{ p: 3 }}
                        >
                          <Box
                            sx={{ cursor: "pointer" }}
                            onClick={() => {
                              setActiveReport(isActive ? null : r);
                              setParams({});
                            }}
                          >
                            <Typography fontWeight={600}>{r.label}</Typography>
                          </Box>

                          <Collapse in={isActive}>
                            <Box sx={{ mt: 3 }}>
                              <Stack spacing={2.5}>
                                <TextField
                                  select
                                  label="Report Format"
                                  value={format}
                                  onChange={(e) =>
                                    setFormat(e.target.value as ReportFormat)
                                  }
                                >
                                  <MenuItem value="pdf">PDF</MenuItem>
                                  <MenuItem value="excel">Excel</MenuItem>
                                </TextField>

                                {normalizedParams.map((param) => {
                                  /* DATE */
                                  if (param.type === "date") {
                                    return (
                                      <TextField
                                        key={param.name}
                                        type="date"
                                        label={param.label}
                                        required={!param.optional}
                                        InputLabelProps={{ shrink: true }}
                                        value={params[param.name] ?? ""}
                                        onChange={(e) =>
                                          setParams((prev) => ({
                                            ...prev,
                                            [param.name]: e.target.value,
                                          }))
                                        }
                                      />
                                    );
                                  }

                                  /* SELECT WITH options */
                                  if (
                                    param.type === "select" &&
                                    param.options
                                  ) {
                                    return (
                                      <TextField
                                        key={param.name}
                                        select
                                        label={param.label}
                                        value={params[param.name] ?? ""}
                                        onChange={(e) =>
                                          setParams((prev) => ({
                                            ...prev,
                                            [param.name]: Number(
                                              e.target.value,
                                            ),
                                          }))
                                        }
                                      >
                                        {param.options.map((opt: any) => (
                                          <MenuItem
                                            key={opt.value}
                                            value={opt.value}
                                          >
                                            {opt.label}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    );
                                  }

                                  /* PAYMENT MODES */
                                  if (
                                    param.type === "select" &&
                                    param.source === "PAYMENT_MODES"
                                  ) {
                                    return (
                                      <TextField
                                        key={param.name}
                                        select
                                        label={param.label}
                                        value={params[param.name] ?? ""}
                                        onChange={(e) =>
                                          setParams((prev) => ({
                                            ...prev,
                                            [param.name]: e.target.value,
                                          }))
                                        }
                                      >
                                        {PAYMENT_MODES.map((m) => (
                                          <MenuItem key={m} value={m}>
                                            {m.replace("_", " ")}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    );
                                  }

                                  /* BILL TYPES */
                                  if (
                                    param.type === "select" &&
                                    param.source === "BILL_TYPES"
                                  ) {
                                    return (
                                      <TextField
                                        key={param.name}
                                        select
                                        label={param.label}
                                        value={params[param.name] ?? ""}
                                        onChange={(e) =>
                                          setParams((prev) => ({
                                            ...prev,
                                            [param.name]: Number(
                                              e.target.value,
                                            ),
                                          }))
                                        }
                                      >
                                        {billTypes.map((bt) => (
                                          <MenuItem key={bt.id} value={bt.id}>
                                            {bt.name}
                                          </MenuItem>
                                        ))}
                                      </TextField>
                                    );
                                  }

                                  return null;
                                })}

                                {submitting && <LinearProgress />}

                                <Button
                                  variant="contained"
                                  disabled={!canSubmit}
                                  onClick={handleRequestReport}
                                >
                                  Generate Report
                                </Button>
                              </Stack>
                            </Box>
                          </Collapse>
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ))}
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography fontWeight={600} mb={2}>
              Report Jobs
            </Typography>

            <DataGrid
              rows={jobs}
              columns={columns}
              getRowId={(r) => r.reportJobId}
              autoHeight
              disableRowSelectionOnClick
            />
          </Paper>
        </>
      )}
    </Box>
  );
}
