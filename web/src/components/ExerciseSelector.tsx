import React, { useState, useEffect } from 'react';
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

const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Fetch exercises
  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  // Filter exercises
  useEffect(() => {
    let filtered = exercises;

    // Filter by muscle group
    if (filter !== 'all') {
      filtered = filtered.filter(
        (ex) => ex.muscleGroup.toLowerCase() === filter.toLowerCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((ex) =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExercises(filtered);
  }, [exercises, filter, searchTerm]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/exercises');
      setExercises(response.data.data);
      setFilteredExercises(response.data.data);
    } catch (error) {
      console.error('Fetch exercises error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
    setSearchTerm('');
    setFilter('all');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-none md:rounded-lg w-full h-full md:max-w-4xl md:w-full md:h-auto md:max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl md:text-xl font-bold">Select Exercise</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-3xl md:text-2xl p-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-2">
            {['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'].map(
              (muscleGroup) => (
                <button
                  key={muscleGroup}
                  onClick={() => setFilter(muscleGroup)}
                  className={`px-4 py-2 rounded-md font-medium whitespace-nowrap transition-colors ${
                    filter === muscleGroup
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
                </button>
              )
            )}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Loading exercises...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No exercises found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900">
                        {exercise.name}
                      </h3>
                      {exercise.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {exercise.description}
                        </p>
                      )}
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          💪 {exercise.muscleGroup}
                        </span>
                        {exercise.equipment && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            🏋️ {exercise.equipment}
                          </span>
                        )}
                        {exercise.difficulty && (
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              exercise.difficulty === 'beginner'
                                ? 'bg-green-100 text-green-800'
                                : exercise.difficulty === 'intermediate'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {exercise.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    <button className="ml-4 text-blue-600 hover:text-blue-800 font-medium">
                      Select →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600 text-center">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelector;