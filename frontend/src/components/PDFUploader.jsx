import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const PDFUploader = ({ onExtracted }) => {
  const { addToast } = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else {
      addToast('Please select a valid PDF file', 'error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === 'application/pdf') {
      setFile(dropped);
    } else {
      addToast('Please drop a valid PDF file', 'error');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await api.post('/pdf/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(`Extracted ${res.data.totalExtracted} questions from PDF!`, 'success');
      if (onExtracted) {
        onExtracted(res.data.questions, res.data.fileName);
      }
    } catch (err) {
      console.error(err);
      addToast(err.response?.data?.message || 'Failed to extract questions from PDF', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 bg-slate-50/50 dark:bg-slate-900/30'
        }`}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload-input"
        />
        <label htmlFor="pdf-upload-input" className="cursor-pointer flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Upload Question Paper PDF
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">
            Drag and drop your PDF file here, or click to browse files. Supports text-based MCQ question papers.
          </p>
        </label>

        {file && (
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-200 dark:border-indigo-800 text-sm text-indigo-700 dark:text-indigo-300 font-medium">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-xs">{file.name}</span>
            <span className="text-xs opacity-75">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-lg transition-all ${
            !file || loading
              ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
              : 'bg-[#58A6FF] hover:bg-[#388BFD] text-[#0D1117] cursor-pointer'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Extracting MCQs...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Extract Questions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PDFUploader;
