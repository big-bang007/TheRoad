/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Phone, Calendar, Shield, Award, Edit2, Check, Sparkles, LogOut } from 'lucide-react';

export default function ProfileTab({ user, onUpdateProfile, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateProfile({
      name,
      phone,
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6" id="profile-tab-container">
      {/* Intro visual banner */}
      <div className="flex items-center justify-between px-1">
        <h4 className="font-bold text-base text-white tracking-tight">
          Hygge User Profile
        </h4>
        <span className="text-xs bg-hygge-teal/20 text-hygge-cream px-2.5 py-1 rounded-full font-medium">Account Center</span>
      </div>

      {/* Main card */}
      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col items-center">
        {/* Avatar badge */}
        <div className="relative mb-4">
          <div className="w-20 h-20 bg-gradient-to-tr from-hygge-forest to-hygge-sage rounded-3xl flex items-center justify-center text-white text-3xl font-bold font-display shadow-md">
            {user.name ? user.name.slice(0, 2).toUpperCase() : 'ME'}
          </div>
          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-white border-2 border-white/20 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-white" />
          </div>
        </div>

        {/* Display name and status */}
        <h3 className="text-xl font-bold text-white font-display">{user.name || 'Friend'}</h3>
        <p className="text-xs text-hygge-cream font-semibold tracking-widest uppercase mt-1">{user.hyggeLevel}</p>

        {/* Level bar progress */}
        <div className="w-full mt-4 bg-white/5 rounded-2xl p-3 border border-white/10 text-center">
          <div className="flex items-center justify-between text-[11px] text-white/50 font-bold mb-1 font-mono">
            <span>EXPERIENCE LEVEL V</span>
            <span>{user.cozyScore}% OVERALL</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-hygge-teal rounded-full" style={{ width: `${user.cozyScore}%` }} />
          </div>
        </div>
      </div>

      {/* Save alert */}
      {saveSuccess && (
        <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-2xl border border-emerald-500/20 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile saved successfully!</span>
        </div>
      )}

      {/* Account Info Details form */}
      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
          <h4 className="font-bold text-sm text-white">Personal Information</h4>
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                // reset form values
                setName(user.name);
                setPhone(user.phone);
                setIsEditing(false);
              } else {
                setIsEditing(true);
              }
            }}
            className="text-xs text-hygge-cream hover:text-white font-semibold transition flex items-center gap-1 cursor-pointer"
          >
            <Edit2 className="w-3" />
            <span>{isEditing ? 'Cancel' : 'Edit info'}</span>
          </button>
        </div>

        {!isEditing ? (
          <div className="flex flex-col gap-4 text-sm" id="profile-fields-static">
            <div className="flex items-center justify-between py-1">
              <span className="text-white/50 flex items-center gap-2">
                <User className="w-4 h-4 text-hygge-cream" />
                <span>Full Name</span>
              </span>
              <span className="font-bold text-white">{user.name}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-white/50 flex items-center gap-2">
                <Phone className="w-4 h-4 text-hygge-cream" />
                <span>Mobile Number</span>
              </span>
              <span className="font-bold text-white">{user.phone}</span>
            </div>

            <div className="flex items-center justify-between py-1">
              <span className="text-white/50 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-hygge-cream" />
                <span>Joined Date</span>
              </span>
              <span className="font-bold text-white">{user.joinDate}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4 text-sm" id="profile-fields-form">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-name" className="text-xs font-bold text-white/60 tracking-wider uppercase">Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-2.5 px-3 bg-white/5 border border-white/20 rounded-xl text-white font-medium focus:border-hygge-teal focus:outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="edit-phone" className="text-xs font-bold text-white/60 tracking-wider uppercase">Phone</label>
              <input
                id="edit-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full py-2.5 px-3 bg-white/5 border border-white/20 rounded-xl text-white font-medium focus:border-hygge-teal focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              className="mt-2 w-full py-2.5 bg-hygge-teal hover:bg-hygge-teal/90 text-white font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </form>
        )}
      </div>

      {/* Achievements / Credentials list */}
      <div className="bg-[#2f3e40]/60 border border-white/10 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
        <h4 className="font-bold text-sm text-white mb-1">Cozy Accoutrements</h4>
        
        <div className="flex items-center gap-3.5 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-white">Danish Hearth Seeker</h5>
            <p className="text-xs text-white/60 font-light mt-0.5">Awarded for reaching 5 consistent days on your daily streak.</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-hygge-teal/20 text-hygge-cream flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h5 className="font-bold text-sm text-white">Parasympathetic Guardian</h5>
            <p className="text-xs text-white/60 font-light mt-0.5">Granted when score passes over 70% inside assessments.</p>
          </div>
        </div>
      </div>

      {/* Logout button */}
      <button
        onClick={onLogout}
        className="w-full py-4 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 font-semibold text-sm rounded-xl transition flex items-center justify-center gap-2 cursor-pointer mt-2"
        id="profile-logout-button"
      >
        <LogOut className="w-4 h-4" />
        <span>Log Out Account</span>
      </button>
    </div>
  );
}
