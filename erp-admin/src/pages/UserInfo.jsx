import React, { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaEnvelope,
  FaIdCard,
  FaCalendar,
  FaMapMarkerAlt,
  FaPhone,
  FaSave,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaUserPlus,
  FaDownload,
  FaBuilding,
  FaUserTie,
  FaFileAlt,
  FaFilePdf,
  FaFileImage,
  FaHistory,
} from "react-icons/fa"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"
import { useNavigate } from 'react-router-dom';


// Helper function to create blob URLs from various data formats
const createBlobUrl = (data, contentType = 'application/octet-stream') => {
  if (!data) return null;
  
  try {
    // If it's already a data URL, return it directly
    if (typeof data === 'string' && data.startsWith('data:')) return data;
    
    // Handle base64 strings
    if (typeof data === 'string') {
      // Check if it looks like base64 data
      const isBase64 = /^[A-Za-z0-9+/=]+$/.test(data);
      
      if (isBase64) {
        const byteCharacters = atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: contentType });
        return URL.createObjectURL(blob);
      }
    }
    
    // Handle binary data
    if (typeof data === 'string') {
      const byteArray = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        byteArray[i] = data.charCodeAt(i) & 0xff;
      }
      const blob = new Blob([byteArray], { type: contentType });
      return URL.createObjectURL(blob);
    }
    
    // Fallback: return null
    return null;
  } catch (error) {
    console.error('Error creating blob URL:', error);
    return null;
  }
};

// Detect file type from data
const detectFileType = (data) => {
  if (!data) return 'unknown';
  
  if (typeof data === 'string' && data.startsWith('data:')) {
    return data.split(';')[0].split('/')[1];
  }
  
  // Try to detect from magic numbers
  if (typeof data === 'string') {
    if (data.startsWith('/9j') || data.startsWith('ÿØÿà')) {
      return 'jpeg';
    }
    
    if (data.startsWith('iVBORw')) {
      return 'png';
    }
    
    if (data.startsWith('JVBER')) {
      return 'pdf';
    }
  }
  
  return 'file';
};

// Helper function for fetch with timeout
async function fetchWithTimeout(resource, options = {}, timeout = 10000) {
  const { signal: providedSignal, ...restOptions } = options
  const controller = new AbortController()
  const { signal } = controller

  const timeoutId = setTimeout(() => {
    console.warn(`Fetch request to ${resource} timed out after ${timeout}ms`)
    controller.abort()
  }, timeout)

  if (providedSignal) {
    providedSignal.addEventListener("abort", () => {
      clearTimeout(timeoutId) // Clear our timeout if aborted externally
      controller.abort()
    })
  }

  try {
    const response = await fetch(resource, { ...restOptions, signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      // Log more specific timeout error
      console.error(`Fetch aborted for ${resource}: Timeout or external signal.`, error)
    } else {
      console.error(`Fetch error for ${resource}:`, error)
    }
    throw error
  }
}

// Animation variants for different elements
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 24 
    }
  }
}

const tabContentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 30,
      duration: 0.4
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { 
      duration: 0.2 
    }
  }
}

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
}

