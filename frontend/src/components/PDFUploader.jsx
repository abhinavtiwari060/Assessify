import React, { useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { UploadCloud, FileText, CheckCircle, Loader2 } from 'lucide-react';

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

      const data = res.data;
      const count = data.questionCount || data.totalExtracted || (data.questions ? data.questions.length : 0);

      if (data.success && count > 0) {
        addToast(`Successfully extracted ${count} question(s) from PDF!`, 'success');
      } else if (data.requiresOCR || data.status === 'no_text') {
        addToast('This PDF appears to be scanned/image-based. OCR is required.', 'warning');
      } else {
        addToast(data.error || data.message || 'No valid MCQs could be detected from PDF', 'error');
      }

      if (onExtracted) {
        onExtracted(data.questions || [], data.fileName || file.name, data);
      }
    } catch (err) {
      console.error(err);
      addToast(
        err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to extract questions from PDF',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#161B22] rounded-3xl p-8 border border-[#30363D] shadow-sm space-y-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          dragOver
            ? 'border-[#58A6FF] bg-[#21262D] scale-[1.01]'
            : 'border-[#30363D] hover:border-[#58A6FF] bg-[#0D1117]'
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
          <div className="w-16 h-16 rounded-2xl bg-[#21262D] border border-[#30363D] text-[#58A6FF] flex items-center justify-center mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h4 className="text-base font-extrabold text-[#F0F6FC] mb-1">
            Upload Question Paper PDF
          </h4>
          <p className="text-xs text-[#8B949E] max-w-sm mb-4">
            Drag and drop your PDF file here, or click to browse files. Supports text-based MCQ question papers.
          </p>
        </label>

        {file && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[#21262D] rounded-xl border border-[#30363D] text-xs text-[#58A6FF] font-bold">
            <FileText className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-xs">{file.name}</span>
            <span className="text-[11px] text-[#8B949E]">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-extrabold text-xs shadow-md transition-all ${
            !file || loading
              ? 'bg-[#21262D] border border-[#30363D] text-[#8B949E] cursor-not-allowed'
              : 'bg-[#58A6FF] hover:bg-[#388BFD] text-[#0D1117] cursor-pointer'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#0D1117]" />
              <span>Extracting MCQs...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-[#0D1117]" />
              <span>Extract Questions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PDFUploader;
