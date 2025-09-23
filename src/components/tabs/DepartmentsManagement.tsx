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
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { departmentApi, Department } from '../../services/api';

const DepartmentsManagement: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchCode, setSearchCode] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    sortOrder: 1,
    suffixNumber: 10,
  });

  // Load all departments on component mount
  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data.content);
    } catch (error) {
      showSnackbar('Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      sortOrder: 1,
      suffixNumber: 10,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'sortOrder' || field === 'suffixNumber' 
      ? parseInt(event.target.value) || 0 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      await departmentApi.create(formData);
      showSnackbar('Department created successfully!', 'success');
      handleCloseDialog();
      loadDepartments();
    } catch (error) {
      showSnackbar('Failed to create department', 'error');
    }
  };

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      loadDepartments();
      return;
    }

    setLoading(true);
    try {
      const response = await departmentApi.getByCode(searchCode);
      setDepartments([response.data]);
    } catch (error) {
      showSnackbar('Department not found', 'error');
      setDepartments([]);
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
          Departments Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Department
        </Button>
      </Box>

      {/* Search Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Search by Department Code"
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
                loadDepartments();
              }}
            >
              Clear
            </Button>
          )}
        </Box>
      </Paper>

      {/* Departments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Sort Order</TableCell>
              <TableCell>Suffix Number</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>{dept.description}</TableCell>
                  <TableCell>{dept.sortOrder}</TableCell>
                  <TableCell>{dept.suffixNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={dept.isActive ? 'Active' : 'Inactive'}
                      color={dept.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Department Dialog */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Department Code"
              value={formData.code}
              onChange={handleInputChange('code')}
              fullWidth
              required
              placeholder="e.g., 23910"
            />
            <TextField
              label="Department Name"
              value={formData.name}
              onChange={handleInputChange('name')}
              fullWidth
              required
              placeholder="e.g., Laptop Services"
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={handleInputChange('description')}
              fullWidth
              multiline
              rows={3}
              placeholder="Department description"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Sort Order"
                type="number"
                value={formData.sortOrder}
                onChange={handleInputChange('sortOrder')}
                fullWidth
                required
              />
              <TextField
                label="Suffix Number"
                type="number"
                value={formData.suffixNumber}
                onChange={handleInputChange('suffixNumber')}
                fullWidth
                required
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Create Department
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

export default DepartmentsManagement;