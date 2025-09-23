import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { assetApi, Asset, departmentApi, Department } from '../../services/api';

const AssetsManagement: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    serialNumber: '',
    department: '',
  });

  // Load all assets and departments on component mount
  useEffect(() => {
    loadAssets();
    loadDepartments();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const response = await assetApi.getAll();
      setAssets(response.data);
    } catch (error) {
      showSnackbar('Failed to load assets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data.content);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      code: '',
      name: '',
      serialNumber: '',
      department: '',
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleDepartmentChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      department: event.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await assetApi.create(formData);
      showSnackbar('Asset created successfully!', 'success');
      handleCloseDialog();
      loadAssets();
    } catch (error) {
      showSnackbar('Failed to create asset', 'error');
    }
  };

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      loadAssets();
      return;
    }

    setLoading(true);
    try {
      const response = await assetApi.getByCode(searchCode);
      setAssets([response.data]);
    } catch (error) {
      showSnackbar('Asset not found', 'error');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Assets Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Asset
        </Button>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search by Asset Code"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            size="small"
            sx={{ minWidth: 250 }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchByCode()}
          />
          <Button
            variant="outlined"
            startIcon={<SearchIcon />}
            onClick={handleSearchByCode}
          >
            Search
          </Button>
          {searchCode && (
            <Button
              variant="text"
              onClick={() => {
                setSearchCode('');
                loadAssets();
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Assets Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Serial Number</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Repair Cost</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : assets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No assets found
                </TableCell>
              </TableRow>
            ) : (
              assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>{asset.code}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={asset.department}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    ${asset.aggregateRepairCost || 0}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Asset Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Asset</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Asset Code"
              value={formData.code}
              onChange={handleInputChange('code')}
              fullWidth
              required
              placeholder="e.g., 1232"
            />
            <TextField
              label="Asset Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
              placeholder="e.g., HP"
            />
            <TextField
              label="Serial Number"
              value={formData.serialNumber}
              onChange={handleInputChange('serialNumber')}
              fullWidth
              required
              placeholder="e.g., 3748"
            />
            <FormControl fullWidth required>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.department}
                onChange={handleDepartmentChange}
                label="Department"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.name}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Asset
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssetsManagement;