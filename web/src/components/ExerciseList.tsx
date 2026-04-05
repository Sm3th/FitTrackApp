import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import EmptyState from './EmptyState';
import { CardSkeleton } from './LoadingSkeleton';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroup: string;
  equipment?: string;
  difficulty?: string;
}

export const ExerciseList: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredExercises(exercises);
    } else {
      setFilteredExercises(
        exercises.filter((ex) => ex.muscleGroup.toLowerCase() === filter.toLowerCase())
      );
    }
  }, [filter, exercises]);

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

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Exercise Library</h2>
        <p className="text-gray-600 mb-6">Browse our comprehensive collection of exercises</p>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'].map((muscleGroup) => (
            <button
              key={muscleGroup}
              onClick={() => setFilter(muscleGroup)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === muscleGroup
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise Cards */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="col-span-full">
          <EmptyState
            icon="🔍"
            title="No Exercises Found"
            description={`No exercises match "${filter === 'all' ? '' : filter}". Try a different search term or browse all exercises.`}
            actionLabel="🔄 Clear Search"
            onAction={() => setFilter('all')}
            variant="minimal"
          />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{exercise.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{exercise.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  💪 {exercise.muscleGroup}
                </span>
                {exercise.equipment && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                    🏋️ {exercise.equipment}
                  </span>
                )}
                {exercise.difficulty && (
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};