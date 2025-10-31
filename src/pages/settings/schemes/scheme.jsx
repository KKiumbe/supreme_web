import { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import {
  createRoute,
  createScheme,
  createZone,
  fetchRoutesByZone,
  fetchSchemes,
  fetchZonesByScheme,
} from '../../../api/schemeZoneRoute';

import SchemeList from '../../../components/schemeZoneRoute/schemeList';
import ZoneList from '../../../components/schemeZoneRoute/zone';
import RouteList from '../../../components/schemeZoneRoute/routeList';
import TitleComponent from '../../../components/title';

const SchemeZoneRouteScreen = () => {
  const [schemes, setSchemes] = useState([]);
  const [zones, setZones] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSchemes();
  }, []);

  const loadSchemes = async () => {
    setLoading(true);
    try {
      const data = await fetchSchemes();
      setSchemes(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSchemeSelect = async (scheme) => {
    setSelectedScheme(scheme);
    setSelectedZone(null);
    setRoutes([]);

    const zonesData = await fetchZonesByScheme(scheme.id);
    setZones(zonesData);

    // Fetch all routes under all zones in the scheme
    const allRoutes = [];
    for (const zone of zonesData) {
      const zoneRoutes = await fetchRoutesByZone(zone.id);
      allRoutes.push(...zoneRoutes);
    }
    setRoutes(allRoutes);
  };

  const handleZoneSelect = async (zone) => {
    setSelectedZone(zone);
    const data = await fetchRoutesByZone(zone.id);
    setRoutes(data);
  };

  const handleAddClick = (type) => {
    if (type === 'zone' && !selectedScheme) {
      alert('Please select a scheme before adding a zone.');
      return;
    }
    if (type === 'route' && !selectedZone) {
      alert('Please select a zone before adding a route.');
      return;
    }
    setDialogType(type);
    setName('');
    setDialogOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      setLoading(true);
      if (dialogType === 'scheme') {
        await createScheme({ name });
        await loadSchemes();
      } else if (dialogType === 'zone') {
        await createZone({ name, schemeId: selectedScheme.id });
        await handleSchemeSelect(selectedScheme);
      } else if (dialogType === 'route') {
        await createRoute({ name, zoneId: selectedZone.id });
        await handleZoneSelect(selectedZone);
      }
      setDialogOpen(false);
    } catch (error) {
      console.error(error);
      alert('Error saving data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
       
      </Typography>

        <TitleComponent title=" Scheme, Zone & Route Management" />

      <Typography variant="body2" color="text.secondary" mb={3}>
        Manage your operational hierarchy by creating schemes, zones, and routes.
      </Typography>

      <Paper
        elevation={1}
        sx={{
          p: 2.5,
          borderRadius: 3,
          minHeight: '80vh',
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <SchemeList
              schemes={schemes}
              selectedScheme={selectedScheme}
              onSelect={handleSchemeSelect}
              onAdd={() => handleAddClick('scheme')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <ZoneList
              zones={zones}
              selectedZone={selectedZone}
              selectedScheme={selectedScheme}
              onSelect={handleZoneSelect}
              onAdd={() => handleAddClick('zone')}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <RouteList
              routes={routes}
              selectedScheme={selectedScheme}
              selectedZone={selectedZone}
              onAdd={() => handleAddClick('route')}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Add Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Add {dialogType.charAt(0).toUpperCase() + dialogType.slice(1)}
          </Typography>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <TextField
              label={`${dialogType} name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              autoFocus
              size="small"
            />
            <Button
              onClick={handleAddSubmit}
              variant="contained"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SchemeZoneRouteScreen;
