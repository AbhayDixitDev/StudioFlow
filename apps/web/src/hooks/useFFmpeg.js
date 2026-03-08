import { useState, useRef, useCallback } from 'react';

/**
 * Hook for browser-side audio conversion using FFmpeg WASM.
 * Lazy-loads FFmpeg on first use.
 */
export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const ffmpegRef = useRef(null);

  const load = useCallback(async () => {
    if (ffmpegRef.current) return;
    setIsLoading(true);

    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setIsLoaded(true);
    } catch (err) {
      console.error('Failed to load FFmpeg WASM:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const convert = useCallback(
    async (file, targetFormat, options = {}) => {
      if (!ffmpegRef.current) await load();
      const ffmpeg = ffmpegRef.current;

      const { fetchFile } = await import('@ffmpeg/util');
      const inputName = `input.${file.name.split('.').pop()}`;
      const outputName = `output.${targetFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const args = ['-i', inputName];
      if (options.bitrate) args.push('-b:a', options.bitrate);
      if (options.sampleRate) args.push('-ar', String(options.sampleRate));
      args.push(outputName);

      setProgress(0);
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: `audio/${targetFormat}` });

      // Cleanup
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return blob;
    },
    [load]
  );

  const cutAudio = useCallback(
    async (file, startTime, endTime, fadeIn = 0, fadeOut = 0, format) => {
      if (!ffmpegRef.current) await load();
      const ffmpeg = ffmpegRef.current;

      const { fetchFile } = await import('@ffmpeg/util');
      const ext = file.name.split('.').pop();
      const outputFormat = format || ext;
      const inputName = `input.${ext}`;
      const outputName = `output.${outputFormat}`;

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      const duration = endTime - startTime;
      const args = ['-i', inputName, '-ss', String(startTime), '-t', String(duration)];

      const filters = [];
      if (fadeIn > 0) filters.push(`afade=t=in:d=${fadeIn}`);
      if (fadeOut > 0) filters.push(`afade=t=out:st=${duration - fadeOut}:d=${fadeOut}`);
      if (filters.length > 0) args.push('-af', filters.join(','));

      args.push(outputName);

      setProgress(0);
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outputName);
      const blob = new Blob([data.buffer], { type: `audio/${outputFormat}` });

      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      return blob;
    },
    [load]
  );

  return { isLoaded, isLoading, progress, load, convert, cutAudio };
}
