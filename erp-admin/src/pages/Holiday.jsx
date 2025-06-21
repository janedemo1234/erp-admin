import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

const HolidayManagement = () => {
  const [activeTab, setActiveTab] = useState('approved');
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [currentYear] = useState(new Date().getFullYear());
  
  // Add Holiday form states
  const [holidayForms, setHolidayForms] = useState([
    {
      holidayName: "",
      holidayDate: "",
      holidayType: "National",
      isOptional: false,
      year: new Date().getFullYear(),
      description: "",
    },
  ]);

  // Approved Holiday filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // API Base URL - Update this to match your backend
  const API_BASE_URL = 'http://localhost:8080/api/holidays';

  // Mock data for fallback when backend is not available
  const mockHolidays = [
    {
      id: 1,
      name: "New Year's Day",
      date: "2025-01-01",
      type: "National",
      year: 2025,
      description: "Beginning of the new calendar year",
      status: "Holiday Approved",
      createdBy: "Admin",
      createdDate: "2024-12-01",
      approvedBy: "MD",
      approvedDate: "2024-12-05",
      rejectionReason: null
    },
    {
      id: 2,
      name: "Republic Day",
      date: "2025-01-26",
      type: "National",
      year: 2025,
      description: "Celebrates the adoption of Constitution of India",
      status: "Holiday Approved",
      createdBy: "Admin",
      createdDate: "2024-12-01",
      approvedBy: "MD",
      approvedDate: "2024-12-05",
      rejectionReason: null
    },
    {
      id: 3,
      name: "Holi",
      date: "2025-03-14",
      type: "Religious",
      year: 2025,
      description: "Festival of colors",
      status: "Pending Approval",
      createdBy: "HR",
      createdDate: "2024-12-10",
      approvedBy: null,
      approvedDate: null,
      rejectionReason: null
    },
    {
      id: 4,
      name: "Good Friday",
      date: "2025-04-18",
      type: "Religious",
      year: 2025,
      description: "Christian holiday commemorating crucifixion of Jesus",
      status: "Rejected",
      createdBy: "HR",
      createdDate: "2024-12-08",
      approvedBy: "MD",
      approvedDate: "2024-12-12",
      rejectionReason: "Already have enough holidays in April"
    }
  ];

  // Check backend connectivity
  const checkBackendConnectivity = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_BASE_URL}/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setIsBackendConnected(response.ok);
      return response.ok;
    } catch (err) {
      console.log('Backend connectivity check failed:', err.message);
      setIsBackendConnected(false);
      return false;
    }
  };

  // API Functions with error handling and fallback
  const fetchAllHolidays = async () => {
    try {
      setLoading(true);
      setError('');
      
      const isConnected = await checkBackendConnectivity();
      
      if (!isConnected) {
        console.log('Backend not available, using mock data');
        setHolidays(mockHolidays);
        setError('Backend server is not available. Showing sample data.');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/all`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const transformedHolidays = data.data.map(holiday => ({
          id: holiday.holidayId,
          name: holiday.holidayName,
          date: holiday.holidayDate,
          type: holiday.holidayType,
          year: holiday.year,
          description: holiday.description,
          status: getStatusText(holiday.mdApprovalStatus),
          createdBy: holiday.createdBy,
          createdDate: holiday.createdDate,
          approvedBy: holiday.approvedBy,
          approvedDate: holiday.approvedDate,
          rejectionReason: holiday.rejectionReason
        }));
        setHolidays(transformedHolidays);
        setIsBackendConnected(true);
      } else {
        throw new Error(data.message || 'Failed to fetch holidays');
      }
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setIsBackendConnected(false);
      
      if (err.name === 'AbortError') {
        setError('Request timed out. Using sample data.');
      } else {
        setError('Unable to connect to server. Using sample data.');
      }
      
      // Use mock data as fallback
      setHolidays(mockHolidays);
    } finally {
      setLoading(false);
    }
  };

  const fetchHolidaysByYear = async (year) => {
    try {
      setLoading(true);
      setError('');
      
      const isConnected = await checkBackendConnectivity();
      
      if (!isConnected) {
        console.log('Backend not available, filtering mock data by year');
        const filteredMockData = mockHolidays.filter(holiday => holiday.year === year);
        setHolidays(filteredMockData);
        setError('Backend server is not available. Showing sample data.');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/by-year/${year}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const transformedHolidays = data.data.map(holiday => ({
          id: holiday.holidayId,
          name: holiday.holidayName,
          date: holiday.holidayDate,
          type: holiday.holidayType,
          year: holiday.year,
          description: holiday.description,
          status: getStatusText(holiday.mdApprovalStatus),
          createdBy: holiday.createdBy,
          createdDate: holiday.createdDate,
          approvedBy: holiday.approvedBy,
          approvedDate: holiday.approvedDate,
          rejectionReason: holiday.rejectionReason
        }));
        setHolidays(transformedHolidays);
        setIsBackendConnected(true);
      } else {
        throw new Error(data.message || 'Failed to fetch holidays');
      }
    } catch (err) {
      console.error('Error fetching holidays by year:', err);
      setIsBackendConnected(false);
      
      if (err.name === 'AbortError') {
        setError('Request timed out. Using sample data.');
      } else {
        setError('Unable to connect to server. Using sample data.');
      }
      
      // Use filtered mock data as fallback
      const filteredMockData = mockHolidays.filter(holiday => holiday.year === year);
      setHolidays(filteredMockData);
    } finally {
      setLoading(false);
    }
  };

  const addHoliday = async (holidayData) => {
    try {
      const isConnected = await checkBackendConnectivity();
      
      if (!isConnected) {
        throw new Error('Backend server is not available. Cannot add holidays at this time.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/add?createdBy=CurrentUser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          holidayName: holidayData.holidayName,
          holidayDate: holidayData.holidayDate,
          holidayType: holidayData.holidayType,
          description: holidayData.description,
          year: holidayData.year
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error adding holiday:', err);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw new Error(err.message || 'Failed to add holiday');
    }
  };

  const deleteHoliday = async (holidayId) => {
    try {
      const isConnected = await checkBackendConnectivity();
      
      if (!isConnected) {
        throw new Error('Backend server is not available. Cannot delete holidays at this time.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/${holidayId}`, {
        method: 'DELETE',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error deleting holiday:', err);
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw new Error(err.message || 'Failed to delete holiday');
    }
  };

  // Helper function to convert MD approval status to display text
  const getStatusText = (mdApprovalStatus) => {
    switch (mdApprovalStatus) {
      case 'Y': return 'Holiday Approved';
      case 'N': return 'Pending Approval';
      case 'R': return 'Rejected';
      default: return 'Unknown';
    }
  };

  // Load holidays on component mount
  useEffect(() => {
    fetchHolidaysByYear(selectedYear);
  }, [selectedYear]);

  // Filter holidays based on search and filter criteria
  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTypeFilter = !filterType || holiday.type === filterType;
    const matchesStatusFilter = !filterStatus || holiday.status === filterStatus;
    return matchesSearch && matchesTypeFilter && matchesStatusFilter;
  });

  // Add Holiday form handlers
  const addHolidayForm = () => {
    setHolidayForms([
      ...holidayForms,
      {
        holidayName: "",
        holidayDate: "",
        holidayType: "National",
        isOptional: false,
        year: new Date().getFullYear(),
        description: "",
      },
    ]);
  };

  const removeHolidayForm = (index) => {
    if (holidayForms.length > 1) {
      const newForms = holidayForms.filter((_, i) => i !== index);
      setHolidayForms(newForms);
    }
  };

  const updateHolidayForm = (index, field, value) => {
    const newForms = [...holidayForms];
    newForms[index] = { ...newForms[index], [field]: value };
    if (field === "holidayDate" && value) {
      const year = new Date(value).getFullYear();
      newForms[index].year = year;
    }
    setHolidayForms(newForms);
  };

  const submitHolidays = async () => {
    try {
      setLoading(true);
      setError('');

      const validForms = holidayForms.filter((form) => {
        const isComplete = form.holidayName.trim() && form.holidayDate && form.description.trim();
        return isComplete;
      });

      if (validForms.length === 0) {
        setError("Please fill in all required fields");
        return;
      }

      // Add holidays one by one
      const results = [];
      for (const form of validForms) {
        const result = await addHoliday(form);
        results.push(result);
      }

      // Check if all were successful
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        // Reset form
        setHolidayForms([
          {
            holidayName: "",
            holidayDate: "",
            holidayType: "National",
            isOptional: false,
            year: new Date().getFullYear(),
            description: "",
          },
        ]);

        // Refresh holidays list
        await fetchHolidaysByYear(selectedYear);
        
        alert("Holidays added successfully and sent for MD approval!");
      } else {
        const failedResults = results.filter(result => !result.success);
        setError(`Some holidays failed to add: ${failedResults.map(r => r.message).join(', ')}`);
      }
    } catch (error) {
      console.error("Error adding holidays:", error);
      setError(error.message || "Error adding holidays. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (holidayId, holidayName) => {
    if (!isBackendConnected) {
      alert("Cannot delete holidays - backend server is not available");
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${holidayName}"?`)) {
      try {
        setLoading(true);
        const result = await deleteHoliday(holidayId);
        
        if (result.success) {
          await fetchHolidaysByYear(selectedYear);
          alert("Holiday deleted successfully!");
        } else {
          setError(result.message || "Failed to delete holiday");
        }
      } catch (error) {
        setError(error.message || "Error deleting holiday. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const refreshData = () => {
    fetchHolidaysByYear(selectedYear);
  };

  // Utility functions
  const getTypeColor = (type) => {
    const colors = {
      'National': 'bg-blue-100 text-blue-800 border-blue-200',
      'Local': 'bg-purple-100 text-purple-800 border-purple-200',
      'Election': 'bg-orange-100 text-orange-800 border-orange-200',
      'Bank holiday': 'bg-green-100 text-green-800 border-green-200',
      'Others': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    if (status === 'Holiday Approved') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (status === 'Pending Approval') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else if (status === 'Rejected') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    if (status === 'Holiday Approved') {
      return <CheckCircle size={16} className="text-green-600" />;
    } else if (status === 'Pending Approval') {
      return <Clock size={16} className="text-yellow-600" />;
    } else if (status === 'Rejected') {
      return <XCircle size={16} className="text-red-600" />;
    }
    return null;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const approvedCount = holidays.filter(h => h.status === 'Holiday Approved').length;
  const pendingCount = holidays.filter(h => h.status === 'Pending Approval').length;
  const rejectedCount = holidays.filter(h => h.status === 'Rejected').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Backend Status Indicator */}
        {/* <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          isBackendConnected 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-orange-50 border border-orange-200 text-orange-700'
        }`}>
          {isBackendConnected ? (
            <>
              <Wifi size={16} />
              <span>Connected to backend server</span>
            </>
          ) : (
            <>
              <WifiOff size={16} />
              <span>Backend server unavailable - showing sample data</span>
            </>
          )}
        </div> */}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button 
                onClick={() => setError('')}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              
              <button
                onClick={() => setActiveTab('add')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'add'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Add Holiday
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'approved'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Holiday Management
              </button>
              
            </nav>
          </div>

          {/* Holiday Management Tab */}
          {activeTab === 'approved' && (
            <div className="p-6">
              {/* Header with Year Selection and Refresh */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Array.from({length: 10}, (_, i) => currentYear - 5 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Holidays for {selectedYear}
                  </h2>
                </div>
                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* Filters */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Search holidays..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="National">National</option>
                      <option value="Local">Local</option>
                      <option value="Election">Election</option>
                      <option value="Bank holiday">Bank holiday</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="sm:w-48">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="Holiday Approved">Approved</option>
                      <option value="Pending Approval">Pending</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Approved Holidays</p>
                      <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Pending Approval</p>
                      <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-600">Loading holidays...</p>
                </div>
              )}

              {/* Table */}
              {!loading && (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Holiday Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredHolidays.map((holiday, index) => (
                          <tr key={holiday.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{holiday.name}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatDate(holiday.date)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getTypeColor(holiday.type)}`}>
                                {holiday.type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs">{holiday.description}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(holiday.status)}
                                <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(holiday.status)}`}>
                                  {holiday.status}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeleteHoliday(holiday.id, holiday.name)}
                                disabled={!isBackendConnected}
                                className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={isBackendConnected ? "Delete Holiday" : "Backend not available"}
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredHolidays.length === 0 && !loading && (
                    <div className="text-center py-12">
                      <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No holidays found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || filterType || filterStatus
                          ? 'Try adjusting your search or filter criteria.' 
                          : 'No holidays available for this year.'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Add Holiday Tab */}
          {activeTab === 'add' && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Add New Holidays</h3>
                {/* <p className="text-sm text-gray-600">
                  All holidays will be sent to MD for approval after submission.
                  {!isBackendConnected && (
                    <span className="text-orange-600 ml-2">
                      (Backend server unavailable - cannot add holidays)
                    </span>
                  )}
                </p> */}
              </div>

              {holidayForms.map((form, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6 mb-4 relative border border-gray-200">
                  {holidayForms.length > 1 && (
                    <button
                      onClick={() => removeHolidayForm(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Name *
                      </label>
                      <input
                        type="text"
                        value={form.holidayName}
                        onChange={(e) => updateHolidayForm(index, 'holidayName', e.target.value)}
                        placeholder="Enter holiday name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={form.holidayDate}
                        onChange={(e) => updateHolidayForm(index, 'holidayDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Type
                      </label>
                      <select
                        value={form.holidayType}
                        onChange={(e) => updateHolidayForm(index, 'holidayType', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      >
                        <option value="National">National</option>
                        <option value="Regional">Regional</option>
                        <option value="Religious">Religious</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Festival">Festival</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year (Auto-filled)
                      </label>
                      <input
                        type="number"
                        value={form.year}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description *
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(e) => updateHolidayForm(index, 'description', e.target.value)}
                        placeholder="Enter holiday description"
                        rows="2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-between items-center">
                <button
                  onClick={addHolidayForm}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} />
                  Add Another Holiday
                </button>

                <button
                  onClick={submitHolidays}
                  disabled={loading || !isBackendConnected}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!isBackendConnected ? "Backend server not available" : ""}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  {loading ? 'Saving...' : 'Submit for Approval'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HolidayManagement;
