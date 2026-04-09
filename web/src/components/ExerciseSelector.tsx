import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroup: string;
  equipment?: string;
  difficulty?: string;
}

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
}

const MUSCLE_FILTERS = [
  { id: 'all',       label: 'All',       emoji: '🔥', color: '#6b7280', grad: 'linear-gradient(135deg,#4b5563,#374151)' },
  { id: 'chest',     label: 'Chest',     emoji: '🫀', color: '#3b82f6', grad: 'linear-gradient(135deg,#2563eb,#4f46e5)' },
  { id: 'back',      label: 'Back',      emoji: '🏋️', color: '#10b981', grad: 'linear-gradient(135deg,#059669,#0d9488)' },
  { id: 'shoulders', label: 'Shoulders', emoji: '💫', color: '#8b5cf6', grad: 'linear-gradient(135deg,#7c3aed,#a21caf)' },
  { id: 'arms',      label: 'Arms',      emoji: '💪', color: '#f59e0b', grad: 'linear-gradient(135deg,#d97706,#ea580c)' },
  { id: 'legs',      label: 'Legs',      emoji: '🦵', color: '#ef4444', grad: 'linear-gradient(135deg,#dc2626,#e11d48)' },
  { id: 'core',      label: 'Core',      emoji: '⚡', color: '#eab308', grad: 'linear-gradient(135deg,#ca8a04,#d97706)' },
  { id: 'cardio',    label: 'Cardio',    emoji: '❤️', color: '#06b6d4', grad: 'linear-gradient(135deg,#0284c7,#06b6d4)' },
];

const MUSCLE_COLORS: Record<string, string> = {
  chest: '#3b82f6', back: '#10b981', shoulders: '#8b5cf6',
  arms: '#f59e0b', legs: '#ef4444', core: '#eab308', cardio: '#06b6d4',
};

const MUSCLE_EMOJI: Record<string, string> = {
  chest: '🫀', back: '🏋️', shoulders: '💫', arms: '💪',
  legs: '🦵', core: '⚡', cardio: '❤️',
};

const DIFFICULTY_STYLE: Record<string, { bg: string; text: string }> = {
  beginner:     { bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
  intermediate: { bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b' },
  advanced:     { bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
};

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [exercises, setExercises]         = useState<Exercise[]>([]);
  const [filteredExercises, setFiltered]  = useState<Exercise[]>([]);
  const [filter, setFilter]               = useState<string>('all');
  const [searchTerm, setSearchTerm]       = useState<string>('');
  const [loading, setLoading]             = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
      setTimeout(() => searchRef.current?.focus(), 350);
    }
  }, [isOpen]);

  useEffect(() => {
    let list = exercises;
    if (filter !== 'all') list = list.filter(ex => ex.muscleGroup.toLowerCase() === filter.toLowerCase());
    if (searchTerm)        list = list.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
    setFiltered(list);
  }, [exercises, filter, searchTerm]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/exercises');
      setExercises(res.data.data);
      setFiltered(res.data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearchTerm('');
    setFilter('all');
  };

  if (!isOpen) return null;

  const activeF = MUSCLE_FILTERS.find(f => f.id === filter);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div
        className="w-full md:max-w-xl flex flex-col animate-slide-up overflow-hidden"
        style={{
          height: '92dvh',
          maxHeight: '92dvh',
          background: '#0f1120',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <div>
            <h2 className="text-lg font-black text-white">Exercise</h2>
            <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {filteredExercises.length} found
              {filter !== 'all' && activeF && (
                <span style={{ color: activeF.color }}> · {activeF.label}</span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium outline-none text-white"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                caretColor: 'var(--p-500)',
              }}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Muscle group chips */}
        <div className="px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2" style={{ width: 'max-content' }}>
            {MUSCLE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95"
                style={filter === f.id ? {
                  background: f.grad,
                  color: '#fff',
                  boxShadow: `0 4px 18px ${f.color}45`,
                } : {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                <span className="text-sm">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.08)', borderTopColor: 'rgba(255,255,255,0.5)' }} />
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.25)' }}>Loading...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>No exercises found</p>
              <button onClick={() => { setSearchTerm(''); setFilter('all'); }}
                className="text-xs font-bold transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}>
                Clear filters
              </button>
            </div>
          ) : (
            filteredExercises.map(exercise => {
              const mg = exercise.muscleGroup.toLowerCase();
              const col = MUSCLE_COLORS[mg] || '#6b7280';
              const emo = MUSCLE_EMOJI[mg] || '💪';
              const diff = DIFFICULTY_STYLE[exercise.difficulty?.toLowerCase() || ''];
              return (
                <button
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="w-full text-left flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-150 active:scale-[0.98] group"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = `${col}0f`;
                    el.style.borderColor = `${col}28`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = 'rgba(255,255,255,0.04)';
                    el.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ background: `${col}15`, border: `1.5px solid ${col}28` }}
                  >
                    {emo}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white leading-tight truncate">
                      {exercise.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[11px] font-bold" style={{ color: col }}>
                        {exercise.muscleGroup.charAt(0).toUpperCase() + exercise.muscleGroup.slice(1)}
                      </span>
                      {exercise.equipment && (
                        <>
                          <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>
                          <span className="text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {exercise.equipment}
                          </span>
                        </>
                      )}
                      {diff && exercise.difficulty && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: diff.bg, color: diff.text }}>
                          {exercise.difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Add icon */}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    style={{ background: `${col}15`, color: col }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelector;
