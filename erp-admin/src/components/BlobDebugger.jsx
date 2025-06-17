import React, { useState } from 'react';

const BlobDebugger = ({ base64Data, fileName = 'document.pdf' }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  const analyzeBlob = () => {
    try {
      console.group('🔍 Detailed Blob Analysis');
      
      // Base64 analysis
      console.log('📊 Base64 Analysis:');
      console.log('- Length:', base64Data?.length || 0);
      console.log('- First 50 chars:', base64Data?.substring(0, 50));
      console.log('- Last 50 chars:', base64Data?.substring(base64Data.length - 50));
      
      // Check if it's valid base64
      const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data);
      console.log('- Valid Base64 format:', isValidBase64);

      if (!isValidBase64) {
        console.error('❌ Invalid Base64 format detected!');
        return;
      }

      // Convert to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      
      // PDF signature check
      const pdfSignature = bytes.slice(0, 4);
      const isPdf = pdfSignature[0] === 0x25 && pdfSignature[1] === 0x50 && 
                   pdfSignature[2] === 0x44 && pdfSignature[3] === 0x46; // %PDF
      
      console.log('📄 PDF Analysis:');
      console.log('- File signature (first 4 bytes):', Array.from(pdfSignature).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '));
      console.log('- Is valid PDF:', isPdf);
      
      const url = URL.createObjectURL(blob);
      
      const info = {
        base64Length: base64Data.length,
        blobSize: blob.size,
        blobType: blob.type,
        isValidBase64,
        isPdf,
        blobUrl: url,
        sizeInKB: Math.round(blob.size / 1024),
        fileName
      };
      
      setDebugInfo(info);
      setBlobUrl(url);
      
      console.log('✅ Blob created successfully:', info);
      console.groupEnd();
      
    } catch (error) {
      console.error('❌ Error analyzing blob:', error);
      console.groupEnd();
    }
  };

  return (
    <div style={{ padding: '20px', border: '2px solid #007bff', borderRadius: '8px', margin: '20px 0' }}>
      <h3>🔧 Blob Debugger</h3>
      
      <button onClick={analyzeBlob} style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
        Analyze Blob Data
      </button>

      {debugInfo && (
        <div style={{ marginTop: '20px' }}>
          <h4>📊 Analysis Results:</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>File Name:</td>
                <td style={{ padding: '8px' }}>{debugInfo.fileName}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Base64 Length:</td>
                <td style={{ padding: '8px' }}>{debugInfo.base64Length.toLocaleString()} characters</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Blob Size:</td>
                <td style={{ padding: '8px' }}>{debugInfo.blobSize.toLocaleString()} bytes ({debugInfo.sizeInKB} KB)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Valid Base64:</td>
                <td style={{ padding: '8px' }}>{debugInfo.isValidBase64 ? '✅ Yes' : '❌ No'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Valid PDF:</td>
                <td style={{ padding: '8px' }}>{debugInfo.isPdf ? '✅ Yes' : '❌ No'}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '8px', fontWeight: 'bold' }}>Blob URL:</td>
                <td style={{ padding: '8px', wordBreak: 'break-all' }}>{debugInfo.blobUrl}</td>
              </tr>
            </tbody>
          </table>

          {blobUrl && (
            <div style={{ marginTop: '20px' }}>
              <h4>🎯 Quick Actions:</h4>
              <button onClick={() => window.open(blobUrl, '_blank')} style={{ margin: '5px', padding: '8px 16px' }}>
                Open in New Tab
              </button>
              <button onClick={() => {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = debugInfo.fileName;
                link.click();
              }} style={{ margin: '5px', padding: '8px 16px' }}>
                Download File
              </button>
              <button onClick={() => navigator.clipboard.writeText(blobUrl)} style={{ margin: '5px', padding: '8px 16px' }}>
                Copy URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BlobDebugger;