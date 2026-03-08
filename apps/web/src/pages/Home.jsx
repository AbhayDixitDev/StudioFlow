import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@studioflow/ui';
import {
  Scissors,
  FileVideo,
  ScissorsLineDashed,
  RefreshCw,
  Film,
} from 'lucide-react';
import api from '../services/api.js';

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
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    api.get('/video/projects?limit=6&sort=-updatedAt')
      .then((res) => setRecentProjects(res.data?.projects || []))
      .catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
          StudioFlow
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400">
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
                <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{tool.title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Projects */}
      {recentProjects.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Recent Projects</h2>
            <button
              onClick={() => navigate('/editor')}
              className="text-sm text-violet-500 hover:text-violet-400"
            >
              New Project
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((proj) => (
              <Card
                key={proj._id}
                className="cursor-pointer hover:scale-[1.02] transition-transform"
                onClick={() => navigate(`/editor?project=${proj._id}`)}
              >
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Film size={16} className="text-violet-400" />
                    <span className="text-sm font-medium truncate">{proj.name || 'Untitled Project'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-gray-400">
                    <span>{proj.projectSettings?.width || 1920}x{proj.projectSettings?.height || 1080}</span>
                    <span>{proj.tracks?.length || 0} tracks</span>
                    <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
