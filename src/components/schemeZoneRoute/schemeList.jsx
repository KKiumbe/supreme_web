import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Typography, Button, Stack, Box } from '@mui/material';

const SchemeList = ({ schemes, selectedScheme, onSelect, onAdd }) => (
  <Card variant="outlined" sx={{ borderRadius: 3, height: '75vh', display: 'flex', flexDirection: 'column',  minWidth: 300}}>
    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Schemes</Typography>
        <Button size="small" variant="contained" onClick={onAdd}>+ Add</Button>
      </Stack>

      <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
        {schemes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No schemes available.
          </Typography>
        ) : (
          schemes.map((scheme) => (
            <Card
              key={scheme.id}
              onClick={() => onSelect(scheme)}
              sx={{
                mb: 1,
                p: 1.5,
                cursor: 'pointer',
                border: selectedScheme?.id === scheme.id ? '2px solid #1976d2' : '1px solid #e0e0e0'
              }}
            >
              <Typography fontWeight="bold">{scheme.name}</Typography>
            </Card>
          ))
        )}
      </Box>
    </CardContent>
  </Card>
);

SchemeList.propTypes = {
  schemes: PropTypes.array.isRequired,
  selectedScheme: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default SchemeList;
