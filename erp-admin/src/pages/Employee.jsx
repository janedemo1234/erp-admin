import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const columns = [
  { field: 'employeeSerialNumber', headerName: 'Emp ID', width: 130 },
  { field: 'employeeName', headerName: 'Name', width: 200 },
  { field: 'emailAddress', headerName: 'Email', width: 250 },
  { field: 'designation', headerName: 'Designation', width: 180 },
  { field: 'department', headerName: 'Department', width: 150 },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: (params) => {
      const status = params.value;
      if (status === 'Y') {
        return <span style={{ color: 'green', fontWeight: 'bold' }}>Active</span>;
      } else {
        return <span style={{ color: 'red', fontWeight: 'bold' }}>Pending</span>;
      }
    },
  },
  { field: 'reportingOfficer', headerName: 'Reporting Officer', width: 200 },
  { field: 'dateOfJoining', headerName: 'Date of Joining', width: 150 },
  { field: 'grossSalary', headerName: 'Gross Salary', type: 'number', width: 150 },
];

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8080/api/user-profiles/all", {
          headers: {
            // Add any necessary headers, e.g., Authorization
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const formattedData = data.map((emp, index) => ({
          ...emp,
          id: emp.employeeSerialNumber || index, // Keep original id logic for DataGrid key
          // displayEmpId is removed, employeeSerialNumber will be used directly
          status: emp.status || 'N' // Default to 'N' (Pending) if not provided
        }));
        setEmployees(formattedData);
        setFilteredEmployees(formattedData);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error(`Failed to fetch employees: ${error.message}. Displaying fallback data.`);
        // Fallback data in case of API error
        const fallbackData = [
            { id: 'EMP001', employeeSerialNumber: 'EMP001', employeeName: 'John Doe', emailAddress: 'john.doe@example.com', designation: 'Software Engineer', department: 'IT', status: 'Y', reportingOfficer: 'Jane Smith', dateOfJoining: '2023-01-15', grossSalary: 75000 },
            { id: 'EMP002', employeeSerialNumber: 'EMP002', employeeName: 'Jane Smith', emailAddress: 'jane.smith@example.com', designation: 'Project Manager', department: 'Operations', status: 'N', reportingOfficer: 'Robert Johnson', dateOfJoining: '2022-03-20', grossSalary: 85000 },
        ];
        setEmployees(fallbackData);
        setFilteredEmployees(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  useEffect(() => {
    const results = employees.filter(employee =>
      employee.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeSerialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.emailAddress?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEmployees(results);
  }, [searchTerm, employees]);

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer />
      {/* <Typography variant="h4" gutterBottom component="div" sx={{ color: 'text.primary' }}>
        Employee Management
      </Typography> */}
      <Box sx={{ mb: 2, width: '50%' }}>
        <TextField
          fullWidth
          variant="outlined"
          label="Search Employees"
          placeholder="Name, ID, Email, Designation, Department"
          onChange={(e) => setSearchTerm(e.target.value)}
          value={searchTerm}
          size="small"
        />
      </Box>
      <Box sx={{ flexGrow: 1, height: '100%' }}>
        <DataGrid
          rows={filteredEmployees}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10, 25, 50]}
          checkboxSelection
          disableSelectionOnClick
          loading={loading}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: (theme) => theme.palette.primary.main, // Assuming this results in a light background as per screenshot
              color: (theme) => theme.palette.text.primary, // Change to a contrasting color like text.primary
              fontSize: '0.875rem', // Adjust header font size
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0',
              fontSize: '0.875rem', // Adjust cell font size
              color: 'text.primary', // Ensure cell text is visible
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: (theme) => theme.palette.background.paper,
            },
            // Ensure column header text is visible
            '& .MuiDataGrid-columnHeaderTitle': {
              overflow: 'visible',
              lineHeight: 'normal',
              fontWeight: 'bold', // Make header text bolder
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default EmployeePage;