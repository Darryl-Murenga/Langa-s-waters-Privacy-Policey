import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
} from '@mui/material';
import DepartmentsManagement from './DepartmentsManagement';
import AssetsManagement from './AssetsManagement';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`management-tabpanel-${index}`}
      aria-labelledby={`management-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `management-tab-${index}`,
    'aria-controls': `management-tabpanel-${index}`,
  };
}

const AssetsDepartmentsSettings: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Assets & Departments Management
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage system assets and departments. Create, view, and organize your organizational structure and asset inventory.
      </Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="management tabs">
            <Tab label="Departments" {...a11yProps(0)} />
            <Tab label="Assets" {...a11yProps(1)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <DepartmentsManagement />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <AssetsManagement />
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default AssetsDepartmentsSettings;