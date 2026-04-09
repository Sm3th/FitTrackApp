import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';

interface Tip {
  id: string;
  title: string;
  content: string;
  icon: string;
  category: string;
  tags: string[];
}

const TIPS: Tip[] = [
  // Training
  { id: 't1', title: 'Progressive Overload is King', category: 'Training', icon: '📈', tags: ['strength', 'muscle'],
    content: 'The #1 principle for getting stronger and bigger. Each week, try to add a small amount of weight, do one more rep, or one more set compared to last week. Even 1.25 kg per week means 60 kg more in a year. Track your lifts and celebrate every small PR.' },
  { id: 't2', title: 'Compound Before Isolation', category: 'Training', icon: '🏋️', tags: ['efficiency', 'strength'],
    content: 'Start your workout with heavy compound movements (Squat, Deadlift, Bench Press, Row) when your energy is highest. Finish with isolation exercises (curls, raises, extensions). This maximizes strength gains and overall muscle development.' },
  { id: 't3', title: 'Train Each Muscle 2x Per Week', category: 'Training', icon: '🔄', tags: ['frequency', 'muscle'],
    content: 'Research shows training each muscle group twice per week produces better results than once per week. A Push/Pull/Legs routine done 6 days per week, or an Upper/Lower split done 4 days, are great ways to hit this frequency.' },
  { id: 't4', title: 'Rest Periods Matter', category: 'Training', icon: '⏱️', tags: ['recovery', 'strength'],
    content: 'For heavy compound lifts (3–5 rep range), rest 3–5 minutes between sets for full strength recovery. For hypertrophy work (8–12 reps), 60–90 seconds is ideal. Cardio and circuit training typically use 30–60 second rests.' },
  { id: 't5', title: 'Mind-Muscle Connection', category: 'Training', icon: '🧠', tags: ['technique', 'muscle'],
    content: 'Actively think about the muscle you\'re working during each rep. Research shows this increases muscle activation significantly. Slow down, use a full range of motion, and visualize the muscle contracting and stretching.' },
  { id: 't6', title: 'Deload Every 4–8 Weeks', category: 'Training', icon: '😴', tags: ['recovery', 'longevity'],
    content: 'A deload week (50–60% of normal volume and intensity) allows your joints, tendons, and nervous system to recover. Signs you need a deload: persistent fatigue, stalled progress, poor sleep, or lack of motivation.' },
  { id: 't7', title: 'Warm Up Properly', category: 'Training', icon: '🔥', tags: ['safety', 'performance'],
    content: 'Never skip your warm-up. Start with 5–10 minutes of light cardio, then do 2–3 warm-up sets with lighter weights before your working sets. This increases blood flow, activates the nervous system, and dramatically reduces injury risk.' },
  // Nutrition
  { id: 'n1', title: 'Protein: The Most Important Macro', category: 'Nutrition', icon: '🥩', tags: ['muscle', 'diet'],
    content: 'Aim for 1.6–2.2g of protein per kg of bodyweight daily. Best sources: chicken breast, eggs, Greek yogurt, fish, cottage cheese, lean beef, tofu, legumes. Spread protein across 3–5 meals for optimal muscle protein synthesis.' },
  { id: 'n2', title: 'Calories In vs Calories Out', category: 'Nutrition', icon: '⚖️', tags: ['weight', 'diet'],
    content: 'To gain muscle: eat 200–300 calories above TDEE. To lose fat: eat 300–500 calories below TDEE. To maintain: eat at TDEE. Use the calculators page to find your TDEE. Weigh yourself weekly (same time, same conditions) to track trends.' },
  { id: 'n3', title: 'Pre-Workout Nutrition', category: 'Nutrition', icon: '🍌', tags: ['performance', 'energy'],
    content: 'Eat a meal with carbs and protein 1–2 hours before training. Good options: rice + chicken, oats + protein powder, banana + peanut butter. Carbs fuel your workout; protein prevents muscle breakdown.' },
  { id: 'n4', title: 'Post-Workout Nutrition', category: 'Nutrition', icon: '🥤', tags: ['recovery', 'muscle'],
    content: 'The post-workout window is most important for recovery. Consume 20–40g of protein and some carbs within 30–60 minutes after training. Options: protein shake + banana, chicken + rice, Greek yogurt + fruit.' },
  { id: 'n5', title: 'Hydration is Performance', category: 'Nutrition', icon: '💧', tags: ['hydration', 'performance'],
    content: 'Even mild dehydration (2% body weight) significantly impairs strength and endurance. Aim for 2–3 liters of water daily, more on training days. Drink 500ml 30 minutes before training and sip throughout your workout.' },
  { id: 'n6', title: 'Don\'t Fear Carbs', category: 'Nutrition', icon: '🍚', tags: ['energy', 'diet'],
    content: 'Carbohydrates are your muscles\' primary fuel source for lifting. Don\'t cut them too low if you train intensely. Focus on quality sources: rice, oats, sweet potatoes, fruit. Save simple carbs (fruit, rice cakes) for around workout time.' },
  // Recovery
  { id: 'r1', title: 'Sleep is Your Secret Weapon', category: 'Recovery', icon: '😴', tags: ['recovery', 'muscle'],
    content: 'Growth hormone peaks during deep sleep. Athletes need 7–9 hours per night for optimal recovery and muscle growth. Poor sleep increases cortisol (muscle-destroying hormone) and decreases testosterone. Prioritize sleep above everything.' },
  { id: 'r2', title: 'Active Recovery Days', category: 'Recovery', icon: '🚶', tags: ['recovery', 'mobility'],
    content: 'Light activity on rest days (20–30 min walk, yoga, swimming) improves blood flow and reduces soreness without adding fatigue. It\'s better than complete rest for most people. Save true rest days when you\'re really fatigued.' },
  { id: 'r3', title: 'Stretching & Mobility', category: 'Recovery', icon: '🧘', tags: ['flexibility', 'injury prevention'],
    content: 'Static stretching post-workout, dynamic stretching pre-workout. Focus on problem areas: hip flexors (from sitting), thoracic spine, ankle mobility (for squats). 10–15 minutes of mobility work daily pays huge dividends long-term.' },
  { id: 'r4', title: 'Cold/Heat Therapy', category: 'Recovery', icon: '🧊', tags: ['recovery', 'inflammation'],
    content: 'Cold therapy (ice bath, cold shower): reduces acute inflammation and soreness after intense training. Heat therapy (sauna, hot bath): improves blood flow and relaxes tight muscles. Contrast therapy (alternating hot/cold) is particularly effective.' },
  { id: 'r5', title: 'Manage Stress', category: 'Recovery', icon: '🧠', tags: ['mental health', 'cortisol'],
    content: 'High chronic stress raises cortisol, which breaks down muscle tissue and impairs recovery. Meditation, deep breathing, and time in nature reduce cortisol. Even 10 minutes of mindfulness daily can significantly improve recovery quality.' },
  // Form & Safety
  { id: 'f1', title: 'Ego is the Enemy', category: 'Form & Safety', icon: '⚠️', tags: ['safety', 'injury prevention'],
    content: 'The biggest cause of gym injuries is lifting too heavy with poor form. Always prioritize form over weight. Drop the ego, perfect your technique with lighter weights, then progress. One injury can set you back months.' },
  { id: 'f2', title: 'Record Your Sets', category: 'Form & Safety', icon: '📱', tags: ['technique', 'improvement'],
    content: 'Film yourself from the side occasionally to check your form. What you feel and what\'s actually happening are often different. Video review is the fastest way to catch form errors like knee caving, forward lean, or rounded lower back.' },
  { id: 'f3', title: 'Use a Spotter for Heavy Lifts', category: 'Form & Safety', icon: '🤝', tags: ['safety', 'heavy lifting'],
    content: 'For any lift you might fail (bench press, squat), use a spotter or safety bars. Never bench press alone without a spotter or set safety pins. It\'s not worth the risk.' },
  { id: 'f4', title: 'Pain vs. Discomfort', category: 'Form & Safety', icon: '🩺', tags: ['safety', 'injury'],
    content: 'Muscle burn and fatigue during exercise = good. Sharp, joint, or shooting pain = stop immediately. If you feel pain in a joint, don\'t "work through it." Rest, ice, and see a physiotherapist. Training through pain usually makes it worse.' },
  { id: 'f5', title: 'Learn the Hip Hinge', category: 'Form & Safety', icon: '🏆', tags: ['technique', 'deadlift', 'squat'],
    content: 'The hip hinge is the foundation of safe pulling movements. Stand with feet shoulder-width, soften knees slightly, push your hips back (as if trying to touch a wall behind you) while keeping your spine neutral. Practice with a broomstick on your back.' },
  // Mindset
  { id: 'm1', title: 'Consistency Beats Perfection', category: 'Mindset', icon: '📅', tags: ['habits', 'motivation'],
    content: 'Showing up 3–4 times per week for years beats the perfect program you\'ll quit after a month. A "bad" workout is infinitely better than no workout. On low-energy days, just commit to getting to the gym — the workout usually takes care of itself.' },
  { id: 'm2', title: 'Track Everything', category: 'Mindset', icon: '📊', tags: ['progress', 'data'],
    content: 'What gets measured gets managed. Log your workouts, food, sleep, and measurements. Looking back at your progress after 6–12 months is one of the most motivating things you can do. Past-you did the hard work. Future-you will be grateful.' },
  { id: 'm3', title: 'Find Your Why', category: 'Mindset', icon: '🎯', tags: ['motivation', 'goals'],
    content: 'The best exercise is the one you\'ll actually do. Find what you genuinely enjoy — whether that\'s powerlifting, bodybuilding, CrossFit, or home workouts. Your deeper "why" (health, confidence, energy, longevity) will carry you through hard days.' },
];

