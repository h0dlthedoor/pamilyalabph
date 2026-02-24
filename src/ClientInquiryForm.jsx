import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User, Phone, Hash, MessageSquare, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabase';
import { testimonials } from './testimonials';

const INTEREST_OPTIONS = [
  'Life Insurance',
  'Health Coverage',
  'Emergency Fund',
  'Retirement Planning',
  'Investment/VUL',
];

export default function ClientInquiryForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTestimonialIdx((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const toggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const validate = () => {
    if (!firstName.trim() || !lastName.trim()) return 'Pakilagay ang pangalan mo.';
    if (!/^09\d{9}$/.test(mobile)) return 'Invalid mobile number. Use 09XX format (11 digits).';
    const ageNum = Number(age);
    if (!age || ageNum < 18 || ageNum > 99) return 'Age must be between 18 and 99.';
    if (interests.length === 0) return 'Pumili ng kahit isang interest.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    const { error: dbError } = await supabase.from('client_inquiries').insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      mobile: mobile.trim(),
      age: Number(age),
      interests,
      message: message.trim() || null,
    });

    setSubmitting(false);
    if (dbError) {
      setError('Something went wrong. Please try again.');
      return;
    }
    setSubmitted(true);
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
            PamilyaLab · Kumunsulta
          </p>
          <h2 className="text-white text-2xl font-bold leading-tight">
            Mag-inquire ngayon — Libre lang!
          </h2>
          <p className="text-stone-300 text-sm mt-1">
            I-submit ang form at makikipag-ugnayan si Kris sa&apos;yo within 24 hours.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5 py-8"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-stone-900 mb-2">Salamat, {firstName}!</h3>
                <p className="text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
                  Na-receive na namin ang inquiry mo. Si Kris ay makikipag-ugnayan sa&apos;yo within 24 hours via call or text.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="py-3 px-8 rounded-xl text-sm font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 border border-stone-200 transition-all"
              >
                Mag-submit ulit
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  Anong gusto mong malaman? <span className="text-stone-400">(pumili ng isa o higit pa)</span>
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
                    placeholder="May tanong ka ba o gusto mong i-share?"
                    rows={3}
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
                className="cta-pulse w-full py-4 px-6 rounded-xl font-bold text-stone-900 bg-amber-400 hover:bg-amber-300 border border-amber-300 shadow-md hover:shadow-lg transition-all duration-200 text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:animate-none flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
                ) : (
                  <><UserPlus className="w-5 h-5" /> I-submit ang Inquiry</>
                )}
              </button>

              {/* Privacy + Testimonial */}
              <p className="text-[10px] text-stone-400 text-center">
                100% confidential. Your info is only used by your PamilyaLab advisor.
              </p>

              <div className="hidden md:block bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 text-center space-y-3">
                <p className="text-stone-900 font-bold text-base">
                  Bakit mag-inquire sa PamilyaLab?
                </p>
                <p className="text-amber-700 text-xs leading-relaxed">
                  No-obligation consultation with a licensed Pru Life UK advisor — get a clear picture of your family&apos;s financial health.
                </p>
                <div className="py-2 min-h-[52px]">
                  <p className="text-stone-500 text-xs italic leading-relaxed">
                    &ldquo;{testimonials[testimonialIdx].quote}&rdquo;
                  </p>
                  <p className="text-stone-400 text-[10px] mt-1 font-medium">
                    — {testimonials[testimonialIdx].name}, {testimonials[testimonialIdx].age}, {testimonials[testimonialIdx].city}
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