// Fallback data that matches the entity structure
const fallbackUserData = {
  users: [
    {
      srNo: 1,
      employeeSerialNumber: "EMP001",
      employeeName: "John Doe",
      emergencyContactNumber: "+1-555-123-4567",
      address: "123 Main Street, Springfield, USA",
      emailAddress: "john.doe@example.com",
      qualification: "Bachelor's in Computer Science",
      dateOfJoining: "2023-01-15",
      designation: "Software Engineer",
      department: "IT",
      reportingOfficer: "Jane Smith",
      grossSalary: 75000,
      bankAccountNumber: "1234567890",
      ifscCode: "HDFC0001234",
      bankName: "HDFC Bank",
      medicalBackground: "No known allergies",
      legalBackground: "Clean record",
      pan: "ABCDE1234F",
      panFile: null,
      adhaar: "123456789012",
      adhaarFile: null,
      personalFileNumber: "PF001",
      passbookFile: null,
      photo: null,
      status: "N",
      bloodGroup: "O+",
      dateOfBirth: "1990-05-15",
      qualificationDocument: null,
      offerLetter: null,
      addressProofFile: null,
      medicalBackgroundDocument: null,
      legalBackgroundDocument: null,
    },
    {
      srNo: 2,
      employeeSerialNumber: "EMP002",
      employeeName: "Jane Smith",
      emergencyContactNumber: "+1-555-987-6543",
      address: "456 Oak Avenue, Springfield, USA",
      emailAddress: "jane.smith@example.com",
      qualification: "Master's in Business Administration",
      dateOfJoining: "2022-03-20",
      designation: "Project Manager",
      department: "Operations",
      reportingOfficer: "Robert Johnson",
      grossSalary: 85000,
      bankAccountNumber: "0987654321",
      ifscCode: "SBIN0001234",
      bankName: "State Bank of India",
      medicalBackground: "Diabetes - Type 2",
      legalBackground: "Clean record",
      pan: "FGHIJ5678K",
      panFile: null,
      adhaar: "210987654321",
      adhaarFile: null,
      personalFileNumber: "PF002",
      passbookFile: null,
      photo: null,
      status: "Y",
      bloodGroup: "A+",
      dateOfBirth: "1988-11-22",
      qualificationDocument: null,
      offerLetter: null,
      addressProofFile: null,
      medicalBackgroundDocument: null,
      legalBackgroundDocument: null,
    },
  ],
}

