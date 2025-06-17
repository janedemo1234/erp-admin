export const debugBlob = (blob) => {
  console.group('🔍 Blob Debug Info');
  console.log('Type:', blob.type || 'Unknown');
  console.log('Size:', blob.size, 'bytes');
  console.log('Constructor:', blob.constructor.name);
  console.log('Is Blob?', blob instanceof Blob);
  console.log('Is File?', blob instanceof File);
  
  if (blob instanceof File) {
    console.log('File name:', blob.name);
    console.log('Last modified:', new Date(blob.lastModified));
  }
  
  console.groupEnd();
  
  return blob;
};

export const blobToDataURL = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const blobToText = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
};