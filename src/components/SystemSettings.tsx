import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Container,
  Paper,
} from '@mui/material';
import GeneralSettings from './tabs/GeneralSettings';
import SLASettings from './tabs/SLASettings';
import AssetsDepartmentsSettings from './tabs/AssetsDepartmentsSettings';

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
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
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
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const SystemSettings: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={value} onChange={handleChange} aria-label="system settings tabs">
            <Tab label="General" {...a11yProps(0)} />
            <Tab label="SLA" {...a11yProps(1)} />
            <Tab label="Assets & Departments" {...a11yProps(2)} />
          </Tabs>
        </Box>
        <TabPanel value={value} index={0}>
          <GeneralSettings />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <SLASettings />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <AssetsDepartmentsSettings />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default SystemSettings;