import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { toast, ToastContainer } from 'react-toastify';
import { motion } from 'framer-motion';
import { FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';

const EmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Animation variants for the download button
  const buttonVariants = {
    hover: {
      scale: 1.02,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  };

  const columns = [
   { 
    field: 'employeeSerialNumber', 
    headerName: 'Emp ID', 
    width: 130,
    renderCell: (params) => (
      <Link 
        to={`/admin/employees/${params.value}`}
        className="text-indigo-600 hover:text-indigo-800 hover:underline font-medium"
        style={{ textDecoration: 'none' }}
      >
        {params.value}
      </Link>
    ),
  },
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
          return <span style={{ color: 'green', fontWeight: 'bold' }}>Onboarded</span>;
        } else {
          return <span style={{ color: 'red', fontWeight: 'bold' }}>Onboarding Pending</span>;
        }
      },
    },
    { field: 'reportingOfficer', headerName: 'Reporting Officer', width: 200 },
    { field: 'dateOfJoining', headerName: 'Date of Joining', width: 150 },
    { field: 'grossSalary', headerName: 'Gross Salary', type: 'number', width: 150 },
  ];

  // Fields to exclude from Excel export (all file-related fields)
  const excludeFields = [
    'addressProofFile',
    'adhaarFile',
    'legalBackground',
    'medicalBackground',
    'offerLetter',
    'panFile',
    'passbookFile',
    'photo',
    'qualificationDocument',
    'id', // DataGrid internal ID
    'status' // We'll use a formatted version instead
  ];

  // Function to format field names for Excel headers
  const formatFieldName = (fieldName) => {
    const fieldMappings = {
      'srNo': 'Serial No',
      'employeeSerialNumber': 'Employee ID',
      'employeeName': 'Employee Name',
      'emailAddress': 'Email Address',
      'dateOfBirth': 'Date of Birth',
      'dateOfJoining': 'Date of Joining',
      'grossSalary': 'Gross Salary',
      'emergencyContactNumber': 'Emergency Contact',
      'bankAccountNumber': 'Bank Account Number',
      'bankName': 'Bank Name',
      'ifscCode': 'IFSC Code',
      'bloodGroup': 'Blood Group',
      'personalFileNumber': 'Personal File Number',
      'reportingOfficer': 'Reporting Officer',
      'adhaar': 'Aadhaar Number',
      'pan': 'PAN Number'
    };

    return fieldMappings[fieldName] || fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  };

  // Function to handle download
  const handleDownloadUsers = async () => {
    try {
      setDownloading(true);
      
      // Fetch fresh data from API
      const response = await fetch("http://localhost:8080/api/user-profiles/all");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        toast.warning('No employee data available to download');
        return;
      }

      // Process data for Excel export
      const processedData = data.map((employee, index) => {
        const filteredEmployee = {};
        
        // Get all keys from the employee object
        Object.keys(employee).forEach(key => {
          // Skip file fields and internal fields
          if (!excludeFields.includes(key)) {
            const formattedKey = formatFieldName(key);
            
            // Special formatting for specific fields
            if (key === 'grossSalary' && employee[key]) {
              filteredEmployee[formattedKey] = parseFloat(employee[key]).toFixed(2);
            } else if (key === 'dateOfBirth' || key === 'dateOfJoining') {
              filteredEmployee[formattedKey] = employee[key] || 'N/A';
            } else {
              filteredEmployee[formattedKey] = employee[key] || 'N/A';
            }
          }
        });

        // Add formatted status
        const status = employee.status === 'Y' ? 'Onboarded' : 'Onboarding Pending';
        filteredEmployee['Onboarding Status'] = status;

        return filteredEmployee;
      });

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(processedData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // Serial No
        { wch: 15 }, // Employee ID
        { wch: 25 }, // Employee Name
        { wch: 35 }, // Email Address
        { wch: 20 }, // Designation
        { wch: 15 }, // Department
        { wch: 30 }, // Address
        { wch: 15 }, // Aadhaar Number
        { wch: 20 }, // Bank Account Number
        { wch: 15 }, // Bank Name
        { wch: 12 }, // Blood Group
        { wch: 15 }, // Date of Birth
        { wch: 15 }, // Date of Joining
        { wch: 18 }, // Emergency Contact
        { wch: 12 }, // Gross Salary
        { wch: 12 }, // IFSC Code
        { wch: 12 }, // PAN Number
        { wch: 20 }, // Personal File Number
        { wch: 30 }, // Qualification
        { wch: 20 }, // Reporting Officer
        { wch: 20 }, // Onboarding Status
      ];
      
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

      // Generate filename with current date
      const currentDate = new Date().toISOString().split('T')[0];
      const filename = `employees_data_${currentDate}.xlsx`;

      // Save the file
      XLSX.writeFile(workbook, filename);

      toast.success(`Employee data downloaded successfully! (${processedData.length} records)`);
      
    } catch (error) {
      console.error('Download failed:', error);
      toast.error(`Failed to download employee data: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

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
          id: emp.employeeSerialNumber || index,
          status: emp.status || 'N'
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
      
      {/* Header Section with Search and Download Button */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
        <Box sx={{ width: '50%' }}>
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
        
        <motion.button
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          onClick={handleDownloadUsers}
          disabled={downloading}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Download Users Data"
        >
          <FaDownload className="mr-2 inline h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download Employees'}
        </motion.button>
      </Box>

      {/* Data Grid */}
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
              backgroundColor: (theme) => theme.palette.primary.main,
              color: (theme) => theme.palette.text.primary,
              fontSize: '0.875rem',
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #e0e0e0',
              fontSize: '0.875rem',
              color: 'text.primary',
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: (theme) => theme.palette.background.paper,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              overflow: 'visible',
              lineHeight: 'normal',
              fontWeight: 'bold',
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default EmployeePage;