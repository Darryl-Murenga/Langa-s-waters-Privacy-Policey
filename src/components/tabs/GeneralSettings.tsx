import React from 'react';
import { Typography, Box } from '@mui/material';

const GeneralSettings: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        General Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        General system configuration settings will be displayed here.
      </Typography>
    </Box>
  );
};

export default GeneralSettings;