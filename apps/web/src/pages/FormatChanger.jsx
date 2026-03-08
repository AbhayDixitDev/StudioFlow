import { useState } from 'react';
import { ToolPage, FileDropzone, Button, ProgressBar } from '@studioflow/ui';
import { Download, CheckCircle } from 'lucide-react';
import FormatPicker from '../features/converter/FormatPicker.jsx';
import QualitySettings from '../features/converter/QualitySettings.jsx';
import { useFFmpeg } from '../hooks/useFFmpeg.js';
import { formatFileSize } from '@studioflow/shared';

export default function FormatChanger() {
  const [file, setFile] = useState(null);
  const [targetFormat, setTargetFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192k');
  const [sampleRate, setSampleRate] = useState(44100);
  const [isConverting, setIsConverting] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [error, setError] = useState(null);

  const { progress, isLoading: ffmpegLoading } = useFFmpeg();
  const ffmpeg = useFFmpeg();

  const handleFileDrop = (files) => {
    const selected = files[0];
    if (!selected) return;
    setFile(selected);
    setError(null);
    setResultBlob(null);
  };

  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setError(null);

    try {
      const blob = await ffmpeg.convert(file, targetFormat, {
        bitrate,
        sampleRate,
      });
      setResultBlob(blob);
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err.message || 'Conversion failed');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    a.download = `${baseName}.${targetFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setResultBlob(null);
    setError(null);
  };

  const fileExt = file ? file.name.split('.').pop().toUpperCase() : '';

  return (
    <ToolPage
      title="Format Changer"
      description="Convert audio between MP3, WAV, FLAC, OGG, AAC, and more"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Upload */}
        {!file && (
          <FileDropzone
            accept="audio/*"
            onDrop={handleFileDrop}
          />
        )}

        {/* File info */}
        {file && !resultBlob && (
          <div className="p-4 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700/50">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  {fileExt} &middot; {formatFileSize(file.size)}
                </p>
              </div>
              <button onClick={reset} className="text-sm text-violet-500 hover:underline">
                Change file
              </button>
            </div>
          </div>
        )}

        {/* Format picker + quality */}
        {file && !resultBlob && (
          <>
            <div>
              <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Output Format</h3>
              <FormatPicker selected={targetFormat} onSelect={setTargetFormat} />
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Quality</h3>
              <QualitySettings
                format={targetFormat}
                bitrate={bitrate}
                sampleRate={sampleRate}
                onBitrateChange={setBitrate}
                onSampleRateChange={setSampleRate}
                duration={0}
              />
            </div>

            <Button
              onClick={handleConvert}
              loading={isConverting || ffmpegLoading}
              size="lg"
              className="w-full !bg-violet-600 hover:!bg-violet-700 !text-white !shadow-lg"
            >
              {ffmpegLoading ? 'Loading FFmpeg...' : `Convert to ${targetFormat.toUpperCase()}`}
            </Button>
          </>
        )}

        {/* Converting progress */}
        {isConverting && (
          <ProgressBar value={ffmpeg.progress} label={ffmpegLoading ? 'Loading FFmpeg engine...' : `Converting... ${ffmpeg.progress}%`} />
        )}

        {/* Completed */}
        {resultBlob && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-medium text-gray-900 dark:text-gray-100">Conversion complete!</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Output: {formatFileSize(resultBlob.size)}
            </p>
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
