'use client';

import { motion } from 'framer-motion';
import { Play, Pause, Expand } from 'lucide-react';
import { useState, useRef } from 'react';

interface VideoShowcaseProps {
  videoUrl: string;
  title?: string;
  description?: string;
  className?: string;
  poster?: string;
}

export function VideoShowcase({
  videoUrl,
  title,
  description,
  className = '',
  poster,
}: VideoShowcaseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`relative rounded-xl overflow-hidden ${className}`}
    >
      <div className="relative group">
        {/* Video gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-background/20 pointer-events-none z-10" />
        
        {/* Video element */}
        <video
          ref={videoRef}
          className="w-full rounded-xl"
          poster={poster}
          onEnded={() => setIsPlaying(false)}
          onClick={togglePlay}
        >
          <source src={videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Controls overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePlay}
            className="p-4 rounded-full bg-primary/20 backdrop-blur-sm text-primary hover:bg-primary/30 transition-colors"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </motion.button>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold text-white mb-1 drop-shadow-lg">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-sm text-white/80 drop-shadow-lg">
                {description}
              </p>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm text-primary hover:bg-primary/30 transition-colors ml-4"
          >
            <Expand className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
} 