import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Button, Stack, Box } from '@mui/material';

const RouteList = ({ routes, onAdd }) => (
  <Card variant="outlined" sx={{ borderRadius: 3, height: '75vh', display: 'flex', flexDirection: 'column', minWidth: 300 }}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Routes</Typography>
        <Button size="small" variant="contained" onClick={onAdd}>+ Add</Button>
      </Stack>

      <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
        {routes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Select a scheme or zone to view routes.
          </Typography>
        ) : (
          routes.map((route) => (
            <Card key={route.id} sx={{ mb: 1, p: 1.5, border: '1px solid #e0e0e0' }}>
              <Typography>{route.name}</Typography>
            </Card>
          ))
        )}
      </Box>
    </CardContent>
  </Card>
);

RouteList.propTypes = {
  routes: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default RouteList;
