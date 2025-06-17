import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink } from "lucide-react";

const FileViewerModal = ({ isOpen, onClose, file }) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !file) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `data:application/octet-stream;base64,${file.data}`;
    link.download = file.name || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const renderFileContent = () => {
    if (file.type === 'image') {
      return (
        <div className="flex items-center justify-center h-full overflow-auto">
          <img
            src={`data:image/jpeg;base64,${file.data}`}
            alt={file.name}
            className="max-w-none transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          />
        </div>
      );
    } else if (file.type === 'pdf') {
      return (
        <div className="h-full">
          <iframe
            src={`data:application/pdf;base64,${file.data}`}
            className="w-full h-full border-0"
            title={file.name}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="text-6xl text-gray-400">📄</div>
          <p className="text-lg text-gray-600">{file.name}</p>
          <p className="text-sm text-gray-500">Preview not available for this file type</p>
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download to View</span>
          </button>
        </div>
      );
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
              <p className="text-sm text-gray-500">File Viewer</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {file.type === 'image' && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-gray-600 px-2">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                </>
              )}
              
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="h-4 w-4" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="h-full pb-16 bg-gray-100">
            {renderFileContent()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FileViewerModal;