const CATEGORIES = ['All', 'Training', 'Nutrition', 'Recovery', 'Form & Safety', 'Mindset'];
const CATEGORY_ICONS: Record<string, string> = {
  Training: '🏋️', Nutrition: '🥗', Recovery: '😴', 'Form & Safety': '⚠️', Mindset: '🧠',
};
const CATEGORY_COLORS: Record<string, string> = {
  Training: 'from-blue-500 to-indigo-500',
  Nutrition: 'from-green-500 to-teal-500',
  Recovery: 'from-purple-500 to-pink-500',
  'Form & Safety': 'from-red-500 to-orange-500',
  Mindset: 'from-yellow-500 to-orange-500',
};

const WorkoutTipsPage: React.FC = () => {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = TIPS.filter(tip => {
    const matchesCat = activeCategory === 'All' || tip.category === activeCategory;
    const matchesSearch = !searchQuery ||
      tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tip.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />

      {/* Header */}
      <div className="relative bg-slate-950 overflow-hidden py-12">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-600/20 to-rose-600/10" />
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-pink-400 text-sm font-semibold uppercase tracking-widest mb-2">{t('tips.knowledge')}</p>
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">{t('tips.title')}</h1>
          <p className="text-white/40 text-sm">{t('tips.subtitle')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 sm:py-8 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="relative mb-5">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('tips.searchPlaceholder')}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-pink-400 focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {cat !== 'All' && CATEGORY_ICONS[cat] + ' '}
              {cat === 'All' ? t('tips.all') : cat}
            </button>
          ))}
        </div>

        {/* Category Banner */}
        {activeCategory !== 'All' && (
          <div className={`bg-gradient-to-r ${CATEGORY_COLORS[activeCategory]} text-white rounded-2xl p-5 mb-6`}>
            <div className="text-3xl mb-1">{CATEGORY_ICONS[activeCategory]}</div>
            <h2 className="text-xl font-bold">{activeCategory}</h2>
            <p className="text-white/80 text-sm">{t('tips.tipsInCategory', { n: filtered.length })}</p>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <div className="text-5xl mb-3">🔍</div>
            <p>{t('tips.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(tip => (
              <div
                key={tip.id}
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === tip.id ? null : tip.id)}
                  className="w-full text-left p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 bg-gradient-to-br ${CATEGORY_COLORS[tip.category]} rounded-xl flex items-center justify-center text-xl shrink-0`}>
                      {tip.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{tip.title}</h3>
                        <span className="text-gray-400 dark:text-gray-500 text-lg shrink-0">
                          {expandedId === tip.id ? '▲' : '▼'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{CATEGORY_ICONS[tip.category]} {tip.category}</span>
                        <div className="flex gap-1">
                          {tip.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {expandedId === tip.id && (
                  <div className="px-5 pb-5">
                    <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{tip.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTipsPage;
