import { useState, useRef } from 'react';
import { ToolPage, FileDropzone, Button, ProgressBar } from '@audio-sep/ui';
import { Download, Play, Pause, Repeat, CheckCircle } from 'lucide-react';
import WaveformEditor from '../features/cutter/WaveformEditor.jsx';
import RegionSelector from '../features/cutter/RegionSelector.jsx';
import FadeControls from '../features/cutter/FadeControls.jsx';
import FormatPicker from '../features/converter/FormatPicker.jsx';
import api from '../services/api.js';
import { formatFileSize, formatTimecode } from '@audio-sep/shared';

export default function AudioCutter() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [region, setRegion] = useState({ start: 0, end: 0 });
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [outputFormat, setOutputFormat] = useState('mp3');

  const [isCutting, setIsCutting] = useState(false);
  const [completedJobId, setCompletedJobId] = useState(null);
  const [error, setError] = useState(null);

  const waveformRef = useRef(null);

  const handleFileDrop = async (files) => {
    const selected = files[0];
    if (!selected) return;

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
      // Create object URL for waveform
      setAudioUrl(URL.createObjectURL(selected));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCut = async () => {
    if (!uploadedFile) return;

    setIsCutting(true);
    setError(null);

    try {
      const { data } = await api.post('/audio/cut', {
        fileId: uploadedFile.id,
        startTime: region.start,
        endTime: region.end,
        fadeInDuration: fadeIn,
        fadeOutDuration: fadeOut,
        outputFormat,
      });
      setCompletedJobId(data.data.jobId);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Cut failed');
    } finally {
      setIsCutting(false);
    }
  };

  const handleDownload = () => {
    if (!completedJobId) return;
    const token = localStorage.getItem('accessToken');
    window.open(`/api/audio/download/${completedJobId}?token=${token}`, '_blank');
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setUploadedFile(null);
    setAudioUrl(null);
    setCompletedJobId(null);
    setError(null);
    setRegion({ start: 0, end: 0 });
    setFadeIn(0);
    setFadeOut(0);
  };

  return (
    <ToolPage
      title="Audio Cutter"
      description="Trim and cut audio files with waveform precision"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload */}
        {!uploadedFile && (
          <FileDropzone accept="audio/*" onDrop={handleFileDrop} loading={isUploading} />
        )}

        {/* File info */}
        {uploadedFile && (
          <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] flex justify-between items-center">
            <div>
              <p className="font-medium text-[var(--text-primary)]">{uploadedFile.originalName}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {formatFileSize(uploadedFile.fileSize)}
                {duration > 0 && ` \u00b7 ${formatTimecode(duration)}`}
              </p>
            </div>
            <button onClick={reset} className="text-sm text-violet-400 hover:underline">
              Change file
            </button>
          </div>
        )}

        {/* Waveform */}
        {audioUrl && !completedJobId && (
          <>
            <WaveformEditor
              audioUrl={audioUrl}
              onRegionChange={setRegion}
              onReady={({ duration: d }) => {
                setDuration(d);
                setRegion({ start: 0, end: d });
              }}
              onTimeUpdate={setCurrentTime}
            />

            <div className="text-center text-sm opacity-50 font-mono">
              {formatTimecode(currentTime)}
            </div>

            <RegionSelector
              start={region.start}
              end={region.end}
              duration={duration}
              onChange={setRegion}
            />

            <FadeControls
              fadeIn={fadeIn}
              fadeOut={fadeOut}
              maxDuration={region.end - region.start}
              onFadeInChange={setFadeIn}
              onFadeOutChange={setFadeOut}
            />

            <div>
              <h3 className="text-sm font-medium mb-3">Output Format</h3>
              <FormatPicker selected={outputFormat} onSelect={setOutputFormat} />
            </div>

            <Button onClick={handleCut} loading={isCutting} className="w-full">
              Cut & Download
            </Button>
          </>
        )}

        {isCutting && <ProgressBar value={50} indeterminate label="Cutting..." />}

        {completedJobId && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-medium">Audio cut successfully!</p>
            <Button onClick={handleDownload}>
              <Download size={16} className="mr-2" />
              Download {outputFormat.toUpperCase()}
            </Button>
            <div>
              <button onClick={reset} className="text-sm text-violet-400 hover:underline">
                Cut another file
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    </ToolPage>
  );
}
