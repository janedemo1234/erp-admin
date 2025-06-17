"use client"

import { useState, useRef } from "react"
import {
  FaCamera,
  FaUpload,
  FaUser,
  FaBriefcase,
  FaUniversity,
  FaFileAlt,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa"

// Regex Constants
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
const AADHAAR_REGEX = /^[2-9]{1}[0-9]{3}\s?[0-9]{4}\s?[0-9]{4}$/

// Predefined options for dropdowns
const PREDEFINED_BANK_NAMES = ["HDFC Bank", "State Bank of India", "Punjab National Bank", "ICICI Bank"]
const PREDEFINED_DEPARTMENTS = [
  "Select Department",
  "Human Resources",
  "IT",
  "Finance",
  "Operations",
  "Marketing",
  "Sales",
  "Admin",
  "Research and Development",
]
const PREDEFINED_DESIGNATIONS = [
  "Select Designation",
  "Software Engineer",
  "Senior Software Engineer",
  "Tech Lead",
  "Project Manager",
  "Business Analyst",
  "QA Engineer",
  "HR Manager",
  "Sales Executive",
  "Marketing Specialist",
  "Operations Manager",
  "Accountant",
  "Admin Executive",
]
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
const EMPLOYMENT_STATUS_OPTIONS = ["Active", "Absconded", "Resigned", "Terminated", "Others"]

// Enhanced Passbook Extractor Component
const PassbookExtractor = ({
  onAccountNumberExtracted,
  onIFSCExtracted,
  onBankNameExtracted,
  onPassbookFileChange,
}) => {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [accountNumber, setAccountNumber] = useState("")
  const [ifscCode, setIFSCCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Handle image upload
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB")
      return
    }

    setError("")
    setAccountNumber("")
    setIFSCCode("")
    setSelectedImage(file)
    onPassbookFileChange(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <FaUniversity className="mr-2 text-blue-600" />
          Bank Document (Passbook/Cheque/Statement)
        </label>
        <div
          className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-all duration-300 bg-gradient-to-br from-gray-50 to-white cursor-pointer group hover:shadow-md"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isProcessing}
          />

          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative mx-auto w-32 h-32 rounded-lg overflow-hidden shadow-lg">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Bank document preview"
                  className="w-full h-full object-cover"
                />
              </div>
              {isProcessing && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600 font-medium">Extracting banking details... {progress}%</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <FaUpload className="w-8 h-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-700">
                  {isProcessing ? "Processing..." : "Upload Bank Document"}
                </p>
                <p className="text-sm text-gray-500">
                  Click to upload or drag and drop your passbook, cheque, or bank statement
                </p>
                <p className="text-xs text-gray-400">Supports: JPG, PNG, PDF (Max 10MB)</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {(accountNumber || ifscCode) && (
          <div className="mt-3 space-y-2">
            {accountNumber && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
                <FaCheckCircle className="text-green-500 mr-2" />
                <span className="text-sm text-green-700 font-medium">Account number extracted: {accountNumber}</span>
              </div>
            )}
            {ifscCode && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                <FaCheckCircle className="text-blue-500 mr-2" />
                <span className="text-sm text-blue-700 font-medium">IFSC code extracted: {ifscCode}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const UserForm = ({ onUserAdded }) => {
  const [newUser, setNewUser] = useState({
    employeeSerialNumber: "",
    firstName: "",
    surname: "",
    emergencyContactNumber: "",
    address: "",
    emailAddress: "",
    qualification: "",
    bloodGroup: "",
    password: "",
    dateOfJoining: "",
    designation: "",
    dateOfBirth: "",
    department: "",
    reportingOfficer: "",
    grossSalary: "",
    bankAccountNumber: "",
    confirmBankAccountNumber: "",
    ifscCode: "",
    confirmIFSCCode: "",
    bankName: "",
    pan: "",
    adhaar: "",
    personalFileNumber: "",
    otherDepartment: "",
    otherDesignation: "",
    otherBankName: "",
    employmentStatus: "Active",
    reasonForDiscontinuity: "",
  })

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [panFile, setPanFile] = useState(null)
  const [adhaarFile, setAdhaarFile] = useState(null)
  const [passbookFile, setPassbookFile] = useState(null)
  const [addressProofFile, setAddressProofFile] = useState(null)
  const [offerLetterFile, setOfferLetterFile] = useState(null)
  const [qualificationDocumentFile, setQualificationDocumentFile] = useState(null)
  const [medicalBackgroundDocumentFile, setMedicalBackgroundDocumentFile] = useState(null)
  const [legalBackgroundDocumentFile, setLegalBackgroundDocumentFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const fileInputRef = useRef(null)
  const [panError, setPanError] = useState("")
  const [aadhaarError, setAadhaarError] = useState("")
  const [bankAccountError, setBankAccountError] = useState("")
  const [ifscError, setIfscError] = useState("")

  const handleNewUserInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setNewUser((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }))
    } else {
      setNewUser((prev) => ({
        ...prev,
        [name]: value,
        ...(name === "department" && value !== "Others" && { otherDepartment: "" }),
        ...(name === "designation" && value !== "Others" && { otherDesignation: "" }),
        ...(name === "bankName" && value !== "Others" && { otherBankName: "" }),
        ...(name === "employmentStatus" && (value === "Active" || value === "") && { reasonForDiscontinuity: "" }),
      }))

      // Live validation for PAN and Aadhaar
      if (name === "pan") {
        const upperValue = value.toUpperCase()
        if (upperValue && !PAN_REGEX.test(upperValue)) {
          setPanError("Invalid PAN format. Should be ABCDE1234F.")
        } else {
          setPanError("")
        }
      } else if (name === "adhaar") {
        if (value && !AADHAAR_REGEX.test(value)) {
          setAadhaarError("Invalid Aadhaar. Must be 12 digits (e.g. 1234 5678 9012).")
        } else {
          setAadhaarError("")
        }
      }
      // Bank account verification
      else if (name === "confirmBankAccountNumber") {
        if (value && value !== newUser.bankAccountNumber) {
          setBankAccountError("Bank account numbers do not match.")
        } else {
          setBankAccountError("")
        }
      }
      // IFSC verification
      else if (name === "confirmIFSCCode") {
        if (value && value.toUpperCase() !== newUser.ifscCode.toUpperCase()) {
          setIfscError("IFSC codes do not match.")
        } else {
          setIfscError("")
        }
      }
      // Clear verification errors when original fields change
      else if (name === "bankAccountNumber") {
        if (newUser.confirmBankAccountNumber && value !== newUser.confirmBankAccountNumber) {
          setBankAccountError("Bank account numbers do not match.")
        } else {
          setBankAccountError("")
        }
      } else if (name === "ifscCode") {
        if (newUser.confirmIFSCCode && value.toUpperCase() !== newUser.confirmIFSCCode.toUpperCase()) {
          setIfscError("IFSC codes do not match.")
        } else {
          setIfscError("")
        }
      }
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleFileSelect = async (file) => {
    if (file) {
      try {
        setPhoto(file)

        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotoPreview(reader.result)
        }
        reader.readAsDataURL(file)

        console.log("Photo selected successfully!")
      } catch (error) {
        console.error("Error processing image:", error)
        alert("Error processing image. Please try a different photo.")
      }
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current.click()
  }

  const handleAccountNumberExtracted = (accountNumber) => {
    setNewUser((prev) => ({
      ...prev,
      bankAccountNumber: accountNumber,
    }))
  }

  const handlePassbookFileChange = (file) => {
    setPassbookFile(file)
  }

  const handleIFSCExtracted = (ifscCode) => {
    setNewUser((prev) => ({
      ...prev,
      ifscCode: ifscCode,
    }))
  }

  const handleBankNameExtracted = (extractedBankName) => {
    if (extractedBankName && PREDEFINED_BANK_NAMES.includes(extractedBankName)) {
      setNewUser((prev) => ({
        ...prev,
        bankName: extractedBankName,
        otherBankName: "",
      }))
    } else if (extractedBankName) {
      setNewUser((prev) => ({
        ...prev,
        bankName: "Others",
        otherBankName: extractedBankName,
      }))
    }
  }

  const handleDocumentFileChange = (e, documentType) => {
    const file = e.target.files[0]
    if (file) {
      if (documentType === "pan") {
        setPanFile(file)
      } else if (documentType === "adhaar") {
        setAdhaarFile(file)
      } else if (documentType === "addressProof") {
        setAddressProofFile(file)
      } else if (documentType === "offerLetter") {
        setOfferLetterFile(file)
      } else if (documentType === "qualificationDocument") {
        setQualificationDocumentFile(file)
      } else if (documentType === "medicalBackgroundDocument") {
        setMedicalBackgroundDocumentFile(file)
      } else if (documentType === "legalBackgroundDocument") {
        setLegalBackgroundDocumentFile(file)
      }
    }
  }

  const validateForm = () => {
    // Check required fields based on the Java model
    if (!newUser.employeeSerialNumber) {
      setSubmitError("Employee Serial Number is required")
      return false
    }
    if (!newUser.firstName || !newUser.surname) {
      setSubmitError("First Name and Surname are required")
      return false
    }

    // Validate PAN
    if (newUser.pan && !PAN_REGEX.test(newUser.pan.toUpperCase())) {
      setPanError("Invalid PAN format. Should be ABCDE1234F.")
      setSubmitError("Invalid PAN format")
      return false
    }

    // Validate Aadhaar
    const aadhaarValueForSubmit = newUser.adhaar || ""
    const aadhaarWithoutSpacesForSubmit = aadhaarValueForSubmit.replace(/\s/g, "")
    if (
      aadhaarValueForSubmit &&
      (!AADHAAR_REGEX.test(aadhaarValueForSubmit) || aadhaarWithoutSpacesForSubmit.length !== 12)
    ) {
      setAadhaarError("Invalid Aadhaar. Must be 12 digits (e.g. 1234 5678 9012).")
      setSubmitError("Invalid Aadhaar format")
      return false
    }

    // Validate bank account numbers match
    if (newUser.bankAccountNumber && newUser.bankAccountNumber !== newUser.confirmBankAccountNumber) {
      setBankAccountError("Bank account numbers do not match.")
      setSubmitError("Bank account numbers do not match")
      return false
    }

    // Validate IFSC codes match
    if (newUser.ifscCode && newUser.ifscCode.toUpperCase() !== newUser.confirmIFSCCode.toUpperCase()) {
      setIfscError("IFSC codes do not match.")
      setSubmitError("IFSC codes do not match")
      return false
    }

    setSubmitError("")
    return true
  }

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")

    // Validate form
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    try {
      let departmentValue = newUser.department
      if (newUser.department === "Others") {
        departmentValue = newUser.otherDepartment || null
      }

      let designationValue = newUser.designation
      if (newUser.designation === "Others") {
        designationValue = newUser.otherDesignation || null
      }

      let bankNameValue = newUser.bankName
      if (newUser.bankName === "Others") {
        bankNameValue = newUser.otherBankName || null
      }

      // Concatenate firstName and surname to create employeeName
      const employeeName = `${newUser.firstName} ${newUser.surname}`.trim()

      // Prepare user profile data for API - exactly matching Java model
      const userProfileData = {
        employeeSerialNumber: newUser.employeeSerialNumber,
        employeeName: employeeName, // This is the concatenated first name + surname
        emergencyContactNumber: newUser.emergencyContactNumber || null,
        address: newUser.address || null,
        emailAddress: newUser.emailAddress || null,
        qualification: newUser.qualification || null,
        bloodGroup: newUser.bloodGroup || null,
        password: newUser.password || null,
        dateOfJoining: newUser.dateOfJoining || null,
        designation: designationValue || null,
        dateOfBirth: newUser.dateOfBirth || null,
        department: departmentValue || null,
        reportingOfficer: newUser.reportingOfficer || null,
        grossSalary: newUser.grossSalary ? parseFloat(newUser.grossSalary) : null,
        bankAccountNumber: newUser.bankAccountNumber || null,
        ifscCode: newUser.ifscCode ? newUser.ifscCode.toUpperCase() : null,
        bankName: bankNameValue || null,
        pan: newUser.pan ? newUser.pan.toUpperCase() : null,
        adhaar: newUser.adhaar ? newUser.adhaar.replace(/\s/g, "") : null,
        personalFileNumber: newUser.personalFileNumber || null,
      }

      // Create FormData for multipart request
      const formData = new FormData()

      // Add user profile data as JSON string
      formData.append("userProfile", JSON.stringify(userProfileData))

      // Add files if they exist - using exact field names from Java model
      if (photo) {
        formData.append("photo", photo)
      }
      if (panFile) {
        formData.append("panFile", panFile)
      }
      if (adhaarFile) {
        formData.append("adhaarFile", adhaarFile)
      }
      if (passbookFile) {
        formData.append("passbookFile", passbookFile)
      }
      if (addressProofFile) {
        formData.append("addressProofFile", addressProofFile)
      }
      if (offerLetterFile) {
        formData.append("offerLetter", offerLetterFile)
      }
      if (qualificationDocumentFile) {
        formData.append("qualificationDocument", qualificationDocumentFile)
      }
      if (medicalBackgroundDocumentFile) {
        formData.append("medicalBackground", medicalBackgroundDocumentFile)
      }
      if (legalBackgroundDocumentFile) {
        formData.append("legalBackground", legalBackgroundDocumentFile)
      }

      console.log("Submitting user data:", userProfileData)

      // Make API call
      const response = await fetch("http://localhost:8080/api/user-profiles/save", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const savedUser = await response.json()
        console.log("User saved successfully:", savedUser)
        alert("User added successfully!")

        if (onUserAdded) {
          onUserAdded(savedUser)
        }

        resetNewUserForm()
      } else {
        let errorMessage = "Failed to add user"
        try {
          const errorText = await response.text()
          console.error("Error response:", errorText)
          errorMessage = errorText || `Error: ${response.status} ${response.statusText}`
        } catch (parseError) {
          errorMessage = `Error: ${response.status} ${response.statusText}`
        }

        setSubmitError(errorMessage)
        alert(`Error adding user: ${errorMessage}`)
      }
    } catch (error) {
      console.error("Error submitting user:", error)
      setSubmitError(error.message || "An unexpected error occurred")
      alert(`Error adding user: ${error.message || "An unexpected error occurred"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetNewUserForm = () => {
    setNewUser({
      employeeSerialNumber: "",
      firstName: "",
      surname: "",
      emergencyContactNumber: "",
      address: "",
      emailAddress: "",
      qualification: "",
      bloodGroup: "",
      password: "",
      dateOfJoining: "",
      designation: "",
      dateOfBirth: "",
      department: "",
      reportingOfficer: "",
      grossSalary: "",
      bankAccountNumber: "",
      confirmBankAccountNumber: "",
      ifscCode: "",
      confirmIFSCCode: "",
      bankName: "",
      pan: "",
      adhaar: "",
      personalFileNumber: "",
      otherDepartment: "",
      otherDesignation: "",
      otherBankName: "",
      employmentStatus: "Active",
      reasonForDiscontinuity: "",
    })
    setPhoto(null)
    setPhotoPreview(null)
    setPanFile(null)
    setAdhaarFile(null)
    setPassbookFile(null)
    setAddressProofFile(null)
    setOfferLetterFile(null)
    setQualificationDocumentFile(null)
    setMedicalBackgroundDocumentFile(null)
    setLegalBackgroundDocumentFile(null)
    setPanError("")
    setAadhaarError("")
    setBankAccountError("")
    setIfscError("")
    setSubmitError("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Error Alert */}
        {submitError && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg shadow-sm">
            <div className="flex items-center">
              <FaExclamationTriangle className="text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">Submission Error</h3>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAddUserSubmit} className="space-y-8">
          {/* Photo Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaCamera className="mr-3" />
                Profile Photo
              </h2>
              <p className="text-blue-100 mt-2">Upload a professional photo for the employee profile</p>
            </div>
            <div className="p-8">
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? "border-blue-400 bg-blue-50 shadow-lg scale-105"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50 hover:shadow-md"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden shadow-xl border-4 border-white">
                      <img
                        src={photoPreview || "/placeholder.svg"}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-gray-700">Photo uploaded successfully</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPhoto(null)
                          setPhotoPreview(null)
                        }}
                        className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                      <FaCamera className="w-10 h-10 text-blue-600" />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-700">Upload Profile Photo</h3>
                      <p className="text-gray-500">
                        <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop your photo
                        here
                      </p>
                      <p className="text-sm text-gray-400">PNG, JPG or JPEG (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaUser className="mr-3" />
                Basic Information
              </h2>
              <p className="text-emerald-100 mt-2">Personal details and contact information</p>
            </div>
            <div className="p-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="new-employeeSerialNumber" className="block text-sm font-semibold text-gray-800">
                    Employee Serial Number *
                  </label>
                  <input
                    type="text"
                    id="new-employeeSerialNumber"
                    name="employeeSerialNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.employeeSerialNumber}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter employee serial number"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-firstName" className="block text-sm font-semibold text-gray-800">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="new-firstName"
                    name="firstName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.firstName}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter first name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-surname" className="block text-sm font-semibold text-gray-800">
                    Surname *
                  </label>
                  <input
                    type="text"
                    id="new-surname"
                    name="surname"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.surname}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter surname"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-emailAddress" className="block text-sm font-semibold text-gray-800">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="new-emailAddress"
                    name="emailAddress"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.emailAddress}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-emergencyContactNumber" className="block text-sm font-semibold text-gray-800">
                    Emergency Contact Number
                  </label>
                  <input
                    type="text"
                    id="new-emergencyContactNumber"
                    name="emergencyContactNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.emergencyContactNumber}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter emergency contact number"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-bloodGroup" className="block text-sm font-semibold text-gray-800">
                    Blood Group
                  </label>
                  <select
                    id="new-bloodGroup"
                    name="bloodGroup"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.bloodGroup}
                    onChange={handleNewUserInputChange}
                  >
                    <option value="">Select Blood Group</option>
                    {BLOOD_GROUPS.map((bloodGroup) => (
                      <option key={bloodGroup} value={bloodGroup}>
                        {bloodGroup}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-dateOfBirth" className="block text-sm font-semibold text-gray-800">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="new-dateOfBirth"
                    name="dateOfBirth"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.dateOfBirth}
                    onChange={handleNewUserInputChange}
                  />
                </div>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="new-address" className="block text-sm font-semibold text-gray-800">
                    Address corresponding to document
                  </label>
                  <textarea
                    id="new-address"
                    name="address"
                    rows="4"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                    value={newUser.address}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter complete address"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm font-semibold text-gray-800">
                    Password
                  </label>
                  <input
                    type="password"
                    id="new-password"
                    name="password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.password}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter password"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaBriefcase className="mr-3" />
                Employment Details
              </h2>
              <p className="text-purple-100 mt-2">Job-related information and organizational details</p>
            </div>
            <div className="p-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="new-qualification" className="block text-sm font-semibold text-gray-800">
                    Qualification
                  </label>
                  <input
                    type="text"
                    id="new-qualification"
                    name="qualification"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.qualification}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter highest qualification"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-dateOfJoining" className="block text-sm font-semibold text-gray-800">
                    Date of Joining
                  </label>
                  <input
                    type="date"
                    id="new-dateOfJoining"
                    name="dateOfJoining"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.dateOfJoining}
                    onChange={handleNewUserInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-designation" className="block text-sm font-semibold text-gray-800">
                    Designation
                  </label>
                  <select
                    id="new-designation"
                    name="designation"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.designation}
                    onChange={handleNewUserInputChange}
                  >
                    {PREDEFINED_DESIGNATIONS.map((desg) => (
                      <option key={desg} value={desg === "Select Designation" ? "" : desg}>
                        {desg}
                      </option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {newUser.designation === "Others" && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor="new-otherDesignation" className="block text-sm font-semibold text-gray-800">
                        Please specify other designation
                      </label>
                      <textarea
                        id="new-otherDesignation"
                        name="otherDesignation"
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                        value={newUser.otherDesignation}
                        onChange={handleNewUserInputChange}
                        placeholder="Specify designation"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-department" className="block text-sm font-semibold text-gray-800">
                    Department
                  </label>
                  <select
                    id="new-department"
                    name="department"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.department}
                    onChange={handleNewUserInputChange}
                  >
                    {PREDEFINED_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept === "Select Department" ? "" : dept}>
                        {dept}
                      </option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {newUser.department === "Others" && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor="new-otherDepartment" className="block text-sm font-semibold text-gray-800">
                        Please specify other department
                      </label>
                      <textarea
                        id="new-otherDepartment"
                        name="otherDepartment"
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                        value={newUser.otherDepartment}
                        onChange={handleNewUserInputChange}
                        placeholder="Specify department"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-reportingOfficer" className="block text-sm font-semibold text-gray-800">
                    Reporting Officer
                  </label>
                  <input
                    type="text"
                    id="new-reportingOfficer"
                    name="reportingOfficer"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.reportingOfficer}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter reporting officer name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-grossSalary" className="block text-sm font-semibold text-gray-800">
                    Gross Salary
                  </label>
                  <input
                    type="number"
                    id="new-grossSalary"
                    name="grossSalary"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.grossSalary}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter gross salary"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employment Status */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaShieldAlt className="mr-3" />
                Employment Status
              </h2>
              <p className="text-orange-100 mt-2">Current employment status and related information</p>
            </div>
            <div className="p-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="new-employmentStatus" className="block text-sm font-semibold text-gray-800">
                    Employment Status
                  </label>
                  <select
                    id="new-employmentStatus"
                    name="employmentStatus"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.employmentStatus}
                    onChange={handleNewUserInputChange}
                  >
                    <option value="">Select Status</option>
                    {EMPLOYMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                {newUser.employmentStatus && !["Active", ""].includes(newUser.employmentStatus) && (
                  <div className="space-y-2">
                    <label htmlFor="new-reasonForDiscontinuity" className="block text-sm font-semibold text-gray-800">
                      Reason for Discontinuity
                    </label>
                    <textarea
                      id="new-reasonForDiscontinuity"
                      name="reasonForDiscontinuity"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                      value={newUser.reasonForDiscontinuity}
                      onChange={handleNewUserInputChange}
                      placeholder={
                        newUser.employmentStatus === "Others"
                          ? "Please specify other status details/reason"
                          : "Enter reason for discontinuity"
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bank Account Details */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaUniversity className="mr-3" />
                Bank Account Details
              </h2>
              <p className="text-green-100 mt-2">Banking information for salary and financial transactions</p>
            </div>
            <div className="p-8">
              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div className="space-y-2">
                  <label htmlFor="new-bankAccountNumber" className="block text-sm font-semibold text-gray-800">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    id="new-bankAccountNumber"
                    name="bankAccountNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.bankAccountNumber}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter bank account number"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-confirmBankAccountNumber" className="block text-sm font-semibold text-gray-800">
                    Confirm Bank Account Number
                  </label>
                  <input
                    type="password"
                    id="new-confirmBankAccountNumber"
                    name="confirmBankAccountNumber"
                    className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                      bankAccountError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    value={newUser.confirmBankAccountNumber}
                    onChange={handleNewUserInputChange}
                    placeholder="Re-enter account number"
                  />
                  {bankAccountError && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <FaExclamationTriangle className="mr-1" />
                      {bankAccountError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div className="space-y-2">
                  <label htmlFor="new-ifscCode" className="block text-sm font-semibold text-gray-800">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    id="new-ifscCode"
                    name="ifscCode"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.ifscCode}
                    onChange={handleNewUserInputChange}
                    placeholder="e.g., HDFC0001234"
                    maxLength="11"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-confirmIFSCCode" className="block text-sm font-semibold text-gray-800">
                    Confirm IFSC Code
                  </label>
                  <input
                    type="password"
                    id="new-confirmIFSCCode"
                    name="confirmIFSCCode"
                    className={`w-full px-4 py-3 border rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white ${
                      ifscError ? "border-red-500 bg-red-50" : "border-gray-300"
                    }`}
                    value={newUser.confirmIFSCCode}
                    onChange={handleNewUserInputChange}
                    placeholder="Re-enter IFSC code"
                    maxLength="11"
                    style={{ textTransform: "uppercase" }}
                  />
                  {ifscError && (
                    <p className="text-sm text-red-600 flex items-center mt-1">
                      <FaExclamationTriangle className="mr-1" />
                      {ifscError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mb-8">
                <div className="space-y-2">
                  <label htmlFor="new-bankName" className="block text-sm font-semibold text-gray-800">
                    Bank Name
                  </label>
                  <select
                    id="new-bankName"
                    name="bankName"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.bankName}
                    onChange={handleNewUserInputChange}
                  >
                    <option value="">Select Bank</option>
                    {PREDEFINED_BANK_NAMES.map((bank) => (
                      <option key={bank} value={bank}>
                        {bank}
                      </option>
                    ))}
                    <option value="Others">Others</option>
                  </select>
                  {newUser.bankName === "Others" && (
                    <div className="mt-3 space-y-2">
                      <label htmlFor="new-otherBankName" className="block text-sm font-semibold text-gray-800">
                        Please specify other bank name
                      </label>
                      <textarea
                        id="new-otherBankName"
                        name="otherBankName"
                        rows="2"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                        value={newUser.otherBankName}
                        onChange={handleNewUserInputChange}
                        placeholder="Specify bank name"
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-personalFileNumber" className="block text-sm font-semibold text-gray-800">
                    Personal File Number
                  </label>
                  <input
                    type="text"
                    id="new-personalFileNumber"
                    name="personalFileNumber"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={newUser.personalFileNumber}
                    onChange={handleNewUserInputChange}
                    placeholder="Enter personal file number"
                  />
                </div>
              </div>

              <PassbookExtractor
                onAccountNumberExtracted={handleAccountNumberExtracted}
                onIFSCExtracted={handleIFSCExtracted}
                onBankNameExtracted={handleBankNameExtracted}
                onPassbookFileChange={handlePassbookFileChange}
              />
            </div>
          </div>

          {/* Document Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <FaFileAlt className="mr-3" />
                Document Upload
              </h2>
              <p className="text-indigo-100 mt-2">Upload required documents and identification</p>
            </div>
            <div className="p-8">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="new-pan" className="block text-sm font-semibold text-gray-800">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      id="new-pan"
                      name="pan"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={newUser.pan}
                      onChange={handleNewUserInputChange}
                      maxLength="10"
                      placeholder="Enter PAN number"
                      style={{ textTransform: "uppercase" }}
                    />
                    {panError && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <FaExclamationTriangle className="mr-1" />
                        {panError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">PAN Document</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentFileChange(e, "pan")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {panFile && (
                      <p className="text-sm text-green-600 flex items-center mt-2">
                        <FaCheckCircle className="mr-1" />
                        {panFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="new-adhaar" className="block text-sm font-semibold text-gray-800">
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      id="new-adhaar"
                      name="adhaar"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      value={newUser.adhaar}
                      onChange={handleNewUserInputChange}
                      placeholder="Enter Aadhaar number"
                    />
                    {aadhaarError && (
                      <p className="text-sm text-red-600 flex items-center mt-1">
                        <FaExclamationTriangle className="mr-1" />
                        {aadhaarError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-800">Aadhaar Document</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleDocumentFileChange(e, "adhaar")}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {adhaarFile && (
                      <p className="text-sm text-green-600 flex items-center mt-2">
                        <FaCheckCircle className="mr-1" />
                        {adhaarFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mt-8">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">Address Proof Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleDocumentFileChange(e, "addressProof")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {addressProofFile && (
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <FaCheckCircle className="mr-1" />
                      {addressProofFile.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">Offer Letter Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleDocumentFileChange(e, "offerLetter")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {offerLetterFile && (
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <FaCheckCircle className="mr-1" />
                      {offerLetterFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">Qualification Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleDocumentFileChange(e, "qualificationDocument")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {qualificationDocumentFile && (
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <FaCheckCircle className="mr-1" />
                      {qualificationDocumentFile.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">Medical Background Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleDocumentFileChange(e, "medicalBackgroundDocument")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {medicalBackgroundDocumentFile && (
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <FaCheckCircle className="mr-1" />
                      {medicalBackgroundDocumentFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800">Legal Background Document</label>
                  <input
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => handleDocumentFileChange(e, "legalBackgroundDocument")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {legalBackgroundDocumentFile && (
                    <p className="text-sm text-green-600 flex items-center mt-2">
                      <FaCheckCircle className="mr-1" />
                      {legalBackgroundDocumentFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                type="button"
                onClick={resetNewUserForm}
                disabled={isSubmitting}
                className="px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Adding Employee...
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="mr-3" />
                    Add Employee
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserForm