import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { haptic } from '../sounds';

const MAX_REQUESTS = 3;
const SESSION_KEY = 'ai-rec-count';

function getRequestCount() {
  return parseInt(sessionStorage.getItem(SESSION_KEY) || '0', 10);
}

function incrementRequestCount() {
  const count = getRequestCount() + 1;
  sessionStorage.setItem(SESSION_KEY, String(count));
  return count;
}

export default function AIRecommendation({ gapData, immunityData }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateRecommendation = useCallback(async () => {
    if (getRequestCount() >= MAX_REQUESTS) {
      setError('You\'ve reached the maximum of 3 AI analyses per session. Refresh the page to reset.');
      return;
    }

    haptic(12);
    setLoading(true);
    setError('');
    setText('');

    try {
      // Build context from available data
      const context = [];
      if (gapData) {
        context.push(`Coverage Gap Analysis: Overall score ${gapData.overallScore || 'N/A'}%`);
        if (gapData.pillars) {
          gapData.pillars.forEach(p => {
            context.push(`- ${p.name}: ${p.coverage || 0}% covered (Gap: \u20B1${(p.gap || 0).toLocaleString()})`);
          });
        }
      }
      if (immunityData) {
        context.push(`Financial Immunity Score: ${immunityData.score || 'N/A'}/100`);
        if (immunityData.answers) {
          immunityData.answers.forEach(a => {
            context.push(`- ${a.category}: ${a.text}`);
          });
        }
      }

      // Since we don't have a backend AI endpoint yet, generate a smart local recommendation
      // This can be replaced with a Supabase Edge Function calling Claude API later
      const recommendation = generateLocalRecommendation(gapData, immunityData);

      // Simulate typewriter effect
      for (let i = 0; i <= recommendation.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 12));
        setText(recommendation.slice(0, i));
      }

      incrementRequestCount();
      setHasGenerated(true);
    } catch (err) {
      setError('Unable to generate recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [gapData, immunityData]);

  return (
    <div className="mt-6 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-950/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h4 className="font-bold text-stone-800 dark:text-stone-200 text-sm">AI-Powered Analysis</h4>
        <span className="ml-auto text-[10px] font-mono text-stone-400">
          {getRequestCount()}/{MAX_REQUESTS} used
        </span>
      </div>

      {!hasGenerated && !loading && (
        <button
          onClick={generateRecommendation}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:from-amber-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2 touch-feedback"
        >
          <Sparkles className="w-4 h-4" />
          Get Personalized Recommendation
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm py-3">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing your financial profile...
        </div>
      )}

      <AnimatePresence>
        {text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line"
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>

      {hasGenerated && !loading && (
        <button
          onClick={generateRecommendation}
          className="mt-3 text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}

// Local recommendation engine (replace with Claude API edge function later)
function generateLocalRecommendation(gapData, immunityData) {
  const parts = [];

  if (immunityData && immunityData.score !== undefined) {
    const score = immunityData.score;
    if (score >= 75) {
      parts.push("Your financial immunity is strong \u2014 you've built solid protection across most areas. Focus now on optimizing what you have: review your coverage amounts annually and ensure they keep pace with inflation and life changes.");
    } else if (score >= 45) {
      parts.push("Your financial immunity is moderate \u2014 you have some protection in place, but there are gaps that could leave your family vulnerable during a crisis. The good news: targeted action on 1\u20132 areas can significantly improve your position.");
    } else {
      parts.push("Your financial immunity needs immediate attention. Without adequate coverage, a single medical emergency or unexpected event could create serious financial hardship for your family. The priority is establishing basic protection first.");
    }
  }

  if (gapData && gapData.pillars) {
    const weakest = [...gapData.pillars].sort((a, b) => (a.coverage || 0) - (b.coverage || 0));
    const critical = weakest.filter(p => (p.coverage || 0) < 50);

    if (critical.length > 0) {
      parts.push("\n\nPriority areas to address:");
      critical.forEach((p, i) => {
        const gap = p.gap ? `\u20B1${p.gap.toLocaleString()}` : 'unknown';
        parts.push(`${i + 1}. ${p.name} \u2014 currently ${p.coverage || 0}% covered (gap: ${gap})`);
      });
    }

    if (weakest.length > 0 && weakest[0].name) {
      parts.push(`\n\nRecommended first step: Start with ${weakest[0].name.toLowerCase()} \u2014 this is your biggest vulnerability. Even partial coverage here would meaningfully reduce your family's risk.`);
    }
  }

  if (parts.length === 0) {
    parts.push("Based on your profile, I recommend starting with a comprehensive needs analysis. Understanding your specific gaps is the first step toward building the right protection for your family.\n\nTap 'Inquire' to connect with Kris for a personalized, no-pressure consultation.");
  }

  parts.push("\n\n\u2014 This analysis is for educational purposes. For personalized advice, consult with Kris directly.");

  return parts.join('');
}
