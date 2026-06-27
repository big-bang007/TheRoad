/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';

const COUNTRIES = [
  { code: '+98', flag: '🇮🇷', name: 'Iran' },
  { code: '+1',  flag: '🇺🇸', name: 'United States' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom' },
];

export default function NumberInputView({
  title,
  subtitle,
  buttonText,
  initialValue = '',
  onSubmit,
  footerLinkText,
  footerActionText,
  onFooterClick
}) {
  const [countryCode, setCountryCode] = useState('+98');
  
  // 🟢 FIXED: Swapped 'config.code' to 'c.code' to prevent the white screen crash
  const getInitialLocalNumber = () => {
    if (!initialValue) return '';
    const matchedCountry = COUNTRIES.find(c => initialValue.startsWith(c.code));
    if (matchedCountry) {
      return initialValue.replace(matchedCountry.code, '').trim();
    }
    return initialValue;
  };

  const [localNumber, setLocalNumber] = useState(getInitialLocalNumber());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const cleanDigits = localNumber.replace(/\D/g, '');
    if (!cleanDigits) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    try {
      const fullPhoneNumber = `${countryCode}${cleanDigits}`;
      await onSubmit(fullPhoneNumber);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full" id="number-input-view">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-white mb-2 font-display">{title}</h2>
        <p className="text-base text-white/80 font-light">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium tracking-wide text-hygge-cream/95">
            Mobile Number
          </label>
          
          <div className="flex items-center gap-2.5 w-full">
            {/* Country Dropdown Housing */}
            <div className="relative flex items-center bg-[#2f3e40]/45 border border-white/20 rounded-xl px-3 min-w-[95px] h-[58px]">
              <span className="text-xl select-none mr-1.5">{activeCountry.flag}</span>
              <span className="text-base text-white font-medium mr-1">{countryCode}</span>
              
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-black"
                id="country-code-dropdown"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code} className="text-black bg-white">
                    {country.flag} {country.name} ({country.code})
                  </option>
                ))}
              </select>
              <span className="text-white/30 text-xs pointer-events-none ml-auto">▼</span>
            </div>

            {/* Phone Input */}
            <div className="relative flex items-center flex-1 h-[58px]">
              <span className="absolute left-4 text-white/40 pointer-events-none">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="tel"
                value={localNumber}
                onChange={(e) => {
                  setLocalNumber(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. 912 345 6789"
                className={`w-full h-full py-4 pl-12 pr-4 bg-[#2f3e40]/45 border ${
                  error ? 'border-rose-500/50 focus:border-rose-400' : 'border-white/20 focus:border-white/40'
                } rounded-xl text-white placeholder-white/20 text-base focus:bg-[#2f3e40]/70 focus:outline-none transition duration-200`}
                required
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-300 text-sm -mt-2">
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 flex items-center justify-center gap-2 bg-hygge-teal hover:bg-hygge-teal/90 text-white font-bold text-base rounded-xl border border-white/10 shadow-md transform hover:scale-[1.01] active:scale-[0.99] transition duration-200 disabled:opacity-75"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            buttonText
          )}
        </button>
      </form>

      <div className="mt-10 text-center text-sm" id="number-input-footer">
        <span className="text-white/60">{footerLinkText} </span>
        <button
          onClick={onFooterClick}
          type="button"
          className="text-white hover:text-hygge-cream font-semibold underline underline-offset-4 cursor-pointer focus:outline-none"
        >
          {footerActionText}
        </button>
      </div>
    </div>
  );
}