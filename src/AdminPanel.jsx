import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, LogOut, Phone, Calendar, Loader2, ChevronDown } from 'lucide-react';
import { supabase } from './lib/supabase';

const STATUS_CYCLE = ['new', 'contacted', 'closed'];
const STATUS_COLORS = {
  new:       'bg-blue-100 text-blue-700 border-blue-200',
  contacted: 'bg-amber-100 text-amber-700 border-amber-200',
  closed:    'bg-emerald-100 text-emerald-700 border-emerald-200',
};

function StatusBadge({ status, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${STATUS_COLORS[status] || STATUS_COLORS.new}`}
    >
      {status}
    </button>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function AdminPanel({ session, onSignOut }) {
  const [activeTab, setActiveTab] = useState('inquiries');
  const [inquiries, setInquiries] = useState([]);
  const [quizLeads, setQuizLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from('client_inquiries').select('*').order('created_at', { ascending: false }),
      supabase.from('quiz_leads').select('*').order('created_at', { ascending: false }),
    ]).then(([inqRes, quizRes]) => {
      if (cancelled) return;
      if (inqRes.data) setInquiries(inqRes.data);
      if (quizRes.data) setQuizLeads(quizRes.data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const refreshData = () => { setLoading(true); setRefreshKey((k) => k + 1); };

  const cycleStatus = async (table, id, currentStatus) => {
    const idx = STATUS_CYCLE.indexOf(currentStatus);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];

    // Optimistic update
    if (table === 'client_inquiries') {
      setInquiries((prev) => prev.map((r) => r.id === id ? { ...r, status: next } : r));
    } else {
      setQuizLeads((prev) => prev.map((r) => r.id === id ? { ...r, status: next } : r));
    }

    await supabase.from(table).update({ status: next }).eq('id', id);
  };

  const inqCount = inquiries.filter((r) => r.status === 'new').length;
  const quizCount = quizLeads.filter((r) => r.status === 'new').length;

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-5xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
              PamilyaLab · Admin Dashboard
            </p>
            <h2 className="text-white text-2xl font-bold leading-tight">
              Lead Management
            </h2>
            <p className="text-stone-300 text-xs mt-1">
              {session.user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-stone-200">
          <button
            type="button"
            onClick={() => setActiveTab('inquiries')}
            className={`flex-1 py-3.5 text-sm font-bold transition-colors relative ${
              activeTab === 'inquiries' ? 'text-amber-700' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Inquiries
            {inqCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {inqCount}
              </span>
            )}
            {activeTab === 'inquiries' && (
              <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 py-3.5 text-sm font-bold transition-colors relative ${
              activeTab === 'quiz' ? 'text-amber-700' : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            Quiz Leads
            {quizCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold">
                {quizCount}
              </span>
            )}
            {activeTab === 'quiz' && (
              <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : activeTab === 'inquiries' ? (
            inquiries.length === 0 ? (
              <p className="text-center text-stone-400 py-16 text-sm">No inquiries yet.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-left">
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Date</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Name</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Mobile</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Age</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Interests</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Results</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inquiries.map((row) => (
                        <React.Fragment key={row.id}>
                        <tr className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="py-3 text-stone-500 text-xs">{formatDate(row.created_at)}</td>
                          <td className="py-3 font-medium text-stone-800">{row.first_name} {row.last_name}</td>
                          <td className="py-3 text-stone-600">
                            <a href={`tel:${row.mobile}`} className="flex items-center gap-1 hover:text-amber-600">
                              <Phone className="w-3 h-3" /> {row.mobile}
                            </a>
                          </td>
                          <td className="py-3 text-stone-600">{row.age}</td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {(row.interests || []).map((int) => (
                                <span key={int} className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-medium">
                                  {int}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-1">
                              {row.immunity_json && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer hover:scale-105 transition-transform ${
                                    row.immunity_json.score >= 75 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                    row.immunity_json.score >= 45 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                    'bg-red-100 text-red-700 border-red-200'
                                  }`}
                                >
                                  Quiz: {row.immunity_json.score}/{row.immunity_json.maxScore}
                                </button>
                              )}
                              {row.gap_score != null && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  row.gap_score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                  row.gap_score >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                  'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                  Gap: {row.gap_score}%
                                </span>
                              )}
                              {!row.immunity_json && row.gap_score == null && (
                                <span className="text-[10px] text-stone-300">&mdash;</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={row.status} onClick={() => cycleStatus('client_inquiries', row.id, row.status)} />
                          </td>
                        </tr>
                        {expandedId === row.id && row.immunity_json?.answers && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <div className="bg-stone-50 px-6 py-4 border-b border-stone-200">
                                <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest mb-2">Immunity Test Answers</p>
                                <div className="space-y-1.5">
                                  {row.immunity_json.answers.map((ans, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                        ans.pts >= 15 ? 'bg-emerald-500' : ans.pts >= 10 ? 'bg-amber-500' : 'bg-red-500'
                                      }`} />
                                      <div>
                                        <span className="text-stone-400 font-mono">{ans.q}:</span>{' '}
                                        <span className="text-stone-700">{ans.a}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-[10px] text-stone-400 mt-2">
                                  Diagnosis: <span className="font-bold">{row.immunity_json.diagnosis}</span>
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {inquiries.map((row) => (
                    <div key={row.id} className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-stone-800">{row.first_name} {row.last_name}</p>
                        <StatusBadge status={row.status} onClick={() => cycleStatus('client_inquiries', row.id, row.status)} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {row.mobile}</span>
                        <span>Age {row.age}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(row.interests || []).map((int) => (
                          <span key={int} className="px-2 py-0.5 rounded-full bg-white text-stone-600 text-[10px] font-medium border border-stone-200">
                            {int}
                          </span>
                        ))}
                      </div>
                      {(row.immunity_json || row.gap_score != null) && (
                        <div className="flex flex-wrap gap-1.5">
                          {row.immunity_json && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                row.immunity_json.score >= 75 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                row.immunity_json.score >= 45 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                'bg-red-100 text-red-700 border-red-200'
                              }`}
                            >
                              Quiz: {row.immunity_json.score}/{row.immunity_json.maxScore}
                              <ChevronDown className={`inline w-3 h-3 ml-0.5 transition-transform ${expandedId === row.id ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                          {row.gap_score != null && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              row.gap_score >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                              row.gap_score >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                              'bg-red-100 text-red-700 border-red-200'
                            }`}>
                              Gap: {row.gap_score}%
                            </span>
                          )}
                        </div>
                      )}
                      {expandedId === row.id && row.immunity_json?.answers && (
                        <div className="bg-white rounded-xl border border-stone-200 p-3 space-y-1.5">
                          <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Immunity Answers</p>
                          {row.immunity_json.answers.map((ans, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                ans.pts >= 15 ? 'bg-emerald-500' : ans.pts >= 10 ? 'bg-amber-500' : 'bg-red-500'
                              }`} />
                              <div>
                                <span className="text-stone-400 font-mono">{ans.q}:</span>{' '}
                                <span className="text-stone-700">{ans.a}</span>
                              </div>
                            </div>
                          ))}
                          <p className="text-[10px] text-stone-400 mt-1">
                            Diagnosis: <span className="font-bold">{row.immunity_json.diagnosis}</span>
                          </p>
                        </div>
                      )}
                      {row.message && (
                        <p className="text-xs text-stone-500 italic">&ldquo;{row.message}&rdquo;</p>
                      )}
                      <p className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(row.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            quizLeads.length === 0 ? (
              <p className="text-center text-stone-400 py-16 text-sm">No quiz leads yet.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-left">
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Date</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Name</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Mobile</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Score</th>
                        <th className="py-2.5 text-xs font-mono text-stone-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quizLeads.map((row) => (
                        <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="py-3 text-stone-500 text-xs">{formatDate(row.created_at)}</td>
                          <td className="py-3 font-medium text-stone-800">{row.first_name || '—'}</td>
                          <td className="py-3 text-stone-600">
                            {row.mobile ? (
                              <a href={`tel:${row.mobile}`} className="flex items-center gap-1 hover:text-amber-600">
                                <Phone className="w-3 h-3" /> {row.mobile}
                              </a>
                            ) : '—'}
                          </td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              row.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                              row.score >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {row.score}/100
                            </span>
                          </td>
                          <td className="py-3">
                            <StatusBadge status={row.status || 'new'} onClick={() => cycleStatus('quiz_leads', row.id, row.status || 'new')} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {quizLeads.map((row) => (
                    <div key={row.id} className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-stone-800">{row.first_name || '—'}</p>
                        <StatusBadge status={row.status || 'new'} onClick={() => cycleStatus('quiz_leads', row.id, row.status || 'new')} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-stone-500">
                        {row.mobile && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {row.mobile}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                          row.score >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          Score: {row.score}/100
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(row.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
