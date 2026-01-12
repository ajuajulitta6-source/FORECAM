import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, accept = "image/*,.pdf", label = "Upload File" }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {label && <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">{label}</label>}
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${dragActive ? 'border-primary bg-primary/5' : 'border-slate-300 hover:bg-slate-50'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          accept={accept} 
          onChange={handleChange} 
        />
        
        {selectedFile ? (
          <div className="flex items-center gap-3 p-2">
            <div className="p-2 bg-slate-100 rounded-lg">
              {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-6 h-6 text-primary" /> : <FileText className="w-6 h-6 text-primary" />}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={removeFile} className="p-1 hover:bg-slate-200 rounded-full transition-colors ml-2">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
            <Upload className={`w-8 h-8 mb-2 ${dragActive ? 'text-primary' : 'text-slate-400'}`} />
            <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">SVG, PNG, JPG or PDF (MAX. 5MB)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;