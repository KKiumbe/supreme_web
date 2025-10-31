import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Button, Stack, Box } from '@mui/material';

const ZoneList = ({ zones, selectedZone, onSelect, onAdd }) => (
  <Card variant="outlined" sx={{ borderRadius: 3, height: '75vh', display: 'flex', flexDirection: 'column', minWidth: 300 }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Zones</Typography>
        <Button size="small" variant="contained" onClick={onAdd}>+ Add</Button>
      </Stack>

      <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
        {zones.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Select a scheme to view its zones.
          </Typography>
        ) : (
          zones.map((zone) => (
            <Card
              key={zone.id}
              onClick={() => onSelect(zone)}
              sx={{
                mb: 1,
                p: 1.5,
                cursor: 'pointer',
                border: selectedZone?.id === zone.id ? '2px solid #1976d2' : '1px solid #e0e0e0'
              }}
            >
              <Typography>{zone.name}</Typography>
            </Card>
          ))
        )}
      </Box>
    </CardContent>
  </Card>
);

ZoneList.propTypes = {
  zones: PropTypes.array.isRequired,
  selectedZone: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default ZoneList;
