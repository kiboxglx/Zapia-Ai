'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
    src: string;
    className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            const val = (audio.currentTime / audio.duration) * 100;
            setProgress(val || 0);
        };

        const setAudioData = () => {
            setDuration(audio.duration);
        };

        const onEnd = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('ended', onEnd);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('ended', onEnd);
        }
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    return (
        <div className={cn("flex items-center gap-2 p-2 bg-muted/50 rounded-full min-w-[200px]", className)}>
            <button
                onClick={togglePlay}
                className="w-8 h-8 flex items-center justify-center bg-primary text-primary-foreground rounded-full hover:bg-primary/90 flex-shrink-0"
            >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>

            <audio ref={audioRef} src={src} preload="metadata" />

            <div className="flex-1 flex flex-col gap-1">
                <div className="h-1 w-full bg-muted-foreground/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                    <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <span>{formatTime(duration || 0)}</span>
                </div>
            </div>
        </div>
    )
}
