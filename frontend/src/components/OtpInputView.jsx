import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export default function OtpInputView({ 
  title, 
  subtitle, 
  buttonText, 
  onSubmit, 
  onResend, 
  resendPrompt = "Didn't receive a code?", 
  resendActionText = "Resend",
  initialTimer = 60 // 🟢 Added this so you can control it from the parent!
}) {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // 🟢 Timer starts at whatever initialTimer is set to (defaults to 60)
  const [timeLeft, setTimeLeft] = useState(initialTimer);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    try {
      await onSubmit(code);
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (timeLeft > 0 || isSubmitting) return;
    
    try {
      await onResend(); // 🟢 Ensure the parent passes a working API call here!
      setTimeLeft(60); // Reset back to 60 after a successful resend
      setError('');    
    } catch (err) {
      setError('Failed to send a new code. Please try again.');
    }
  };

  return (
    <div className="flex flex-col w-full" id="otp-input-view">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white mb-2 font-display">{title}</h2>
        <p className="text-base text-white/80 font-light">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <input
          type="text"
          maxLength={6}
          value={code}
          onChange={(e) => { setCode(e.target.value); if (error) setError(''); }}
          placeholder="e.g. 123456"
          className={`w-full py-4 px-4 bg-[#2f3e40]/60 border rounded-xl text-white placeholder-white/20 text-center text-xl tracking-[0.5em] focus:outline-none transition-colors ${error ? 'border-rose-500/50 focus:border-rose-400' : 'border-white/10 focus:border-white/30'}`}
        />

        {error && (
          <div className="flex items-center gap-2 text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className="w-full py-4 flex items-center justify-center gap-2 bg-hygge-teal hover:bg-hygge-teal/90 text-white font-bold text-base rounded-xl transition duration-200 disabled:opacity-70">
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</> : buttonText}
        </button>
      </form>

      {/* --- Upgraded Timer & Recover Footer --- */}
      <div className="mt-8 text-center text-sm">
        <span className="text-white/60">{resendPrompt} </span>
        {timeLeft > 0 ? (
          <span className="text-white/40 font-mono ml-1">
            Wait {timeLeft}s
          </span>
        ) : (
          <button 
            onClick={handleResend} 
            disabled={isSubmitting} 
            className="text-white hover:text-hygge-cream font-semibold underline underline-offset-4 disabled:opacity-50 ml-1 transition"
          >
            {resendActionText}
          </button>
        )}
      </div>
    </div>
  );
}