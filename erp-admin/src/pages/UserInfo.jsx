"use client"

import { useState, useEffect, Suspense, lazy } from "react"
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
  FaCheckCircle,
  FaTimesCircle,
  FaUserCheck, // For Employment Status
} from "react-icons/fa"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import * as XLSX from "xlsx"

// Regex Constants
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const AADHAAR_REGEX = /^[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/;

// Lazy load the AddUserModal component
const AddUserModal = lazy(() => import("../modals/add-user-modal"))

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
const PREDEFINED_BANK_NAMES = ["HDFC Bank", "State Bank of India", "Punjab National Bank", "ICICI Bank"];
const EMPLOYMENT_STATUS_OPTIONS = ["Active", "Absconded", "Resigned", "Terminated", "Others"];
// PREDEFINED_DEPARTMENTS and PREDEFINED_DESIGNATIONS are already defined below, closer to UserInfo component.

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
      qualificationDocument: null,
      offerLetterDocument: null,
      addressProofDocument: null,
      medicalBackgroundDocument: null,
      legalBackgroundDocument: null,
      status: "N", // This seems to be approval status, not employment status
      employmentStatus: "Active",
      reasonForDiscontinuity: "",
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
      designation: "Chief Happiness Officer",
      department: "Operations",
      reportingOfficer: "Robert Johnson",
      grossSalary: 85000,
      bankAccountNumber: "0987654321",
      ifscCode: "SBIN0001234",
      bankName: "Custom Bank of Springfield",
      medicalBackground: "Diabetes - Type 2",
      legalBackground: "Clean record",
      pan: "FGHIJ5678K",
      panFile: null,
      adhaar: "210987654321",
      adhaarFile: null,
      personalFileNumber: "PF002",
      passbookFile: null,
      photo: null,
      qualificationDocument: null,
      offerLetterDocument: null,
      addressProofDocument: null,
      medicalBackgroundDocument: null,
      legalBackgroundDocument: null,
      status: "Y", // Approval status
      employmentStatus: "Resigned",
      reasonForDiscontinuity: "Moving to another city.",
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

// PREDEFINED_DEPARTMENTS and PREDEFINED_DESIGNATIONS are correctly defined here.
// PREDEFINED_BANK_NAMES was added above fallbackUserData for clarity.

// Helper function to process user data for "Others" select logic
const processUserDataForSelects = (user) => {
  if (!user) return {}; // Handle null or undefined user

  const isOtherBank = user.bankName && !PREDEFINED_BANK_NAMES.includes(user.bankName);
  const isOtherDept = user.department && !PREDEFINED_DEPARTMENTS.includes(user.department);
  const isOtherDesg = user.designation && !PREDEFINED_DESIGNATIONS.includes(user.designation);
  // For employmentStatus, if it's not in the main list (excluding "Others"), treat it as "Others"
  // and move the original value to reasonForDiscontinuity if reason is empty.
  let currentEmploymentStatus = user.employmentStatus;
  let currentReasonForDiscontinuity = user.reasonForDiscontinuity || "";

  if (user.employmentStatus && !EMPLOYMENT_STATUS_OPTIONS.includes(user.employmentStatus)) {
    currentEmploymentStatus = "Others";
    // If reason is empty or was just the status itself, use the original status as reason.
    if (!currentReasonForDiscontinuity || currentReasonForDiscontinuity === user.employmentStatus) {
      currentReasonForDiscontinuity = user.employmentStatus;
    }
  }


  return {
    ...user,
    otherBankName: isOtherBank ? user.bankName : "",
    bankName: isOtherBank ? "Others" : user.bankName,
    otherDepartment: isOtherDept ? user.department : "",
    department: isOtherDept ? "Others" : user.department,
    otherDesignation: isOtherDesg ? user.designation : "",
    designation: isOtherDesg ? "Others" : user.designation,
    employmentStatus: currentEmploymentStatus,
    reasonForDiscontinuity: currentReasonForDiscontinuity,
    bankAccountNumberConfirmation: user.bankAccountNumberConfirmation || "",
    ifscCodeConfirmation: user.ifscCodeConfirmation || "",
  };
};

function UserInfo() {
  const [activeTab, setActiveTab] = useState("personal")
  const [isEditing, setIsEditing] = useState(false)
  const [currentUserIndex, setCurrentUserIndex] = useState(0)
  const [formData, setFormData] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [panError, setPanError] = useState("")
  const [aadhaarError, setAadhaarError] = useState("")

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
              // Add Authorization header if your API requires it
              // "Authorization": `Bearer ${token}`,
            },
          },
          10000,
        ) // 10 seconds timeout

        if (!response.ok) {
          // Handle non-OK responses even after a successful fetch (e.g., 404, 500)
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
            bankAccountNumberConfirmation: "",
            ifscCodeConfirmation: "",
            // otherBankName, otherDepartment, otherDesignation will be set by processUserDataForSelects
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
            qualificationDocument: user.qualificationDocument || null,
            offerLetterDocument: user.offerLetterDocument || null,
            addressProofDocument: user.addressProofDocument || null,
            medicalBackgroundDocument: user.medicalBackgroundDocument || null,
            legalBackgroundDocument: user.legalBackgroundDocument || null,
          }))

          // Initial mapping to ensure all fields from API are present before processing
          const initialProcessedUsers = usersList.map(user => ({
            ...user, // Spread all fields from API
            // Initialize fields that might be missing for the new 'employmentStatus' feature
            employmentStatus: user.employmentStatus || "Active", // Default to "Active" if not present
            reasonForDiscontinuity: user.reasonForDiscontinuity || "",
            bankAccountNumberConfirmation: user.bankAccountNumberConfirmation || "",
            ifscCodeConfirmation: user.ifscCodeConfirmation || "",
            otherBankName: user.otherBankName || "",
            otherDepartment: user.otherDepartment || "",
            otherDesignation: user.otherDesignation || "",
          }));

          const usersWithCorrectedSelects = initialProcessedUsers.map(processUserDataForSelects);
          setUsers(usersWithCorrectedSelects);

          if (usersWithCorrectedSelects.length > 0) {
            setFormData(usersWithCorrectedSelects[0]);
          } else {
            setFormData(processUserDataForSelects({
              bankName: "", department: "", designation: "", employmentStatus: "Active", reasonForDiscontinuity: "",
            }));
          }

        } else {
          console.log("API returned no users, using fallback data")
          const fallbackUsersProcessed = fallbackUserData.users.map(processUserDataForSelects);
          setUsers(fallbackUsersProcessed);
          setFormData(fallbackUsersProcessed.length > 0 ? fallbackUsersProcessed[0] : processUserDataForSelects({employmentStatus: "Active"}));
        }
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err.message)
        const fallbackUsersProcessed = fallbackUserData.users.map(processUserDataForSelects);
        setUsers(fallbackUsersProcessed);
        setFormData(fallbackUsersProcessed.length > 0 ? fallbackUsersProcessed[0] : processUserDataForSelects({employmentStatus: "Active"}));

        toast.error(`Backend server not available. Using demo data.`, {
          position: "top-right",
          autoClose: 5000,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const handleInputChange = (e) => {
    let { name, value } = e.target;

    // Uppercase PAN input immediately
    if (name === "pan") {
      value = value.toUpperCase();
    }

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "bankName" && value !== "Others" && { otherBankName: "" }),
        ...(name === "department" && value !== "Others" && { otherDepartment: "" }),
        ...(name === "designation" && value !== "Others" && { otherDesignation: "" }),
      }));
    }

    // Perform validation after state update or based on new value
    if (name === "pan") {
      if (value && !PAN_REGEX.test(value)) {
        setPanError("Invalid PAN format. Should be ABCDE1234F.");
      } else {
        setPanError("");
      }
    } else if (name === "adhaar") {
      if (value && !AADHAAR_REGEX.test(value)) {
        setAadhaarError("Invalid Aadhaar format. Should be a 12-digit number (e.g., 1234 5678 9012).");
      } else {
        setAadhaarError("");
      }
    }

    // Additional logic specific to employmentStatus
    if (name === "employmentStatus") {
      if (value === "Active" || value === "") {
        // Clear reasonForDiscontinuity if status is Active or "Select Status"
        setFormData(prev => ({ ...prev, reasonForDiscontinuity: "" }));
      }
    }
  };

  const handleFileChange = (e, documentType) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        // The result contains the data as a URL representing the file's data as a base64 encoded string.
        // We need to extract the base64 part from "data:mime/type;base64,BASE64_STRING"
        const base64String = reader.result.split(",")[1]
        setFormData((prev) => ({
          ...prev,
          [documentType]: base64String,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      // Bank Account Confirmation
      if (formData.bankAccountNumber && formData.bankAccountNumber !== formData.bankAccountNumberConfirmation) {
        toast.error("Bank account numbers do not match. Please correct before saving.", { position: "top-right", autoClose: 5000 });
        return;
      }
      // IFSC Code Confirmation
      if (formData.ifscCode && formData.ifscCode !== formData.ifscCodeConfirmation) {
        toast.error("IFSC codes do not match. Please correct before saving.", { position: "top-right", autoClose: 5000 });
        return;
      }

      // PAN Validation
      if (panError) { // Check error state first
        toast.error("Invalid PAN number. Please correct before saving.", { position: "top-right", autoClose: 5000 });
        return;
      }
      if (formData.pan && !PAN_REGEX.test(formData.pan)) { // Double check value
        setPanError("Invalid PAN format. Should be ABCDE1234F.");
        toast.error("Invalid PAN number. Please correct before saving.", { position: "top-right", autoClose: 5000 });
        return;
      }

      // Aadhaar Validation
      if (aadhaarError) { // Check error state first
        toast.error("Invalid Aadhaar number. Please correct before saving.", { position: "top-right", autoClose: 5000 });
        return;
      }
      const aadhaarValue = formData.adhaar || "";
      const aadhaarWithoutSpaces = aadhaarValue.replace(/\s/g, "");
      if (aadhaarValue && (!AADHAAR_REGEX.test(aadhaarValue) || aadhaarWithoutSpaces.length !== 12)) { // Double check value
        setAadhaarError("Invalid Aadhaar format. Should be a 12-digit number.");
        toast.error("Invalid Aadhaar number. Please correct before saving.", { position: "top-right", autoClose: 5000 });
        return;
      }
    }

    try {
      const userId = formData.srNo;
      const userData = { ...formData };

      // Delete UI-only fields
      delete userData.bankAccountNumberConfirmation;
      delete userData.ifscCodeConfirmation;
      delete userData.panError; // Should not be part of formData, but good practice
      delete userData.aadhaarError; // Should not be part of formData

      // Handle "Others" logic for bankName, department, designation
      if (userData.bankName === "Others") {
        userData.bankName = userData.otherBankName || "Not Specified";
      }
      delete userData.otherBankName;

      if (userData.department === "Others") {
        userData.department = userData.otherDepartment || "Not Specified";
      }
      delete userData.otherDepartment;

      if (userData.designation === "Others") {
        userData.designation = userData.otherDesignation || "Not Specified";
      }
      delete userData.otherDesignation;

      // Sanitize Aadhaar: remove spaces
      if (userData.adhaar) {
        userData.adhaar = userData.adhaar.replace(/\s/g, "");
      }

      // Ensure reasonForDiscontinuity is cleared if status is Active
      if (userData.employmentStatus === "Active" || userData.employmentStatus === "") {
        userData.reasonForDiscontinuity = "";
      }

      console.log("Updating user data for ID:", userId);
      console.log("Update payload:", JSON.stringify(userData));

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
    // Reset fields when user changes
    const newUserData = users[newIndex]; // This data is already processed by processUserDataForSelects
    setFormData({
      ...newUserData,
      // Explicitly clear confirmation fields as they are not part of the stored user profile
      bankAccountNumberConfirmation: "",
      ifscCodeConfirmation: "",
    });
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
      "Qualification Document": user.qualificationDocument ? "Present" : "N/A",
      "Offer Letter Document": user.offerLetterDocument ? "Present" : "N/A",
      "Address Proof Document": user.addressProofDocument ? "Present" : "N/A",
      "Medical Background Document": user.medicalBackgroundDocument ? "Present" : "N/A",
      "Legal Background Document": user.legalBackgroundDocument ? "Present" : "N/A",
      "Approval Status": user.status === "Y" ? "Approved" : "Pending", // Renamed for clarity
      "Employment Status": user.employmentStatus || "N/A",
      "Reason for Discontinuity": user.reasonForDiscontinuity || "N/A",
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
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Approved</span>
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Pending</span>
    }
  }

  const truncateString = (str, maxLength = 30) => {
    if (!str || typeof str !== "string") return "Not specified"
    return str.length > maxLength ? str.substring(0, maxLength) + "..." : str
  }

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
    // Ensure all fields used in the form are here with defaults
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
    qualificationDocument: null,
    offerLetterDocument: null,
    addressProofDocument: null,
    medicalBackgroundDocument: null,
    legalBackgroundDocument: null,
    bankAccountNumberConfirmation: "",
    ifscCodeConfirmation: "",
    otherBankName: "",
    otherDepartment: "",
    otherDesignation: "",
    employmentStatus: formData.employmentStatus || "Active", // Default to "Active"
    reasonForDiscontinuity: formData.reasonForDiscontinuity || "",
    ...formData, // Spread formData last to ensure it overrides defaults if present
  }

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
        <div className="flex items-center space-x-4">
          <motion.h1 
            variants={itemVariants}
            className="text-2xl font-bold text-gray-900 dark:text-white"
          >
            User Information
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
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleDownloadUsers}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title="Download Users Data"
          >
            <FaDownload className="mr-2 inline h-4 w-4" />
            Download Users
          </motion.button>
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={handleAddUser}
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            title="Add new user"
          >
            <FaUserPlus className="mr-2 inline h-4 w-4" />
            Add User
          </motion.button>
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

      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50">
            <div className="relative max-h-full w-full max-w-6xl p-4">
              <div className="animate-fade-in-up relative rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <div className="flex items-center justify-center h-64">
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
                  <span className="ml-3 text-gray-600">Loading add user form...</span>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <AddUserModal isOpen={showModal} onClose={() => setShowModal(false)} onUserAdded={handleUserAdded} />
      </Suspense>

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
            {safeFormData.photo ? (
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
            {/* Display Employment Status on User Card */}
            <motion.div
              variants={itemVariants}
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="flex items-center space-x-2 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FaUserCheck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Status: {safeFormData.employmentStatus || "N/A"}
              </span>
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
              <li role="presentation">
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
                        {isEditing && safeFormData.bankAccountNumber && (
                          <div className="mt-2">
                            <label
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                              htmlFor="bankAccountNumberConfirmation"
                            >
                              Confirm Bank Account Number
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="bankAccountNumberConfirmation"
                                name="bankAccountNumberConfirmation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                value={safeFormData.bankAccountNumberConfirmation}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                              />
                              {safeFormData.bankAccountNumberConfirmation && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  {safeFormData.bankAccountNumber === safeFormData.bankAccountNumberConfirmation ? (
                                    <FaCheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <FaTimesCircle className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            {safeFormData.bankAccountNumberConfirmation && safeFormData.bankAccountNumber !== safeFormData.bankAccountNumberConfirmation && (
                              <p className="mt-1 text-xs text-red-600">Bank account numbers do not match.</p>
                            )}
                             {safeFormData.bankAccountNumberConfirmation && safeFormData.bankAccountNumber === safeFormData.bankAccountNumberConfirmation && (
                              <p className="mt-1 text-xs text-green-600">Bank account numbers matched.</p>
                            )}
                          </div>
                        )}
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

                      {/* Employment Status Dropdown */}
                      <div>
                        <label
                          htmlFor="employmentStatus"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                        >
                          Employment Status
                        </label>
                        <select
                          id="employmentStatus"
                          name="employmentStatus"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.employmentStatus || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select Status</option>
                          {EMPLOYMENT_STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>

                      {/* Reason for Discontinuity Text Area */}
                      {/* Visible if isEditing AND status is Absconded, Resigned, Terminated, or Others */}
                      {isEditing &&
                       safeFormData.employmentStatus &&
                       !["Active", ""].includes(safeFormData.employmentStatus) && (
                        <div className="md:col-span-2">
                          <label
                            htmlFor="reasonForDiscontinuity"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          >
                            Reason for Discontinuity
                          </label>
                          <textarea
                            id="reasonForDiscontinuity"
                            name="reasonForDiscontinuity"
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                            value={safeFormData.reasonForDiscontinuity}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder={safeFormData.employmentStatus === "Others" ? "Please specify reason/status" : "Reason"}
                          />
                        </div>
                      )}
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
                        <select
                          id="designation"
                          name="designation"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.designation || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select Designation</option>
                          {PREDEFINED_DESIGNATIONS.map(desg => <option key={desg} value={desg}>{desg}</option>)}
                          <option value="Others">Others</option>
                        </select>
                        {isEditing && safeFormData.designation === "Others" && (
                          <div className="mt-2">
                            <label htmlFor="otherDesignation" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Please specify other designation
                            </label>
                            <textarea
                              id="otherDesignation"
                              name="otherDesignation"
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                              value={safeFormData.otherDesignation}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="department"
                        >
                          Department
                        </label>
                        <select
                          id="department"
                          name="department"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.department || ""}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="">Select Department</option>
                          {PREDEFINED_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                          <option value="Others">Others</option>
                        </select>
                        {isEditing && safeFormData.department === "Others" && (
                          <div className="mt-2">
                            <label htmlFor="otherDepartment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Please specify other department
                            </label>
                            <textarea
                              id="otherDepartment"
                              name="otherDepartment"
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                              value={safeFormData.otherDepartment}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                            />
                          </div>
                        )}
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
                        {isEditing && safeFormData.ifscCode && (
                          <div className="mt-2">
                            <label
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                              htmlFor="ifscCodeConfirmation"
                            >
                              Confirm IFSC Code
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                id="ifscCodeConfirmation"
                                name="ifscCodeConfirmation"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                                value={safeFormData.ifscCodeConfirmation}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                maxLength="11"
                                style={{ textTransform: "uppercase" }}
                              />
                              {safeFormData.ifscCodeConfirmation && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                  {safeFormData.ifscCode === safeFormData.ifscCodeConfirmation ? (
                                    <FaCheckCircle className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <FaTimesCircle className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            {safeFormData.ifscCodeConfirmation && safeFormData.ifscCode !== safeFormData.ifscCodeConfirmation && (
                              <p className="mt-1 text-xs text-red-600">IFSC codes do not match.</p>
                            )}
                            {safeFormData.ifscCodeConfirmation && safeFormData.ifscCode === safeFormData.ifscCodeConfirmation && (
                               <p className="mt-1 text-xs text-green-600">IFSC codes matched.</p>
                            )}
                          </div>
                        )}
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
                          <option value="Others">Others</option>
                        </select>
                        {isEditing && safeFormData.bankName === "Others" && (
                          <div className="mt-2">
                            <label
                              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                              htmlFor="otherBankName"
                            >
                              Please specify other bank name
                            </label>
                            <textarea
                              id="otherBankName"
                              name="otherBankName"
                              rows="2"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                              value={safeFormData.otherBankName}
                              onChange={handleInputChange}
                              disabled={!isEditing}
                            ></textarea>
                          </div>
                        )}
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
                          style={{ textTransform: "uppercase" }}
                        />
                        {panError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{panError}</p>}
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
                          // maxLength removed to allow spaces, regex will validate format
                        />
                        {aadhaarError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{aadhaarError}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="medicalBackground"
                        >
                          Medical Background
                        </label>
                        <textarea
                          id="medicalBackground"
                          name="medicalBackground"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.medicalBackground}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        ></textarea>
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                          htmlFor="legalBackground"
                        >
                          Legal Background
                        </label>
                        <textarea
                          id="legalBackground"
                          name="legalBackground"
                          rows="3"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                          value={safeFormData.legalBackground}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        ></textarea>
                      </div>

                      {safeFormData.panFile && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            PAN Document
                          </label>
                          <div className="flex items-center space-x-2 mt-2">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600">PAN Document</span>
                            <a
                              href={safeFormData.panFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        </motion.div>
                      )}

                      {safeFormData.adhaarFile && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Aadhaar Document
                          </label>
                          <div className="flex items-center space-x-2 mt-2">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600">Aadhaar Document</span>
                            <a
                              href={safeFormData.adhaarFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        </motion.div>
                      )}

                      {safeFormData.passbookFile && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                        >
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Passbook Document
                          </label>
                          <div className="flex items-center space-x-2 mt-2">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600">Bank Passbook</span>
                            <a
                              href={safeFormData.passbookFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        </motion.div>
                      )}

                      {/* Qualification Document */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="qualificationDocument">
                          Qualification Document
                        </label>
                        {isEditing && (
                          <input
                            type="file"
                            id="qualificationDocument"
                            name="qualificationDocument"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                            onChange={(e) => handleFileChange(e, "qualificationDocument")}
                            disabled={!isEditing}
                          />
                        )}
                        {safeFormData.qualificationDocument && (
                          <div className="flex items-center space-x-2 mt-1">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {typeof safeFormData.qualificationDocument === 'string' && safeFormData.qualificationDocument.length > 30 ? 'Qualification Doc Uploaded' : safeFormData.qualificationDocument || 'No file'}
                            </span>
                            <a
                              href={`data:application/octet-stream;base64,${safeFormData.qualificationDocument}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Offer Letter Document */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="offerLetterDocument">
                          Offer Letter Document
                        </label>
                        {isEditing && (
                          <input
                            type="file"
                            id="offerLetterDocument"
                            name="offerLetterDocument"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                            onChange={(e) => handleFileChange(e, "offerLetterDocument")}
                            disabled={!isEditing}
                          />
                        )}
                        {safeFormData.offerLetterDocument && (
                          <div className="flex items-center space-x-2 mt-1">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                             {typeof safeFormData.offerLetterDocument === 'string' && safeFormData.offerLetterDocument.length > 30 ? 'Offer Letter Uploaded' : safeFormData.offerLetterDocument || 'No file'}
                            </span>
                            <a
                              href={`data:application/octet-stream;base64,${safeFormData.offerLetterDocument}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Address Proof Document */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="addressProofDocument">
                          Address Proof Document
                        </label>
                        {isEditing && (
                          <input
                            type="file"
                            id="addressProofDocument"
                            name="addressProofDocument"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                            onChange={(e) => handleFileChange(e, "addressProofDocument")}
                            disabled={!isEditing}
                          />
                        )}
                        {safeFormData.addressProofDocument && (
                          <div className="flex items-center space-x-2 mt-1">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {typeof safeFormData.addressProofDocument === 'string' && safeFormData.addressProofDocument.length > 30 ? 'Address Proof Uploaded' : safeFormData.addressProofDocument || 'No file'}
                            </span>
                            <a
                              href={`data:application/octet-stream;base64,${safeFormData.addressProofDocument}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Medical Background Document */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="medicalBackgroundDocument">
                          Medical Background Document
                        </label>
                        {isEditing && (
                          <input
                            type="file"
                            id="medicalBackgroundDocument"
                            name="medicalBackgroundDocument"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                            onChange={(e) => handleFileChange(e, "medicalBackgroundDocument")}
                            disabled={!isEditing}
                          />
                        )}
                        {safeFormData.medicalBackgroundDocument && (
                          <div className="flex items-center space-x-2 mt-1">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {typeof safeFormData.medicalBackgroundDocument === 'string' && safeFormData.medicalBackgroundDocument.length > 30 ? 'Medical Doc Uploaded' : safeFormData.medicalBackgroundDocument || 'No file'}
                            </span>
                            <a
                              href={`data:application/octet-stream;base64,${safeFormData.medicalBackgroundDocument}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Legal Background Document */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="legalBackgroundDocument">
                          Legal Background Document
                        </label>
                        {isEditing && (
                          <input
                            type="file"
                            id="legalBackgroundDocument"
                            name="legalBackgroundDocument"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 mb-2"
                            onChange={(e) => handleFileChange(e, "legalBackgroundDocument")}
                            disabled={!isEditing}
                          />
                        )}
                        {safeFormData.legalBackgroundDocument && (
                          <div className="flex items-center space-x-2 mt-1">
                            <FaFileAlt className="h-5 w-5 text-indigo-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {typeof safeFormData.legalBackgroundDocument === 'string' && safeFormData.legalBackgroundDocument.length > 30 ? 'Legal Doc Uploaded' : safeFormData.legalBackgroundDocument || 'No file'}
                            </span>
                            <a
                              href={`data:application/octet-stream;base64,${safeFormData.legalBackgroundDocument}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </div>

                    </div>
                  </form>
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