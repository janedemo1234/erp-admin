"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FaTimes,
  FaCamera,
  FaUpload,
} from "react-icons/fa"
import { toast } from "react-toastify"
import imageCompression from "browser-image-compression"

// Animation variants
const modalVariants = {
  hidden: { 
    opacity: 0,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: "spring",
      damping: 25,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { 
      duration: 0.2 
    }
  }
}

const formItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.05,
      duration: 0.3,
      ease: "easeOut"
    }
  })
}

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 }
}

// Enhanced Passbook Extractor Component - Extracts both Account Number and IFSC Code
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
  const [extractedText, setExtractedText] = useState("")
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  // Enhanced account number extraction with multiple patterns
  const extractAccountNumber = (text) => {
    const cleanText = text
      .replace(/[^\w\s\-/]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // Comprehensive patterns for account number extraction
    const patterns = [
      // Standard account number patterns
      /(?:account\s*(?:no|number|num|#)?\s*:?\s*)([0-9]{9,18})/gi,
      /(?:a\/c\s*(?:no|number|num|#)?\s*:?\s*)([0-9]{9,18})/gi,
      /(?:acc\s*(?:no|number|num|#)?\s*:?\s*)([0-9]{9,18})/gi,
      /(?:acct\s*(?:no|number|num|#)?\s*:?\s*)([0-9]{9,18})/gi,

      // Bank-specific patterns
      /(?:sbi|state\s*bank)\s*.*?([0-9]{11,17})/gi,
      /(?:hdfc)\s*.*?([0-9]{12,16})/gi,
      /(?:icici)\s*.*?([0-9]{12,16})/gi,
      /(?:axis)\s*.*?([0-9]{12,16})/gi,
      /(?:pnb|punjab\s*national)\s*.*?([0-9]{10,16})/gi,
      /(?:bob|bank\s*of\s*baroda)\s*.*?([0-9]{12,16})/gi,
      /(?:canara)\s*.*?([0-9]{12,16})/gi,

      // Generic number patterns
      /\b([0-9]{10,18})\b/g,
      /([0-9]{4}[-\s]?[0-9]{4}[-\s]?[0-9]{4,10})/g,
      /([0-9]{3,4}[-\s]?[0-9]{3,4}[-\s]?[0-9]{4,8})/g,

      // Customer ID patterns (sometimes used as account numbers)
      /(?:customer\s*(?:id|no|number)\s*:?\s*)([0-9]{8,18})/gi,
      /(?:cif\s*(?:no|number)?\s*:?\s*)([0-9]{8,18})/gi,
    ]

    const matches = []

    patterns.forEach((pattern, index) => {
      let match
      while ((match = pattern.exec(cleanText)) !== null) {
        const accountNum = match[1] || match[0]
        const cleanAccountNum = accountNum.replace(/[-\s]/g, "")

        if (/^[0-9]{9,18}$/.test(cleanAccountNum)) {
          matches.push({
            value: cleanAccountNum,
            pattern: index,
            confidence: calculateAccountConfidence(cleanAccountNum, cleanText),
            context: cleanText.substring(Math.max(0, match.index - 20), match.index + 50),
          })
        }
      }
    })

    // Sort by confidence and return the best match
    matches.sort((a, b) => b.confidence - a.confidence)
    return matches.length > 0 ? matches[0].value : ""
  }

  // Enhanced IFSC code extraction with multiple patterns
  const extractIFSCCode = (text) => {
    const cleanText = text
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    // IFSC code patterns - 4 letters followed by 7 characters (letters/numbers)
    const patterns = [
      // Standard IFSC patterns
      /(?:ifsc\s*(?:code|no|number)?\s*:?\s*)([A-Z]{4}[A-Z0-9]{7})/gi,
      /(?:ifsc\s*)([A-Z]{4}[A-Z0-9]{7})/gi,
      /(?:code\s*:?\s*)([A-Z]{4}[A-Z0-9]{7})/gi,

      // Bank-specific IFSC patterns
      /(?:hdfc|sbi|pnb|icici)\s*.*?([A-Z]{4}[A-Z0-9]{7})/gi,

      // Generic IFSC pattern
      /\b([A-Z]{4}[A-Z0-9]{7})\b/g,
      /([A-Z]{4}\s*[A-Z0-9]{7})/g,
    ]

    const matches = []

    patterns.forEach((pattern, index) => {
      let match
      while ((match = pattern.exec(cleanText)) !== null) {
        const ifscMatch = match[1] || match[0]
        const cleanIFSC = ifscMatch.replace(/\s/g, "").toUpperCase()

        // Validate IFSC format: 4 letters + 7 alphanumeric
        if (/^[A-Z]{4}[A-Z0-9]{7}$/.test(cleanIFSC)) {
          matches.push({
            value: cleanIFSC,
            pattern: index,
            confidence: calculateIFSCConfidence(cleanIFSC, cleanText),
            context: cleanText.substring(Math.max(0, match.index - 20), match.index + 50),
          })
        }
      }
    })

    // Sort by confidence and return the best match
    matches.sort((a, b) => b.confidence - a.confidence)
    return matches.length > 0 ? matches[0].value : ""
  }

  // Calculate confidence score for account number
  const calculateAccountConfidence = (accountNum, text) => {
    let confidence = 50

    // Length-based confidence
    if (accountNum.length >= 10 && accountNum.length <= 16) confidence += 20
    if (accountNum.length >= 12 && accountNum.length <= 14) confidence += 10

    // Context-based confidence
    const lowerText = text.toLowerCase()
    if (lowerText.includes("account")) confidence += 15
    if (lowerText.includes("a/c")) confidence += 15
    if (lowerText.includes("acc")) confidence += 10

    // Pattern-based confidence
    if (!/^0+$/.test(accountNum)) confidence += 10
    if (!/^1+$/.test(accountNum)) confidence += 10
    if (!/(\d)\1{4,}/.test(accountNum)) confidence += 10

    return Math.min(100, confidence)
  }

  // Calculate confidence score for IFSC code
  const calculateIFSCConfidence = (ifscCode, text) => {
    let confidence = 50

    // Format-based confidence
    if (/^[A-Z]{4}[A-Z0-9]{7}$/.test(ifscCode)) confidence += 30

    // Context-based confidence
    const lowerText = text.toLowerCase()
    if (lowerText.includes("ifsc")) confidence += 20
    if (lowerText.includes("code")) confidence += 10

    // Bank code validation (first 4 letters)
    const bankCode = ifscCode.substring(0, 4)
    const knownBankCodes = ["HDFC", "SBIN", "PUNB", "ICIC", "AXIS", "CANA", "BARB"]
    if (knownBankCodes.includes(bankCode)) confidence += 15

    return Math.min(100, confidence)
  }

  // Extract bank name from IFSC code
  const getBankNameFromIFSC = (ifscCode) => {
    if (!ifscCode || ifscCode.length < 4) return ""

    const bankCode = ifscCode.substring(0, 4)
    const bankMapping = {
      HDFC: "HDFC Bank",
      SBIN: "State Bank of India",
      PUNB: "Punjab National Bank",
      ICIC: "ICICI Bank",
      AXIS: "Axis Bank",
      CANA: "Canara Bank",
      BARB: "Bank of Baroda",
      KKBK: "Kotak Mahindra Bank",
      IDIB: "Indian Bank",
      UBIN: "Union Bank of India",
      YESB: "Yes Bank"
    };

    return bankMapping[bankCode] || ""
  }

  // Enhanced image preprocessing
  const preprocessImage = (canvas, ctx, img) => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    // Convert to grayscale and enhance contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114

      // Apply contrast enhancement
      const contrast = 2.0
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
      let enhanced = factor * (gray - 128) + 128

      // Apply brightness adjustment
      enhanced = enhanced + 30

      // Ensure values are within bounds
      enhanced = Math.min(255, Math.max(0, enhanced))

      // Apply threshold for better text clarity
      const threshold = enhanced > 140 ? 255 : 0

      data[i] = threshold
      data[i + 1] = threshold
      data[i + 2] = threshold
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas.toDataURL()
  }

  // OCR extraction using Tesseract.js
  const performOCR = async (imageData) => {
    let TesseractAPI; // Declare here to be accessible in finally
    try {
      const IMPORT_TIMEOUT = 15000; // 15 seconds for dynamic import
      try {
        const tesseractImportPromise = import("tesseract.js");
        const importTimeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Tesseract.js import timed out after ${IMPORT_TIMEOUT / 1000} seconds`)), IMPORT_TIMEOUT);
        });
        const TesseractModule = await Promise.race([tesseractImportPromise, importTimeoutPromise]);
        TesseractAPI = TesseractModule.default || TesseractModule; // Assign to the outer scoped variable
      } catch (importError) {
        console.error("Failed to import Tesseract.js:", importError.message);
        throw new Error(`Failed to import Tesseract.js: ${importError.message}`);
      }
      
      if (!TesseractAPI || typeof TesseractAPI.recognize !== 'function') {
        throw new Error("Tesseract.js module not loaded correctly or 'recognize' method is missing.");
      }

      const OCR_TIMEOUT = 30000; // 30 seconds for OCR processing

      const recognitionPromise = TesseractAPI.recognize(imageData, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
        tessedit_char_whitelist: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz /-:",
        tessedit_pageseg_mode: TesseractAPI.PSM ? TesseractAPI.PSM.AUTO : undefined,
      });

      const ocrTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`OCR recognition timed out after ${OCR_TIMEOUT / 1000} seconds`));
        }, OCR_TIMEOUT);
      });

      const result = await Promise.race([recognitionPromise, ocrTimeoutPromise]);
      
      if (!result || !result.data) {
        throw new Error("OCR recognition did not return expected data structure.");
      }
      return result.data.text;

    } catch (error) {
      console.error("Error during OCR process in performOCR (before finally):", error.message);
      // Re-throw the error to be handled by the calling function (extractTextFromImage)
      // The finally block will still execute for cleanup.
      throw new Error(`OCR processing failed: ${error.message}`);
    } finally {
      // Attempt to terminate Tesseract workers if the TesseractAPI was loaded,
      // regardless of success or failure within the try block.
      if (TesseractAPI && typeof TesseractAPI.terminate === 'function') {
        try {
          console.warn("Attempting to terminate Tesseract worker(s) in performOCR finally block.");
          const terminationResult = TesseractAPI.terminate();
          if (terminationResult && typeof terminationResult.then === 'function') {
            try {
              const terminationTimeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tesseract termination await timed out after 5 seconds")), 5000)
              );
              await Promise.race([terminationResult, terminationTimeoutPromise]);
              console.warn("Tesseract worker(s) termination promise resolved or timed out.");
            } catch (awaitTermError) {
              console.error("Error or timeout awaiting Tesseract termination in performOCR finally:", awaitTermError.message);
            }
          } else {
            console.warn("Tesseract worker(s) likely terminated (synchronous or non-promise).");
          }
        } catch (termError) {
          // This catch is for errors from the TesseractAPI.terminate() call itself (if synchronous and throws)
          console.error("Error calling Tesseract.terminate() in performOCR finally:", termError.message);
        }
      }
    }
  }

  // Main extraction function
  const extractTextFromImage = async () => {
    if (!selectedImage || !imagePreview) return

    setIsProcessing(true)
    setProgress(0)
    setError("")

    try {
      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = async () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          setIsProcessing(false)
          setError("Could not process image. Canvas context not available.")
          return
        }

        canvas.width = img.width
        canvas.height = img.height

        // Preprocess image for better OCR
        const processedImageData = preprocessImage(canvas, ctx, img)

        try {
          // Perform OCR
          const text = await performOCR(processedImageData)
          setExtractedText(text)

          const successfullyExtractedItems = []

          // Extract account number
          const accountNum = extractAccountNumber(text)
          if (accountNum) {
            setAccountNumber(accountNum)
            onAccountNumberExtracted(accountNum)
            successfullyExtractedItems.push("Account Number")
          }

          // Extract IFSC code
          const extractedIFSC = extractIFSCCode(text)
          if (extractedIFSC) {
            setIFSCCode(extractedIFSC)
            onIFSCExtracted(extractedIFSC)
            successfullyExtractedItems.push("IFSC Code")

            // Extract and set bank name
            const bankName = getBankNameFromIFSC(extractedIFSC)
            if (bankName) {
              onBankNameExtracted(bankName)
              successfullyExtractedItems.push("Bank Name")
            }
          }

          if (successfullyExtractedItems.length > 0) {
            setError("")
            toast.success(`Successfully extracted: ${successfullyExtractedItems.join(", ")}!`, {
              position: "top-right",
              autoClose: 3000,
            })
          } else {
            setError("No account number, IFSC code, or bank name found. Please check image quality or enter manually.")
          }
        } catch (ocrError) {
          setError("Failed to extract text from image. Please try a clearer image.")
        }

        setIsProcessing(false)
      }

      img.onerror = () => {
        setError("Error loading image. Please try again.")
        setIsProcessing(false)
      }

      img.src = imagePreview
    } catch (error) {
      console.error("Processing error:", error)
      setError("Error processing image. Please try again.")
      setIsProcessing(false)
    }
  }

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
    setExtractedText("")
    setSelectedImage(file)
    onPassbookFileChange(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Auto-extract when image is loaded
  useState(() => {
    if (selectedImage && imagePreview) {
      extractTextFromImage()
    }
  }, [imagePreview])

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Bank Document (Passbook/Cheque/Statement)
        </label>
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors bg-gray-50 cursor-pointer"
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
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <img
                src={imagePreview || "/placeholder.svg"}
                alt="Bank document preview"
                className="w-full h-32 object-contain rounded"
              />
              {isProcessing && (
                <div className="flex items-center justify-center space-x-2">
                  <motion.div 
                    className="rounded-full h-4 w-4 border-b-2 border-indigo-600"
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      ease: "linear" 
                    }}
                  />
                  <span className="text-sm text-gray-600">Extracting banking details... {progress}%</span>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex flex-col items-center space-y-2">
              <FaUpload className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-600">
                {isProcessing ? "Processing..." : "Click to upload bank document"}
              </span>
              <span className="text-xs text-gray-500">Upload passbook, cheque, or bank statement</span>
            </div>
          )}
        </motion.div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        {(accountNumber || ifscCode) && (
          <motion.div 
            className="mt-2 space-y-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {accountNumber && (
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700"
              >
                ✓ Account number extracted: {accountNumber}
              </motion.div>
            )}
            {ifscCode && (
              <motion.div 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700"
              >
                ✓ IFSC code extracted: {ifscCode}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [newUser, setNewUser] = useState({
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
  })

  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [panFile, setPanFile] = useState(null)
  const [adhaarFile, setAdhaarFile] = useState(null)
  const [passbookFile, setPassbookFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

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
      }))
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    handleFileSelect(file)
  }

  const handleFileSelect = async (file) => {
    if (file) {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        }

        const compressedFile = await imageCompression(file, options)
        setPhoto(compressedFile)

        const reader = new FileReader()
        reader.onloadend = () => {
          setPhotoPreview(reader.result)
        }
        reader.readAsDataURL(compressedFile)

        toast.success("Photo selected and optimized successfully!", {
          position: "top-right",
          autoClose: 2000,
        })
      } catch (error) {
        console.error("Error compressing image:", error)
        toast.error("Error processing image. Please try a different photo.", {
          position: "top-right",
          autoClose: 3000,
        })
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
    setNewUser((prev) => ({
      ...prev,
      passbookFile: file,
    }))
  }

  const handleIFSCExtracted = (ifscCode) => {
    setNewUser((prev) => ({
      ...prev,
      ifscCode: ifscCode,
    }))
  }

  const handleBankNameExtracted = (bankName) => {
    setNewUser((prev) => ({
      ...prev,
      bankName: bankName,
    }))
  }

  const handleDocumentFileChange = (e, documentType) => {
    const file = e.target.files[0]
    if (file) {
      if (documentType === "pan") {
        setPanFile(file)
        setNewUser((prev) => ({ ...prev, panFile: file }))
      } else if (documentType === "adhaar") {
        setAdhaarFile(file)
        setNewUser((prev) => ({ ...prev, adhaarFile: file }))
      }
    }
  }

  const handleAddUserSubmit = async (e) => {
    e.preventDefault()

    try {
      const userProfileData = {
        ...newUser,
        srNo: Math.floor(100000 + Math.random() * 900000),
        status: "N",
      }

      const formDataToSend = new FormData()

      const userProfileBlob = new Blob([JSON.stringify(userProfileData)], {
        type: "application/json",
      })
      formDataToSend.append("userProfile", userProfileBlob)

      if (photo) {
        formDataToSend.append("photo", photo)
      }
      if (panFile) {
        formDataToSend.append("panFile", panFile)
      }
      if (adhaarFile) {
        formDataToSend.append("adhaarFile", adhaarFile)
      }
      if (passbookFile) {
        formDataToSend.append("passbookFile", passbookFile)
      }

      const response = await fetch("http://localhost:8080/api/user-profiles/save", {
        method: "POST",
        body: formDataToSend,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      const responseData = await response.json()

      const userData = responseData.data || responseData
      const updatedUser = {
        ...userProfileData,
        ...userData,
        photo: userData.photo || null,
      }

      onUserAdded(updatedUser)

      toast.success("User added successfully!", {
        position: "top-right",
        autoClose: 3000,
      })

      onClose()
      resetNewUserForm()
    } catch (error) {
      console.error("Error submitting user:", error)

      const userProfileData = {
        ...newUser,
        srNo: Math.floor(100000 + Math.random() * 900000),
        status: "N",
      }

      onUserAdded(userProfileData)

      toast.warning("Backend not available. User added locally for demo.", {
        position: "top-right",
        autoClose: 5000,
      })

      onClose()
      resetNewUserForm()
    }
  }

  const resetNewUserForm = () => {
    setNewUser({
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
    })
    setPhoto(null)
    setPhotoPreview(null)
    setPanFile(null)
    setAdhaarFile(null)
    setPassbookFile(null)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50"
        >
          <div className="relative max-h-full w-full max-w-6xl p-4">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative rounded-lg bg-white p-6 shadow dark:bg-gray-800 max-h-screen overflow-y-auto"
            >
              <div className="mb-4 flex items-center justify-between border-b pb-4 dark:border-gray-700">
                <motion.h3 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  Add New User
                </motion.h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
                >
                  <FaTimes />
                </motion.button>
              </div>

              <form onSubmit={handleAddUserSubmit} className="space-y-6">
                {/* Photo Upload Section */}
                <motion.div 
                  custom={0}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="mb-6"
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Photo</label>
                  <motion.div
                    className={`mt-2 flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 transition-all duration-300 cursor-pointer
                      ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileInput}
                    whileHover={{ scale: 1.01, borderColor: "#6366f1" }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {photoPreview ? (
                      <motion.div 
                        className="flex flex-col items-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div 
                          className="relative mb-3 h-24 w-24 overflow-hidden rounded-full border-2 border-indigo-200"
                          whileHover={{ scale: 1.05, borderColor: "#4f46e5" }}
                        >
                          <img
                            src={photoPreview || "/placeholder.svg"}
                            alt="Preview"
                            className="h-full w-full object-cover"
                          />
                        </motion.div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPhoto(null)
                            setPhotoPreview(null)
                          }}
                          className="mt-2 text-xs text-red-500 hover:text-red-700"
                        >
                          Remove photo
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.div className="flex flex-col items-center">
                        <motion.div 
                          className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-500"
                          whileHover={{ scale: 1.1, backgroundColor: "#e0e7ff" }}
                        >
                          <FaCamera className="h-6 w-6" />
                        </motion.div>
                        <p className="mb-1 text-sm font-medium text-gray-700">
                          <span className="text-indigo-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                      </motion.div>
                    )}
                  </motion.div>
                </motion.div>

                {/* Basic Information */}
                <motion.div 
                  custom={1}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-employeeSerialNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Employee Serial Number
                    </label>
                    <input
                      type="text"
                      id="new-employeeSerialNumber"
                      name="employeeSerialNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.employeeSerialNumber}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-employeeName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Employee Name
                    </label>
                    <input
                      type="text"
                      id="new-employeeName"
                      name="employeeName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.employeeName}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  custom={2}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-emailAddress"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="new-emailAddress"
                      name="emailAddress"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.emailAddress}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-emergencyContactNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Emergency Contact Number
                    </label>
                    <input
                      type="text"
                      id="new-emergencyContactNumber"
                      name="emergencyContactNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.emergencyContactNumber}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  custom={3}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <label
                    htmlFor="new-address"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Address
                  </label>
                  <textarea
                    id="new-address"
                    name="address"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={newUser.address}
                    onChange={handleNewUserInputChange}
                    required
                  ></textarea>
                </motion.div>

                {/* Employment Details */}
                <motion.div 
                  custom={4}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-qualification"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Qualification
                    </label>
                    <input
                      type="text"
                      id="new-qualification"
                      name="qualification"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.qualification}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-dateOfJoining"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Date of Joining
                    </label>
                    <input
                      type="date"
                      id="new-dateOfJoining"
                      name="dateOfJoining"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.dateOfJoining}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  custom={5}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-designation"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Designation
                    </label>
                    <input
                      type="text"
                      id="new-designation"
                      name="designation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.designation}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-department"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Department
                    </label>
                    <input
                      type="text"
                      id="new-department"
                      name="department"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.department}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  custom={6}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-reportingOfficer"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Reporting Officer
                    </label>
                    <input
                      type="text"
                      id="new-reportingOfficer"
                      name="reportingOfficer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.reportingOfficer}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-grossSalary"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Gross Salary
                    </label>
                    <input
                      type="number"
                      id="new-grossSalary"
                      name="grossSalary"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.grossSalary}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </motion.div>

                {/* Bank Details Section */}
                <motion.div 
                  custom={7}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-bankAccountNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      id="new-bankAccountNumber"
                      name="bankAccountNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.bankAccountNumber}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="new-ifscCode"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      id="new-ifscCode"
                      name="ifscCode"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.ifscCode}
                      onChange={handleNewUserInputChange}
                      placeholder="e.g., HDFC0001234"
                      maxLength="11"
                      style={{ textTransform: "uppercase" }}
                      required
                    />
                  </div>
                </motion.div>

                <motion.div 
                  custom={8}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-bankName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Bank Name
                    </label>
                    <select
                      id="new-bankName"
                      name="bankName"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.bankName}
                      onChange={handleNewUserInputChange}
                      required
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
                      htmlFor="new-personalFileNumber"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Personal File Number
                    </label>
                    <input
                      type="text"
                      id="new-personalFileNumber"
                      name="personalFileNumber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.personalFileNumber}
                      onChange={handleNewUserInputChange}
                      required
                    />
                  </div>
                </motion.div>

                {/* Enhanced Passbook Extractor - Extracts both Account Number and IFSC Code */}
                <PassbookExtractor
                  onAccountNumberExtracted={handleAccountNumberExtracted}
                  onIFSCExtracted={handleIFSCExtracted}
                  onBankNameExtracted={handleBankNameExtracted}
                  onPassbookFileChange={handlePassbookFileChange}
                />

                {/* Document Upload Section */}
                <motion.div 
                  custom={9}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-pan"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      PAN Number
                    </label>
                    <input
                      type="text"
                      id="new-pan"
                      name="pan"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.pan}
                      onChange={handleNewUserInputChange}
                      maxLength="10"
                      required
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        PAN Document
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentFileChange(e, "pan")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </motion.div>
                      {panFile && (
                        <motion.p 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-green-600 mt-1"
                        >
                          ✓ {panFile.name}
                        </motion.p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="new-adhaar"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Aadhaar Number
                    </label>
                    <input
                      type="text"
                      id="new-adhaar"
                      name="adhaar"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.adhaar}
                      onChange={handleNewUserInputChange}
                      maxLength="12"
                      required
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Aadhaar Document
                      </label>
                      <motion.div whileHover={{ scale: 1.01 }}>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleDocumentFileChange(e, "adhaar")}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </motion.div>
                      {adhaarFile && (
                        <motion.p 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-green-600 mt-1"
                        >
                          ✓ {adhaarFile.name}
                        </motion.p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Background Information */}
                <motion.div 
                  custom={10}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4 sm:grid-cols-2"
                >
                  <div>
                    <label
                      htmlFor="new-medicalBackground"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Medical Background
                    </label>
                    <textarea
                      id="new-medicalBackground"
                      name="medicalBackground"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.medicalBackground}
                      onChange={handleNewUserInputChange}
                    ></textarea>
                  </div>
                  <div>
                    <label
                      htmlFor="new-legalBackground"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Legal Background
                    </label>
                    <textarea
                      id="new-legalBackground"
                      name="legalBackground"
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={newUser.legalBackground}
                      onChange={handleNewUserInputChange}
                    ></textarea>
                  </div>
                </motion.div>

                <motion.div 
                  custom={11}
                  variants={formItemVariants}
                  initial="hidden"
                  animate="visible"
                  className="mt-4 flex justify-end space-x-3"
                >
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    type="button"
                    onClick={onClose}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm border-2 border-indigo-500 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    type="submit"
                    className="rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Add User
                  </motion.button>
                </motion.div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AddUserModal