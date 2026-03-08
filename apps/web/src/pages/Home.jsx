import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card } from '@audio-sep/ui';
import {
  Scissors,
  FileVideo,
  ScissorsLineDashed,
  RefreshCw,
  Film,
} from 'lucide-react';

const tools = [
  {
    title: 'Audio Separator',
    description: 'Split any song into vocals, drums, bass, and more using AI',
    icon: Scissors,
    path: '/separator',
    color: '#8b5cf6',
  },
  {
    title: 'Video to Audio',
    description: 'Extract audio from video files or YouTube URLs',
    icon: FileVideo,
    path: '/video-to-audio',
    color: '#06b6d4',
  },
  {
    title: 'Audio Cutter',
    description: 'Trim and cut audio files with waveform precision',
    icon: ScissorsLineDashed,
    path: '/cutter',
    color: '#f59e0b',
  },
  {
    title: 'Format Changer',
    description: 'Convert between MP3, WAV, FLAC, OGG, AAC, and more',
    icon: RefreshCw,
    path: '/converter',
    color: '#10b981',
  },
  {
    title: 'Video Editor',
    description: 'Full timeline editor with effects, text, and transitions',
    icon: Film,
    path: '/editor',
    color: '#ef4444',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          Audio Separator
        </h1>
        <p className="text-lg opacity-70">
          Powerful audio and video tools, all in one place
        </p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {tools.map((tool) => (
          <motion.div key={tool.path} variants={item}>
            <Card
              className="cursor-pointer hover:scale-[1.02] transition-transform"
              onClick={() => navigate(tool.path)}
            >
              <div className="p-6">
                <tool.icon size={32} style={{ color: tool.color }} className="mb-4" />
                <h2 className="text-lg font-semibold mb-2">{tool.title}</h2>
                <p className="text-sm opacity-60">{tool.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
