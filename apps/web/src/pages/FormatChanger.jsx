import { useState } from 'react';
import { ToolPage, FileDropzone, Button, ProgressBar } from '@audio-sep/ui';
import { Download, CheckCircle } from 'lucide-react';
import FormatPicker from '../features/converter/FormatPicker.jsx';
import QualitySettings from '../features/converter/QualitySettings.jsx';
import api from '../services/api.js';
import { formatFileSize } from '@audio-sep/shared';

export default function FormatChanger() {
  const [file, setFile] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192k');
  const [sampleRate, setSampleRate] = useState(44100);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [completedJobId, setCompletedJobId] = useState(null);
  const [error, setError] = useState(null);

  const handleFileDrop = async (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setCompletedJobId(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selected);
      const { data } = await api.post('/audio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadedFile(data.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed');
      setFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConvert = async () => {
    if (!uploadedFile) return;

    setIsConverting(true);
    setError(null);

    try {
      const { data } = await api.post('/audio/convert', {
        fileId: uploadedFile.id,
        targetFormat,
        bitrate,
        sampleRate,
      });
      setCompletedJobId(data.data.jobId);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!completedJobId) return;
    const token = localStorage.getItem('accessToken');
    window.open(`/api/audio/download/${completedJobId}?token=${token}`, '_blank');
  };

  const reset = () => {
    setFile(null);
    setUploadedFile(null);
    setCompletedJobId(null);
    setError(null);
  };

  return (
    <ToolPage
      title="Format Changer"
      description="Convert audio between MP3, WAV, FLAC, OGG, AAC, and more"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Upload */}
        {!uploadedFile && (
          <FileDropzone
            accept="audio/*"
            onDrop={handleFileDrop}
            loading={isUploading}
          />
        )}

        {/* File info */}
        {uploadedFile && (
          <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-[var(--text-primary)]">{file?.name || uploadedFile.originalName}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {uploadedFile.format.toUpperCase()} &middot;{' '}
                  {formatFileSize(uploadedFile.fileSize)}
                  {uploadedFile.duration > 0 &&
                    ` \u00b7 ${Math.round(uploadedFile.duration)}s`}
                </p>
              </div>
              <button onClick={reset} className="text-sm text-violet-500 hover:underline">
                Change file
              </button>
            </div>
          </div>
        )}

        {/* Format picker */}
        {uploadedFile && !completedJobId && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Output Format</h3>
              <FormatPicker selected={targetFormat} onSelect={setTargetFormat} />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-[var(--text-primary)]">Quality</h3>
              <QualitySettings
                format={targetFormat}
                bitrate={bitrate}
                sampleRate={sampleRate}
                onBitrateChange={setBitrate}
                onSampleRateChange={setSampleRate}
                duration={uploadedFile.duration}
              />
            </div>

            <Button
              onClick={handleConvert}
              loading={isConverting}
              size="lg"
              className="w-full !bg-violet-600 hover:!bg-violet-700 !text-white !shadow-lg"
            >
              Convert to {targetFormat.toUpperCase()}
            </Button>
          </>
        )}

        {/* Converting progress */}
        {isConverting && (
          <ProgressBar value={50} indeterminate label="Converting..." />
        )}

        {/* Completed */}
        {completedJobId && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-medium">Conversion complete!</p>
            <Button onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download {targetFormat.toUpperCase()}
            </Button>
            <div>
              <button onClick={reset} className="text-sm text-violet-400 hover:underline">
                Convert another file
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </div>
    </ToolPage>
  );
}
