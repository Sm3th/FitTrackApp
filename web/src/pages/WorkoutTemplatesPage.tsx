import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

interface TemplateExercise {
  name: string;
  sets: number;
  reps?: number;
  duration?: number;
  weight?: number;
  restAfter: number;
  notes?: string;
  supersetGroup?: number;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  exercises: TemplateExercise[];
  createdAt: string;
  lastUsed?: string;
  timesUsed: number;
  estimatedDuration: number;
  color: string;
}

const STORAGE_KEY = 'workoutTemplates';
const COLORS = [
  'from-orange-500 to-red-500',
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-500',
  'from-green-500 to-teal-500',
  'from-yellow-400 to-orange-500',
  'from-cyan-500 to-blue-500',
];

const loadTemplates = (): WorkoutTemplate[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
};
const saveTemplates = (t: WorkoutTemplate[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
const emptyExercise = (): TemplateExercise => ({ name: '', sets: 3, reps: 10, restAfter: 60 });

// Build superset display groups: consecutive exercises sharing the same supersetGroup
const buildSupersetGroups = (exercises: TemplateExercise[]): Array<{ exercises: TemplateExercise[]; isSuperset: boolean }> => {
  const groups: Array<{ exercises: TemplateExercise[]; isSuperset: boolean }> = [];
  let i = 0;
  while (i < exercises.length) {
    const ex = exercises[i];
    if (ex.supersetGroup !== undefined) {
      const group: TemplateExercise[] = [ex];
      let j = i + 1;
      while (j < exercises.length && exercises[j].supersetGroup === ex.supersetGroup) {
        group.push(exercises[j]);
        j++;
      }
      groups.push({ exercises: group, isSuperset: true });
      i = j;
    } else {
      groups.push({ exercises: [ex], isSuperset: false });
      i++;
    }
  }
  return groups;
};

const WorkoutTemplatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);
  const [importText, setImportText] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState<Partial<WorkoutTemplate>>({
    name: '', description: '', category: 'Custom',
    difficulty: 'intermediate', exercises: [emptyExercise()],
    color: COLORS[0], estimatedDuration: 45,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setTemplates(loadTemplates());
  }, [navigate]);

  const handleSave = () => {
    if (!form.name || !form.exercises?.length) return;
    const exercises = form.exercises.filter(e => e.name.trim());
    if (exercises.length === 0) return;

    if (editId) {
      const updated = templates.map(t =>
        t.id === editId ? { ...t, ...form, exercises, id: editId } as WorkoutTemplate : t
      );
      setTemplates(updated); saveTemplates(updated);
    } else {
      const newTemplate: WorkoutTemplate = {
        id: Date.now().toString(), name: form.name!,
        description: form.description, category: form.category || 'Custom',
        difficulty: form.difficulty || 'intermediate', exercises,
        createdAt: new Date().toISOString(), timesUsed: 0,
        estimatedDuration: form.estimatedDuration || 45, color: form.color || COLORS[0],
      };
      const updated = [newTemplate, ...templates];
      setTemplates(updated); saveTemplates(updated);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setForm({ name: '', description: '', category: 'Custom', difficulty: 'intermediate', exercises: [emptyExercise()], color: COLORS[0], estimatedDuration: 45 });
  };

  const handleEdit = (template: WorkoutTemplate) => {
    setForm({ ...template }); setEditId(template.id); setShowForm(true); setSelectedTemplate(null);
  };

  const handleDelete = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated); saveTemplates(updated);
    if (selectedTemplate?.id === id) setSelectedTemplate(null);
  };

  const handleUse = (template: WorkoutTemplate) => {
    const updated = templates.map(t =>
      t.id === template.id ? { ...t, timesUsed: t.timesUsed + 1, lastUsed: new Date().toISOString() } : t
    );
    setTemplates(updated); saveTemplates(updated); navigate('/workout');
  };

  const handleExport = (template: WorkoutTemplate) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `template-${template.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importText);
      const template: WorkoutTemplate = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString(), timesUsed: 0 };
      const updated = [template, ...templates];
      setTemplates(updated); saveTemplates(updated);
      setImportText(''); setShowImport(false);
    } catch { alert('Invalid JSON format'); }
  };

  const addExercise = () => setForm(p => ({ ...p, exercises: [...(p.exercises || []), emptyExercise()] }));
  const removeExercise = (i: number) => setForm(p => ({ ...p, exercises: p.exercises?.filter((_, idx) => idx !== i) }));
  const updateExercise = (i: number, field: keyof TemplateExercise, value: string | number | undefined) =>
    setForm(p => ({ ...p, exercises: p.exercises?.map((e, idx) => idx === i ? { ...e, [field]: value } : e) }));

  // Toggle superset link between exercise at index and the next one
  const toggleSuperset = (index: number) => {
    const exercises = [...(form.exercises || [])];
    if (index >= exercises.length - 1) return; // can't link last exercise forward

    const current = exercises[index];
    const next = exercises[index + 1];
    const groupId = current.supersetGroup;

    if (groupId !== undefined && next.supersetGroup === groupId) {
      // Remove the link
      exercises[index] = { ...current, supersetGroup: undefined };
      exercises[index + 1] = { ...next, supersetGroup: undefined };
    } else {
      // Create a new superset group
      const newGroupId = Date.now();
      exercises[index] = { ...current, supersetGroup: newGroupId };
      exercises[index + 1] = { ...next, supersetGroup: newGroupId };
    }
    setForm(p => ({ ...p, exercises }));
  };

  const isLinkedWithNext = (exercises: TemplateExercise[], index: number): boolean => {
    if (index >= (exercises.length || 0) - 1) return false;
    const cur = exercises[index];
    const nxt = exercises[index + 1];
    return cur.supersetGroup !== undefined && cur.supersetGroup === nxt.supersetGroup;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-teal-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="text-emerald-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('nav.templates')}</p>
              <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('templates.title')}</h1>
              <p className="text-white/40 text-sm">{t('templates.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowImport(!showImport)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-sm px-4 py-2.5 rounded-xl font-semibold transition-all">
                {t('templates.import')}
              </button>
              <button onClick={() => { setShowForm(!showForm); setEditId(null); }} className="btn-primary text-sm py-2.5 px-5">
                {showForm ? t('common.cancel') : t('templates.newTemplate')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6">

        {/* Import */}
        {showImport && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-3">{t('templates.importJson')}</h3>
            <textarea value={importText} onChange={e => setImportText(e.target.value)}
              placeholder={t('templates.importJsonPlaceholder')} rows={5}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 font-mono text-sm focus:ring-2 focus:ring-green-500 mb-3" />
            <div className="flex gap-3">
              <button onClick={handleImport} className="bg-green-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-700">{t('templates.import')}</button>
              <button onClick={() => setShowImport(false)} className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-5 py-2 rounded-lg font-semibold">{t('common.cancel')}</button>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-5">
              {editId ? t('templates.editTemplateTitle') : t('templates.newTemplateTitle')}
            </h2>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.templateName')}</label>
                <input type="text" value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Push Day, Leg Destroyer..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.category')}</label>
                <input type="text" value={form.category || ''} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  placeholder="e.g. Push, Pull, Legs, Custom..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.difficulty')}</label>
                <select value={form.difficulty || 'intermediate'} onChange={e => setForm(p => ({ ...p, difficulty: e.target.value as 'beginner' | 'intermediate' | 'advanced' }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500">
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.estDuration')}</label>
                <input type="number" value={form.estimatedDuration || ''} onChange={e => setForm(p => ({ ...p, estimatedDuration: parseInt(e.target.value) }))}
                  placeholder="45"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('templates.description')}</label>
                <input type="text" value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of this workout..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-green-500" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('templates.colorTheme')}</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${c} ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Exercises with Superset Support */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t('templates.exercises')}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Use ⛓ to link two exercises as a superset (no rest between them)</p>
                </div>
                <button onClick={addExercise} className="text-sm text-green-600 dark:text-green-400 font-medium hover:underline">{t('templates.addExercise')}</button>
              </div>
              <div className="space-y-0">
                {form.exercises?.map((ex, i) => {
                  const linked = isLinkedWithNext(form.exercises || [], i);
                  const inSuperset = ex.supersetGroup !== undefined;
                  return (
                    <div key={i}>
                      <div className={`border rounded-xl p-4 bg-gray-50 dark:bg-slate-800/50 ${
                        inSuperset
                          ? 'border-l-4 border-l-purple-500 border-t border-r border-b border-purple-200 dark:border-purple-700'
                          : 'border dark:border-slate-700'
                      }`}>
                        {inSuperset && (
                          <div className="flex items-center gap-1 mb-2">
                            <span className="text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                              {t('templates.superset')}
                            </span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="col-span-2">
                            <input type="text" value={ex.name} onChange={e => updateExercise(i, 'name', e.target.value)}
                              placeholder={`Exercise ${i + 1} name`}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div>
                            <input type="number" value={ex.sets || ''} onChange={e => updateExercise(i, 'sets', parseInt(e.target.value) || 3)}
                              placeholder="Sets"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div>
                            <input type="number" value={ex.reps || ''} onChange={e => updateExercise(i, 'reps', parseInt(e.target.value))}
                              placeholder="Reps"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div>
                            <input type="number" value={ex.weight || ''} onChange={e => updateExercise(i, 'weight', parseFloat(e.target.value))}
                              placeholder="Weight (kg)"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div>
                            <input type="number" value={ex.restAfter || ''} onChange={e => updateExercise(i, 'restAfter', parseInt(e.target.value) || 60)}
                              placeholder="Rest (sec)"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div>
                            <input type="text" value={ex.notes || ''} onChange={e => updateExercise(i, 'notes', e.target.value)}
                              placeholder="Notes (optional)"
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-green-500" />
                          </div>
                          <div className="flex items-center gap-2">
                            {form.exercises && form.exercises.length > 1 && (
                              <button onClick={() => removeExercise(i)} className="text-red-500 hover:text-red-700 text-sm font-medium">{t('templates.remove')}</button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Superset link toggle between this and next exercise */}
                      {i < (form.exercises?.length || 0) - 1 && (
                        <div className="flex justify-center my-1">
                          <button
                            onClick={() => toggleSuperset(i)}
                            title={linked ? 'Remove superset link' : 'Link as superset with next exercise'}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                              linked
                                ? 'bg-purple-500 text-white hover:bg-purple-600'
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                            }`}
                          >
                            <span>⛓</span>
                            <span>{linked ? t('templates.supersetCheck') : t('templates.linkAsSuperset')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700">
                {editId ? t('templates.updateTemplate') : t('templates.saveTemplate')}
              </button>
              <button onClick={resetForm} className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg font-semibold">{t('common.cancel')}</button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        {templates.length === 0 && !showForm ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t('templates.noTemplatesYet')}</h3>
            <p className="text-gray-500 mb-6">{t('templates.noTemplatesDesc')}</p>
            <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700">{t('templates.createFirst')}</button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => {
              const groups = buildSupersetGroups(template.exercises);
              return (
                <div key={template.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-xl transition-all">
                  <div className={`bg-gradient-to-r ${template.color} p-5 text-white`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold mb-1">{template.name}</h3>
                        <p className="text-white/80 text-sm">{template.category}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/20 font-medium capitalize">{template.difficulty}</span>
                    </div>
                    <div className="flex gap-4 mt-3 text-sm text-white/80">
                      <span>⏱️ {template.estimatedDuration}min</span>
                      <span>💪 {template.exercises.length} exercises</span>
                      <span>🔄 {template.timesUsed}×</span>
                    </div>
                  </div>

                  <div className="p-5">
                    {template.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{template.description}</p>
                    )}

                    {/* Exercise list with superset indicators */}
                    <div className="space-y-1.5 mb-5">
                      {groups.slice(0, 4).map((group, gi) => (
                        <div key={gi}>
                          {group.isSuperset ? (
                            <div className="border-l-2 border-purple-400 pl-2">
                              <div className="text-xs text-purple-500 dark:text-purple-400 font-semibold mb-0.5">{t('templates.superset')}</div>
                              {group.exercises.map((ex, ei) => (
                                <div key={ei} className="flex justify-between text-sm">
                                  <span className="text-gray-700 dark:text-gray-300">{ex.name}</span>
                                  <span className="text-gray-400">{ex.sets}×{ex.reps || '—'}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-300">{group.exercises[0].name}</span>
                              <span className="text-gray-400">{group.exercises[0].sets}×{group.exercises[0].reps || '—'}</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {groups.length > 4 && (
                        <div className="text-xs text-gray-400">{t('templates.moreExercises', { n: template.exercises.length - groups.slice(0, 4).reduce((s, g) => s + g.exercises.length, 0) })}</div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => handleUse(template)} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-green-700">{t('templates.startWorkout')}</button>
                      <button onClick={() => handleEdit(template)} className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm">✏️</button>
                      <button onClick={() => handleExport(template)} className="px-3 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 text-sm">📤</button>
                      <button onClick={() => handleDelete(template.id)} className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-lg hover:bg-red-100 text-sm">🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTemplatesPage;
