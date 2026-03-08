import { useState, useRef } from 'react';
import { ToolPage, FileDropzone, Button, ProgressBar } from '@studioflow/ui';
import { Download, CheckCircle } from 'lucide-react';
import WaveformEditor from '../features/cutter/WaveformEditor.jsx';
import RegionSelector from '../features/cutter/RegionSelector.jsx';
import FadeControls from '../features/cutter/FadeControls.jsx';
import FormatPicker from '../features/converter/FormatPicker.jsx';
import { useFFmpeg } from '../hooks/useFFmpeg.js';
import { formatFileSize, formatTimecode } from '@studioflow/shared';

export default function AudioCutter() {
  const [file, setFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  const [region, setRegion] = useState({ start: 0, end: 0 });
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [fadeIn, setFadeIn] = useState(0);
  const [fadeOut, setFadeOut] = useState(0);
  const [outputFormat, setOutputFormat] = useState('mp3');

  const [isCutting, setIsCutting] = useState(false);
  const [resultBlob, setResultBlob] = useState(null);
  const [error, setError] = useState(null);

  const ffmpeg = useFFmpeg();

  const handleFileDrop = (files) => {
    const selected = files[0];
    if (!selected) return;

    setFile(selected);
    setError(null);
    setResultBlob(null);
    setAudioUrl(URL.createObjectURL(selected));
  };

  const handleCut = async () => {
    if (!file) return;

    setIsCutting(true);
    setError(null);

    try {
      const blob = await ffmpeg.cutAudio(
        file,
        region.start,
        region.end,
        fadeIn,
        fadeOut,
        outputFormat
      );
      setResultBlob(blob);
    } catch (err) {
      console.error('Cut error:', err);
      setError(err.message || 'Cut failed');
    } finally {
      setIsCutting(false);
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = file.name.replace(/\.[^.]+$/, '');
    a.download = `${baseName}_cut.${outputFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setFile(null);
    setAudioUrl(null);
    setResultBlob(null);
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
        {!file && (
          <FileDropzone accept="audio/*" onDrop={handleFileDrop} />
        )}

        {/* File info */}
        {file && !resultBlob && (
          <div className="p-3 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-gray-700/50 flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {formatFileSize(file.size)}
                {duration > 0 && ` \u00b7 ${formatTimecode(duration)}`}
              </p>
            </div>
            <button onClick={reset} className="text-sm text-violet-400 hover:underline">
              Change file
            </button>
          </div>
        )}

        {/* Waveform */}
        {audioUrl && !resultBlob && (
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

            <div className="text-center text-sm text-gray-500 dark:text-gray-400 font-mono">
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
              <h3 className="text-sm font-medium mb-3 text-gray-900 dark:text-gray-100">Output Format</h3>
              <FormatPicker selected={outputFormat} onSelect={setOutputFormat} />
            </div>

            <Button
              onClick={handleCut}
              loading={isCutting || ffmpeg.isLoading}
              className="w-full"
            >
              {ffmpeg.isLoading ? 'Loading FFmpeg...' : 'Cut & Download'}
            </Button>
          </>
        )}

        {isCutting && (
          <ProgressBar
            value={ffmpeg.progress}
            label={ffmpeg.isLoading ? 'Loading FFmpeg engine...' : `Cutting... ${ffmpeg.progress}%`}
          />
        )}

        {resultBlob && (
          <div className="text-center space-y-4">
            <CheckCircle size={48} className="mx-auto text-green-400" />
            <p className="font-medium text-gray-900 dark:text-gray-100">Audio cut successfully!</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Output: {formatFileSize(resultBlob.size)}
            </p>
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
