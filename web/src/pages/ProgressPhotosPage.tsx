import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import EmptyState from '../components/EmptyState';

interface ProgressPhoto {
  id: string;
  date: string;
  imageUrl: string;
  weight?: number;
  notes?: string;
}

const ProgressPhotosPage: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || 'en';
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [newPhoto, setNewPhoto] = useState({
    weight: '',
    notes: '',
    imagePreview: null as string | null,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadPhotos();
  }, [navigate]);

  const loadPhotos = () => {
    // Load from localStorage
    const saved = localStorage.getItem('progressPhotos');
    if (saved) {
      setPhotos(JSON.parse(saved));
    }
  };

  const savePhotos = (updatedPhotos: ProgressPhoto[]) => {
    localStorage.setItem('progressPhotos', JSON.stringify(updatedPhotos));
    setPhotos(updatedPhotos);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhoto({
          ...newPhoto,
          imagePreview: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (!newPhoto.imagePreview) {
      alert('Please select a photo');
      return;
    }

    const photo: ProgressPhoto = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imageUrl: newPhoto.imagePreview,
      weight: newPhoto.weight ? parseFloat(newPhoto.weight) : undefined,
      notes: newPhoto.notes || undefined,
    };

    const updatedPhotos = [photo, ...photos];
    savePhotos(updatedPhotos);

    setNewPhoto({ weight: '', notes: '', imagePreview: null });
    setShowUploadModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('photos.deleteConfirm'))) {
      const updatedPhotos = photos.filter(p => p.id !== id);
      savePhotos(updatedPhotos);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(lang, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const comparePhotos = photos.length >= 2 ? [photos[0], photos[photos.length - 1]] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Header */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('photos.transformation')}</p>
              <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('photos.title')}</h1>
              <p className="text-white/40 text-sm">{t('photos.subtitle')}</p>
            </div>
            <button onClick={() => setShowUploadModal(true)} className="btn-primary text-sm py-2.5 px-5">
              {t('photos.addPhoto')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Before/After Comparison */}
        {comparePhotos && (
          <div className="mb-8 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
              {t('photos.yourTransformation')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* First Photo */}
              <div>
                <div className="text-center mb-3">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold">
                    {t('photos.before')} - {formatDate(comparePhotos[1].date)}
                  </span>
                </div>
                <div className="relative aspect-[3/4] bg-gray-200 dark:bg-slate-800 rounded-xl overflow-hidden">
                  <img
                    src={comparePhotos[1].imageUrl}
                    alt="Before"
                    className="w-full h-full object-cover"
                  />
                </div>
                {comparePhotos[1].weight && (
                  <div className="text-center mt-3 text-gray-600 dark:text-gray-400">
                    {t('photos.weight')}: {comparePhotos[1].weight} kg
                  </div>
                )}
              </div>

              {/* Latest Photo */}
              <div>
                <div className="text-center mb-3">
                  <span className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold">
                    {t('photos.after')} - {formatDate(comparePhotos[0].date)}
                  </span>
                </div>
                <div className="relative aspect-[3/4] bg-gray-200 dark:bg-slate-800 rounded-xl overflow-hidden">
                  <img
                    src={comparePhotos[0].imageUrl}
                    alt="After"
                    className="w-full h-full object-cover"
                  />
                </div>
                {comparePhotos[0].weight && (
                  <div className="text-center mt-3 text-gray-600 dark:text-gray-400">
                    Weight: {comparePhotos[0].weight} kg
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            {comparePhotos[0].weight && comparePhotos[1].weight && (
              <div className="mt-8 text-center">
                <div className="inline-block bg-gradient-to-r from-blue-500 to-green-500 text-white px-8 py-4 rounded-xl">
                  <div className="text-3xl font-bold">
                    {(comparePhotos[1].weight - comparePhotos[0].weight).toFixed(1)} kg
                  </div>
                  <div className="text-sm">
                    {comparePhotos[0].weight < comparePhotos[1].weight ? t('photos.lost') : t('photos.gained')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Photo Gallery */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {t('photos.timeline')}
          </h2>
          
          {photos.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon="📸"
                title={t('photos.noPhotos')}
                description={t('photos.noPhotosDesc')}
                actionLabel={t('photos.uploadFirstPhoto')}
                onAction={() => setShowUploadModal(true)}
                variant="gradient"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map(photo => (
                <div 
                  key={photo.id}
                  className="group relative bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="aspect-[3/4]">
                    <img
                      src={photo.imageUrl}
                      alt={`Progress ${formatDate(photo.date)}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setSelectedPhoto(photo.imageUrl)}
                    />
                  </div>
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <div className="text-white text-sm font-semibold">
                      {formatDate(photo.date)}
                    </div>
                    {photo.weight && (
                      <div className="text-white/90 text-xs">
                        {photo.weight} kg
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              {t('photos.uploadPhoto')}
            </h3>

            {/* Photo Preview */}
            {newPhoto.imagePreview ? (
              <div className="mb-4">
                <img
                  src={newPhoto.imagePreview}
                  alt="Preview"
                  className="w-full aspect-[3/4] object-cover rounded-xl"
                />
              </div>
            ) : (
              <label className="block mb-4 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                  <div className="text-5xl mb-2">📸</div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t('photos.selectPhoto')}
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}

            {/* Weight Input */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('photos.currentWeightOptional')}
              </label>
              <input
                type="number"
                step="0.1"
                value={newPhoto.weight}
                onChange={(e) => setNewPhoto({ ...newPhoto, weight: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                placeholder="70.5"
              />
            </div>

            {/* Notes Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('photos.notesOptional')}
              </label>
              <textarea
                value={newPhoto.notes}
                onChange={(e) => setNewPhoto({ ...newPhoto, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Feeling strong today..."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setNewPhoto({ weight: '', notes: '', imagePreview: null });
                }}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleUpload}
                disabled={!newPhoto.imagePreview}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('photos.upload')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto}
              alt="Progress"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 bg-white/20 text-white p-3 rounded-full text-2xl hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default ProgressPhotosPage;