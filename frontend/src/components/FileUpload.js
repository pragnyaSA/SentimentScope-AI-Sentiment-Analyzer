import React, { useState, useRef } from 'react';
import axios from 'axios';

const FileUpload = ({ onUploadSuccess, fileUploaded, onAnalyze, loading }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setUploaded(false);
    } else if (selectedFile) {
      alert('Please select a CSV file.');
    }
  };

  const handleFileChange = (e) => handleFileSelect(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  const handleUpload = async () => {
    if (!file) { alert('Please select a file first!'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post('https://sentimentscope-backend-zq8h.onrender.com/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploaded(true);
      onUploadSuccess(file);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file!');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      {/* Drop Zone */}
      <div
        className="drop-zone"
        style={{ borderColor: dragging ? 'var(--electric)' : undefined, background: dragging ? 'rgba(110,231,247,0.1)' : undefined }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <div className="drop-zone-icon">📊</div>
        <h3>Drop your CSV here</h3>
        <p><span>Click to browse</span> or drag and drop</p>
        <p style={{ marginTop: '6px' }}>CSV files only · max 10 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="file-input"
        />
      </div>

      {/* Selected file info */}
      {file && (
        <div className="file-selected">
          <span className="file-selected-icon">📄</span>
          <span className="file-selected-name">{file.name}</span>
          <span className="file-selected-size">{formatSize(file.size)}</span>
          {uploaded && (
            <span style={{ color: 'var(--green)', fontSize: '0.8rem', fontWeight: 500 }}>✓ Uploaded</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="buttons-container">
        {!uploaded && (
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="upload-button"
          >
            {uploading ? 'Uploading…' : 'Upload file'}
          </button>
        )}
        {uploaded && (
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="analyze-button"
          >
            {loading ? 'Analysing…' : '✦ Run Sentiment Analysis'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FileUpload;