function formatDate(dateString) {
  if (!dateString) return "Not specified"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function UserInfo() {
    const navigate = useNavigate();

  const { employeeId } = useParams()
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [formData, setFormData] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [blobUrls, setBlobUrls] = useState({})

  // Clean up blob URLs when component unmounts
  useEffect(() => {
    return () => {
      Object.values(blobUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [blobUrls]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)

        // Use fetchWithTimeout with a 10-second timeout
        const response = await fetchWithTimeout(
          "http://localhost:8080/api/user-profiles/all",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          },
          10000,
        ) // 10 seconds timeout

        if (!response.ok) {
          const errorData = await response.text().catch(() => "Could not read error response body")
          console.error(`API responded with ${response.status}: ${errorData}`)
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`)
        }

        const data = await response.json()
        console.log("API users data:", data)

        const usersList = Array.isArray(data) ? data : data.data && Array.isArray(data.data) ? data.data : []

        if (usersList.length > 0) {
          const processedUsers = usersList.map((user) => ({
            ...user,
            employeeName: user.employeeName || "",
            employeeSerialNumber: user.employeeSerialNumber || "",
            address: user.address || "",
            emailAddress: user.emailAddress || "",
            emergencyContactNumber: user.emergencyContactNumber || "",
            qualification: user.qualification || "",
            designation: user.designation || "",
            department: user.department || "",
            reportingOfficer: user.reportingOfficer || "",
            grossSalary: user.grossSalary || 0,
            bankAccountNumber: user.bankAccountNumber || "",
            medicalBackground: user.medicalBackground || "",
            legalBackground: user.legalBackground || "",
            pan: user.pan || "",
            panFile: user.panFile || null,
            adhaar: user.adhaar || "",
            adhaarFile: user.adhaarFile || null,
            personalFileNumber: user.personalFileNumber || "",
            passbookFile: user.passbookFile || null,
            status: user.status || "N",
            photo: user.photo || null,
            bloodGroup: user.bloodGroup || "",
            dateOfBirth: user.dateOfBirth || "",
            qualificationDocument: user.qualificationDocument || null,
            offerLetter: user.offerLetter || null,
            addressProofFile: user.addressProofFile || null,
            medicalBackgroundDocument: user.medicalBackground || null,
            legalBackgroundDocument: user.legalBackground || null,
          }))

          setUsers(processedUsers)
          
          // Find the specific employee if employeeId is provided
          if (employeeId) {
            const userIndex = processedUsers.findIndex(user => user.employeeSerialNumber === employeeId)
            if (userIndex !== -1) {
              setCurrentUserIndex(userIndex)
              setFormData(processedUsers[userIndex])
            } else {
              setFormData(processedUsers[0])
            }
          } else {
            setFormData(processedUsers[0])
          }
        } else {
          console.log("API returned no users, using fallback data")
          setUsers(fallbackUserData.users)
          
          // Find the specific employee in fallback data if employeeId is provided
          if (employeeId) {
            const userIndex = fallbackUserData.users.findIndex(user => user.employeeSerialNumber === employeeId)
            if (userIndex !== -1) {
              setCurrentUserIndex(userIndex)
              setFormData(fallbackUserData.users[userIndex])
            } else {
              setFormData(fallbackUserData.users[0])
            }
          } else {
            setFormData(fallbackUserData.users[0])
          }
        }
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err.message)
        setUsers(fallbackUserData.users);
        
        // Find the specific employee in fallback data if employeeId is provided
        if (employeeId) {
          const userIndex = fallbackUserData.users.findIndex(user => user.employeeSerialNumber === employeeId)
          if (userIndex !== -1) {
            setCurrentUserIndex(userIndex)
            setFormData(fallbackUserData.users[userIndex])
          } else {
            setFormData(fallbackUserData.users[0])
          }
        } else {
          setFormData(fallbackUserData.users[0])
        }

        toast.error(`Backend server not available. Using demo data.`, {
          position: "top-right",
          autoClose: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [employeeId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  // Handle file uploads
  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result;
      setFormData(prev => ({
        ...prev,
        [fieldName]: base64Data
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const userId = formData.srNo

      const userData = {
        ...formData,
      }

      console.log("Updating user data for ID:", userId)
      console.log("Update payload:", JSON.stringify(userData))

      const response = await fetch(`http://localhost:8080/api/user-profiles/update/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const responseData = await response.json()
      console.log("API response:", responseData)

      const updatedUsers = [...users]
      updatedUsers[currentUserIndex] = formData
      setUsers(updatedUsers)

      toast.success("Profile updated successfully!", {
        position: "top-right",
        autoClose: 3000,
      })
    } catch (error) {
      console.error("Error updating user:", error)

      toast.error(`Failed to update user: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      })

      const updatedUsers = [...users]
      updatedUsers[currentUserIndex] = formData
      setUsers(updatedUsers)
    }

    setIsEditing(false)
  }

  const handleUserChange = (direction) => {
    let newIndex
    if (direction === "next") {
      newIndex = (currentUserIndex + 1) % users.length
    } else {
      newIndex = currentUserIndex - 1
      if (newIndex < 0) newIndex = users.length - 1
    }
    setCurrentUserIndex(newIndex)
    setFormData(users[newIndex])
    setIsEditing(false)
  }

  const handleAddUser = () => {
    setShowModal(true)
  }

  const handleUserAdded = (newUser) => {
    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    setCurrentUserIndex(updatedUsers.length - 1)
    setFormData(newUser)
  }

  const handleDownloadUsers = () => {
    const excelData = users.map((user) => ({
      "Sr. No.": user.srNo,
      "Employee Serial Number": user.employeeSerialNumber,
      "Employee Name": user.employeeName,
      "Emergency Contact": user.emergencyContactNumber,
      "Email Address": user.emailAddress,
      Address: user.address,
      Qualification: user.qualification,
      "Date of Joining": user.dateOfJoining,
      Designation: user.designation,
      Department: user.department,
      "Reporting Officer": user.reportingOfficer,
      "Gross Salary": user.grossSalary,
      "Bank Account Number": user.bankAccountNumber,
      "IFSC Code": user.ifscCode,
      "Bank Name": user.bankName,
      PAN: user.pan,
      Aadhaar: user.adhaar,
      "Personal File Number": user.personalFileNumber,
      Status: user.status === "Y" ? "Onboarded" : "Onboarding Pending",
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    XLSX.utils.book_append_sheet(workbook, worksheet, "Users")
    XLSX.writeFile(workbook, "user_profiles.xlsx")

    toast.success("Users data downloaded successfully!", {
      position: "top-right",
      autoClose: 3000,
    })
  }

  const getStatusDisplay = (status) => {
    if (status === "Y") {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Onboarded</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Onboarding Pending</span>
    }
  }

  const truncateString = (str, maxLength = 30) => {
    if (!str || typeof str !== "string") return "Not specified"
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str
  }

  // Render file icon based on detected type
  const renderFileIcon = (fileData) => {
    const fileType = detectFileType(fileData);
    
    if (fileType === 'pdf') {
      return <FaFilePdf className="h-5 w-5 text-red-500" />;
    }
    
    if (fileType === 'jpeg' || fileType === 'png' || fileType === 'image') {
      return <FaFileImage className="h-5 w-5 text-blue-500" />;
    }
    
    return <FaFileAlt className="h-5 w-5 text-indigo-500" />;
  };

  // Get content type for blob creation
  const getContentType = (fileData) => {
    if (!fileData) return 'application/octet-stream';
    
    if (typeof fileData === 'string' && fileData.startsWith('data:')) {
      return fileData.split(';')[0].split(':')[1];
    }
    
    const fileType = detectFileType(fileData);
    
    switch (fileType) {
      case 'pdf': return 'application/pdf';
      case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      default: return 'application/octet-stream';
    }
  };

  // Get blob URL for a file field
  const getBlobUrl = (fieldName) => {
    if (!formData[fieldName]) return null;
    
    // Use cached URL if available
    if (blobUrls[fieldName]) return blobUrls[fieldName];
    
    const contentType = getContentType(formData[fieldName]);
    const url = createBlobUrl(formData[fieldName], contentType);
    
    if (url) {
      setBlobUrls(prev => ({ ...prev, [fieldName]: url }));
    }
    
    return url;
  };

  // Get photo URL
  const getPhotoUrl = () => {
    if (!formData.photo) return null;
    
    // Use cached URL if available
    if (blobUrls.photo) return blobUrls.photo;
    
    const url = createBlobUrl(formData.photo, 'image/jpeg');
    
    if (url) {
      setBlobUrls(prev => ({ ...prev, photo: url }));
      return url;
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <motion.div 
          className="rounded-full h-12 w-12 border-b-2 border-indigo-500"
          animate={{ 
            rotate: 360 
          }}
          transition={{ 
            duration: 1, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        />
      </div>
    )
  }

  const safeFormData = {
    srNo: "",
    employeeSerialNumber: "",
    employeeName: "",
    emergencyContactNumber: "",
    address: "",
    emailAddress: "",
    qualification: "",
    dateOfJoining: "",
    designation: "",
    department: "",
    reportingOfficer: "",
    grossSalary: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",
    medicalBackground: "",
    legalBackground: "",
    pan: "",
    panFile: null,
    adhaar: "",
    adhaarFile: null,
    personalFileNumber: "",
    passbookFile: null,
    status: "N",
    photo: null,
    bloodGroup: "",
    dateOfBirth: "",
    qualificationDocument: null,
    offerLetter: null,
    addressProofFile: null,
    medicalBackgroundDocument: null,
    legalBackgroundDocument: null,
    ...formData,
  }

  // Get photo URL
  const photoUrl = getPhotoUrl();

  return (
     

    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="animate-fade-in"
    >
      <ToastContainer />
      <motion.div 
        variants={itemVariants}
        className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <motion.button
        onClick={() => navigate(-1)} // Go back to previous page
        className="mb-4 flex items-center text-indigo-600 hover:text-indigo-800"
      >
        <FaChevronLeft className="mr-1" />
        Back to Employee Register 
      </motion.button>
        <div className="flex items-center space-x-4">
          <motion.h1 
            variants={itemVariants}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            Employee Information
          </motion.h1>
          <div className="flex items-center space-x-2">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleUserChange("prev")}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Previous user"
            >
              <FaChevronLeft className="h-4 w-4" />
            </motion.button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              User {currentUserIndex + 1} of {users.length}
            </span>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => handleUserChange("next")}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              title="Next user"
            >
              <FaChevronRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* */}
          
          {isEditing ? (
            <div className="space-x-2">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleSubmit}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <FaSave className="mr-2 inline h-4 w-4" />
                Save Changes
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setIsEditing(false)}
                className="rounded-full bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                <FaTimes className="mr-2 inline h-4 w-4" />
                Cancel
              </motion.button>
            </div>
          ) : (
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              onClick={() => setIsEditing(true)}
              className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Profile
            </motion.button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Note:</strong> Backend server is not available. Using demo data for demonstration.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        variants={containerVariants}
        className="grid gap-6 lg:grid-cols-3"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 col-span-1 flex flex-col items-center text-center"
          whileHover={{ 
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 overflow-hidden">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={safeFormData.employeeName}
                className="h-full w-full object-cover"
              />
            ) : safeFormData.photo ? (
              // Fallback for raw base64 photo data
              <img
                src={`data:image/jpeg;base64,${safeFormData.photo}`}
                alt={safeFormData.employeeName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-3xl font-semibold">
                {safeFormData.employeeName ? safeFormData.employeeName.charAt(0) : "U"}
              </span>
            )}
          </div>
          <motion.h3 
            variants={itemVariants}
            className="mb-1 text-xl font-bold text-gray-900 dark:text-white"
          >
            {safeFormData.employeeName || "Unknown User"}
          </motion.h3>

          <motion.div 
            variants={itemVariants}
            className="mb-4 flex items-center"
          >
            <p className="mr-1">status:</p>
            {getStatusDisplay(safeFormData.status)}
          </motion.div>

          <motion.div 
            variants={containerVariants}
            className="mt-4 flex w-full flex-col space-y-2 px-2"
          >
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaEnvelope className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {safeFormData.emailAddress || "No email"}
              </span>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaIdCard className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                ID: {safeFormData.employeeSerialNumber || "N/A"}
              </span>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaCalendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Joined: {formatDate(safeFormData.dateOfJoining)}
              </span>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaPhone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {safeFormData.emergencyContactNumber || "No contact"}
              </span>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaBuilding className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {safeFormData.department || "No department"}
              </span>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaUserTie className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {safeFormData.designation || "No designation"}
              </span>
            </motion.div>
            <motion.div 
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaMapMarkerAlt className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{truncateString(safeFormData.address)}</span>
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="bg-white dark:bg-gray-800 rounded-lg shadow col-span-1 lg:col-span-2"
          whileHover={{ 
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" 
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="border-b border-gray-200 dark:border-gray-700">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center" role="tablist">
              <li className="mr-2" role="presentation">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "personal"
                      ? "text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("personal")}
                  role="tab"
                >
                  Personal Information
                </motion.button>
              </li>
              <li className="mr-2" role="presentation">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "employment"
                      ? "text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("employment")}
                  role="tab"
                >
                  Employment Details
                </motion.button>
              </li>
              <li className="mr-2" role="presentation">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "documents"
                      ? "text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("documents")}
                  role="tab"
                >
                  Documents & Background
                </motion.button>
              </li>
              <li role="presentation">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 1 }}
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${
                    activeTab === "history"
                      ? "text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
                      : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("history")}
                  role="tab"
                >
                  <FaHistory className="inline mr-1" />
                 Employee History
                </motion.button>
              </li>
            </ul>
          </div>
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "personal" && (
                <motion.div 
                  key="personal"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 mb-6 md:grid-cols-2">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="employeeSerialNumber"
                        >
                          Employee Serial Number
                        </label>
                        <input
                          type="text"
                          id="employeeSerialNumber"
                          name="employeeSerialNumber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.employeeSerialNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="employeeName"
                        >
                          Employee Name
                        </label>
                        <input
                          type="text"
                          id="employeeName"
                          name="employeeName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.employeeName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="emailAddress"
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="emailAddress"
                          name="emailAddress"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.emailAddress}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="emergencyContactNumber"
                        >
                          Emergency Contact Number
                        </label>
                        <input
                          type="tel"
                          id="emergencyContactNumber"
                          name="emergencyContactNumber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.emergencyContactNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="dateOfBirth"
                        >
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          name="dateOfBirth"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.dateOfBirth}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="bloodGroup"
                        >
                          Blood Group
                        </label>
                        <select
                          id="bloodGroup"
                          name="bloodGroup"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.bloodGroup}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select Blood Group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="address"
                        >
                          Address
                        </label>
                        <textarea
                          id="address"
                          name="address"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        ></textarea>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="qualification"
                        >
                          Qualification
                        </label>
                        <input
                          type="text"
                          id="qualification"
                          name="qualification"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.qualification}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "employment" && (
                <motion.div 
                  key="employment"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 mb-6 md:grid-cols-2">
                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="dateOfJoining"
                        >
                          Date of Joining
                        </label>
                        <input
                          type="date"
                          id="dateOfJoining"
                          name="dateOfJoining"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.dateOfJoining}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="designation"
                        >
                          Designation
                        </label>
                        <input
                          type="text"
                          id="designation"
                          name="designation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.designation}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="department"
                        >
                          Department
                        </label>
                        <input
                          type="text"
                          id="department"
                          name="department"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.department}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="reportingOfficer"
                        >
                          Reporting Officer
                        </label>
                        <input
                          type="text"
                          id="reportingOfficer"
                          name="reportingOfficer"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.reportingOfficer}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="grossSalary"
                        >
                          Gross Salary
                        </label>
                        <input
                          type="number"
                          id="grossSalary"
                          name="grossSalary"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.grossSalary}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="bankAccountNumber"
                        >
                          Bank Account Number
                        </label>
                        <input
                          type="text"
                          id="bankAccountNumber"
                          name="bankAccountNumber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.bankAccountNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="ifscCode"
                        >
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          id="ifscCode"
                          name="ifscCode"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.ifscCode || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          maxLength="11"
                          style={{ textTransform: "uppercase" }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="bankName"
                        >
                          Bank Name
                        </label>
                        <select
                          id="bankName"
                          name="bankName"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.bankName || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select Bank</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="State Bank of India">State Bank of India</option>
                          <option value="Punjab National Bank">Punjab National Bank</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="personalFileNumber"
                        >
                          Personal File Number
                        </label>
                        <input
                          type="text"
                          id="personalFileNumber"
                          name="personalFileNumber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.personalFileNumber}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "documents" && (
                <motion.div 
                  key="documents"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="space-y-6"
                >
                  <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 mb-6 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="pan">
                          PAN
                        </label>
                        <input
                          type="text"
                          id="pan"
                          name="pan"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.pan}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          maxLength="10"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="adhaar"
                        >
                          Aadhaar
                        </label>
                        <input
                          type="text"
                          id="adhaar"
                          name="adhaar"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.adhaar}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          maxLength="12"
                        />
                      </div>

                      {/* Document Preview Section */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Documents Preview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {/* PAN Document */}
                          {safeFormData.panFile && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">PAN Document</span>
                                {renderFileIcon(safeFormData.panFile)}
                              </div>
                              <a
                                href={getBlobUrl('panFile')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Aadhaar Document */}
                          {safeFormData.adhaarFile && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Aadhaar Document</span>
                                {renderFileIcon(safeFormData.adhaarFile)}
                              </div>
                              <a
                                href={getBlobUrl('adhaarFile')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Passbook Document */}
                          {safeFormData.passbookFile && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.3 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Passbook Document</span>
                                {renderFileIcon(safeFormData.passbookFile)}
                              </div>
                              <a
                                href={getBlobUrl('passbookFile')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Qualification Document */}
                          {safeFormData.qualificationDocument && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Qualification Document</span>
                                {renderFileIcon(safeFormData.qualificationDocument)}
                              </div>
                              <a
                                href={getBlobUrl('qualificationDocument')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Offer Letter Document */}
                          {safeFormData.offerLetter && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Offer Letter</span>
                                {renderFileIcon(safeFormData.offerLetter)}
                              </div>
                              <a
                                href={getBlobUrl('offerLetter')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Address Proof Document */}
                          {safeFormData.addressProofFile && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Address Proof</span>
                                {renderFileIcon(safeFormData.addressProofFile)}
                              </div>
                              <a
                                href={getBlobUrl('addressProofFile')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Medical Background Document */}
                          {safeFormData.medicalBackgroundDocument && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Medical Background</span>
                                {renderFileIcon(safeFormData.medicalBackgroundDocument)}
                              </div>
                              <a
                                href={getBlobUrl('medicalBackgroundDocument')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}

                          {/* Legal Background Document */}
                          {safeFormData.legalBackgroundDocument && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.8 }}
                              className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-700"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Legal Background</span>
                                {renderFileIcon(safeFormData.legalBackgroundDocument)}
                              </div>
                              <a
                                href={getBlobUrl('legalBackgroundDocument')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800 block mt-2"
                              >
                                View Document
                              </a>
                            </motion.div>
                          )}
                        </div>
                      </div>

                      {/* File Upload Section */}
                      <div className="md:col-span-2">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Upload Documents</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* PAN Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="panFile">
                              PAN Document
                            </label>
                            <input
                              type="file"
                              id="panFile"
                              name="panFile"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "panFile")}
                              disabled={!isEditing}
                            />
                            {safeFormData.panFile && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>

                          {/* Aadhaar Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="adhaarFile">
                              Aadhaar Document
                            </label>
                            <input
                              type="file"
                              id="adhaarFile"
                              name="adhaarFile"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "adhaarFile")}
                              disabled={!isEditing}
                            />
                            {safeFormData.adhaarFile && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>

                          {/* Passbook Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="passbookFile">
                              Passbook Document
                            </label>
                            <input
                              type="file"
                              id="passbookFile"
                              name="passbookFile"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "passbookFile")}
                              disabled={!isEditing}
                            />
                            {safeFormData.passbookFile && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>

                          {/* Qualification Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="qualificationDocument">
                              Qualification Document
                            </label>
                            <input
                              type="file"
                              id="qualificationDocument"
                              name="qualificationDocument"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "qualificationDocument")}
                              disabled={!isEditing}
                            />
                            {safeFormData.qualificationDocument && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>

                          {/* Offer Letter Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="offerLetter">
                              Offer Letter Document
                            </label>
                            <input
                              type="file"
                              id="offerLetter"
                              name="offerLetter"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "offerLetter")}
                              disabled={!isEditing}
                            />
                            {safeFormData.offerLetter && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>

                          {/* Address Proof Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="addressProofFile">
                              Address Proof Document
                            </label>
                            <input
                              type="file"
                              id="addressProofFile"
                              name="addressProofFile"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "addressProofFile")}
                              disabled={!isEditing}
                            />
                            {safeFormData.addressProofFile && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>
                          
                          {/* Medical Background Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="medicalBackgroundDocument">
                              Medical Background Document
                            </label>
                            <input
                              type="file"
                              id="medicalBackgroundDocument"
                              name="medicalBackgroundDocument"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "medicalBackgroundDocument")}
                              disabled={!isEditing}
                            />
                            {safeFormData.medicalBackgroundDocument && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>

                          {/* Legal Background Document */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="legalBackgroundDocument">
                              Legal Background Document
                            </label>
                            <input
                              type="file"
                              id="legalBackgroundDocument"
                              name="legalBackgroundDocument"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                              onChange={(e) => handleFileChange(e, "legalBackgroundDocument")}
                              disabled={!isEditing}
                            />
                            {safeFormData.legalBackgroundDocument && (
                              <div className="text-xs text-green-600">
                                Document uploaded successfully
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div 
                  key="history"
                  variants={tabContentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col items-center justify-center h-64"
                >
                  <FaHistory className="text-gray-400 text-5xl mb-4" />
                  <p className="text-gray-500 text-lg">Records yet to arrive</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

export default UserInfo