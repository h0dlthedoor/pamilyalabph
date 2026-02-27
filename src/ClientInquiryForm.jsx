import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User, Phone, Hash, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { playSuccess } from './sounds';

const INTEREST_OPTIONS = [
  'Life Insurance',
  'Health Coverage',
  'Emergency Fund',
  'Retirement Planning',
  'Investment/VUL',
];

export default function ClientInquiryForm({ immunityData, gapData }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) return 'Please enter your name.';
    if (!/^09\d{9}$/.test(mobile)) return 'Invalid mobile number. Use 09XX format (11 digits).';
    const ageNum = Number(age);
    if (!age || ageNum < 18 || ageNum > 99) return 'Age must be between 18 and 99.';
    if (interests.length === 0) return 'Please select at least one interest.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    const payload = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile: mobile.trim(),
      age: Number(age),
      interests,
      message: message.trim() || null,
      immunity_json: immunityData || null,
      gap_score: gapData?.overallScore ?? null,
    };

    const { error: dbError } = await supabase.from('client_inquiries').insert(payload);

    setSubmitting(false);
    if (dbError) {
      setError('Something went wrong. Please try again.');
      return;
    }

    playSuccess();
    setSubmitted(true);

    // Fire-and-forget email notification to Kris
    supabase.functions.invoke('notify-inquiry', {
      body: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
        age: Number(age),
        interests,
        message: message.trim() || null,
        immunityData: immunityData || null,
        gapScore: gapData?.overallScore ?? null,
      },
    }).catch(() => {});
  };

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setMobile('');
    setAge('');
    setInterests([]);
    setMessage('');
    setSubmitted(false);
    setError('');
  };

  const inputCls = "w-full bg-white border-2 border-stone-200 text-stone-800 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors";

  return (
    <div className="h-full flex items-center justify-center p-4 overflow-x-hidden">
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 px-8 py-5">
          <p className="text-amber-400 text-xs font-mono uppercase tracking-widest mb-1">
            PamilyaLab · Inquire
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            Inquire Now — It's Free!
          </h2>
          <p className="text-stone-300 text-sm mt-1">
            Submit the form and Kris will reach out within 24 hours.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center space-y-5 py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-black text-stone-900 mb-2">Thank you, {firstName}!</h3>
                <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
                  We've received your inquiry. Kris will reach out within 24 hours via call or text.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-8 rounded-xl text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all"
              >
                Submit Another Inquiry
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Attached data banner */}
              {(immunityData || gapData) && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-mono text-amber-600 uppercase tracking-widest">Attached to your inquiry</p>
                  <div className="flex flex-wrap gap-2">
                    {immunityData && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        immunityData.score >= 75 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        immunityData.score >= 45 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        Immunity: {immunityData.score}/{immunityData.maxScore}
                      </span>
                    )}
                    {gapData && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        gapData.overallScore >= 80 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        gapData.overallScore >= 40 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        Coverage: {gapData.overallScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-amber-600">Your results will be shared with your advisor so they can prepare for your discussion.</p>
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1.5">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Juan"
                      maxLength={100}
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Dela Cruz"
                    maxLength={100}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Mobile + Age */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1.5">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="09XXXXXXXXX"
                      maxLength={11}
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-stone-600 block mb-1.5">Age</label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="number"
                      min="18"
                      max="99"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="25"
                      className={`${inputCls} pl-10`}
                    />
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-2">
                  What would you like to know? <span className="text-stone-400">(select one or more)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                        interests.includes(item)
                          ? 'bg-amber-400 border-amber-400 text-stone-900'
                          : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:text-amber-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-stone-600 block mb-1.5">
                  Message <span className="text-stone-400">(optional)</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Any questions or anything you'd like to share?"
                    rows={3}
                    maxLength={2000}
                    className={`${inputCls} pl-10 resize-none`}
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-600 font-medium bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="cta-pulse w-full py-4 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none flex items-center justify-center gap-2 active:scale-95"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><UserPlus className="w-5 h-5" /> Submit Inquiry</>
                )}
              </button>

              {/* Privacy */}
              <p className="text-[10px] text-stone-400 text-center">
                100% confidential. Your info is only used by your PamilyaLab advisor.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
