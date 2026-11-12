import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { COUNTRY_CODES } from '../utils/countryCodes';
import '../styles/Profile.css';

function Profile({ onUserUpdate }) {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
  const [name, setName] = useState(user.name || '');
  const [countryCode, setCountryCode] = useState('+60');
  const [localPhone, setLocalPhone] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Profile Feedback
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password & OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    api.get('/profile').then((res) => {
      const freshUser = res.data.user;
      setUser(freshUser);
      setName(freshUser.name || '');
      localStorage.setItem('user', JSON.stringify(freshUser));
      if (onUserUpdate) onUserUpdate(freshUser);

      const rawPhone = freshUser.phone_number || '';
      if (rawPhone.startsWith('+')) {
        const found = COUNTRY_CODES.find((c) => rawPhone.startsWith(c.code));
        if (found) {
          setCountryCode(found.code);
          setLocalPhone(rawPhone.slice(found.code.length));
        } else {
          setLocalPhone(rawPhone);
        }
      } else {
        setLocalPhone(rawPhone.replace(/^0+/, ''));
      }
    });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    setSavingProfile(true);

    const formData = new FormData();
    formData.append('name', name);

    const cleanLocal = localPhone.replace(/^0+/, '');
    const formattedPhone = cleanLocal ? `${countryCode}${cleanLocal}` : '';
    formData.append('phone_number', formattedPhone);

    if (profileImageFile) {
      formData.append('profile_image', profileImageFile);
    }

    try {
      const res = await api.post('/profile/update', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      if (onUserUpdate) onUserUpdate(updatedUser);
      setProfileImageFile(null);
      setProfileMsg(res.data.message || 'Profile updated!');
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendOtp = async () => {
    setPasswordMsg('');
    setPasswordErr('');
    setSendingOtp(true);

    try {
      const res = await api.post('/profile/send-otp');
      setOtpSent(true);
      setPasswordMsg(res.data.message);
    } catch (err) {
      setPasswordErr(err.response?.data?.message || 'Failed to send OTP email.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword !== confirmPassword) {
      setPasswordErr('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.post('/profile/change-password', {
        otp,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      setPasswordMsg(res.data.message);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setOtpSent(false);
    } catch (err) {
      const validationErrors = err.response?.data?.errors;
      if (validationErrors) {
        setPasswordErr(Object.values(validationErrors).flat()[0]);
      } else {
        setPasswordErr(err.response?.data?.message || 'Failed to change password.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const currentAvatar = previewUrl
    ? previewUrl
    : user.profile_image && user.profile_image !== 'default.png'
      ? `http://127.0.0.1:8000/storage/${user.profile_image}`
      : 'https://via.placeholder.com/110?text=User';

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>
      <p className="profile-subtitle">
        Role: <span className="profile-role-badge">{user.role}</span> • {user.email}
      </p>

      {/* SECTION 1: PROFILE PICTURE & ACCOUNT DETAILS */}
      <div className="profile-card">
        <h2 className="profile-section-title" style={{ marginBottom: '1.25rem' }}>
          Profile Details & Avatar
        </h2>

        {profileMsg && <div className="profile-alert-success">{profileMsg}</div>}
        {profileErr && <div className="profile-alert-error">{profileErr}</div>}

        <form onSubmit={handleProfileSubmit} className="profile-form">
          <div className="profile-avatar-row">
            <img
              src={currentAvatar}
              alt="Profile Avatar"
              onError={(e) => { e.target.src = 'https://via.placeholder.com/110?text=User'; }}
              className="profile-avatar-img"
            />
            <div>
              <label className="profile-label">Change Profile Picture</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="profile-file-input"
              />
            </div>
          </div>

          <div>
            <label className="profile-label">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="profile-input"
            />
          </div>

          <div>
            <label className="profile-label">Email Address (Cannot be changed)</label>
            <input
              type="email"
              disabled
              value={user.email || ''}
              className="profile-input"
            />
          </div>

          <div>
            <label className="profile-label">Phone Number</label>
            <div className="profile-phone-group">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="profile-input profile-country-select"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.country})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                placeholder="123456789"
                value={localPhone}
                onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ''))}
                className="profile-input"
              />
            </div>
          </div>

          <button type="submit" disabled={savingProfile} className="profile-btn-primary">
            {savingProfile ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* SECTION 2: CHANGE PASSWORD WITH EMAIL OTP */}
      <div className="profile-card">
        <h2 className="profile-section-title">Change Password (OTP Verification Required)</h2>
        <p className="profile-section-desc">
          Click the button below to receive a 6-digit verification code at <strong>{user.email}</strong>.
        </p>

        {passwordMsg && <div className="profile-alert-success">{passwordMsg}</div>}
        {passwordErr && <div className="profile-alert-error">{passwordErr}</div>}

        <div className="profile-otp-action">
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sendingOtp}
            className="profile-btn-otp"
          >
            {sendingOtp ? 'Sending OTP...' : otpSent ? 'Resend OTP to Email' : 'Send OTP to Email'}
          </button>
        </div>

        <form onSubmit={handlePasswordChange} className="profile-form">
          <div>
            <label className="profile-label">6-Digit Email OTP</label>
            <input
              type="text"
              maxLength={6}
              required
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="profile-input profile-otp-input"
            />
          </div>

          <div>
            <label className="profile-label">New Password (Min 8 characters)</label>
            <input
              type="password"
              minLength={8}
              required
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="profile-input"
            />
          </div>

          <div>
            <label className="profile-label">Confirm New Password</label>
            <input
              type="password"
              minLength={8}
              required
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="profile-input"
            />
          </div>

          <button type="submit" disabled={changingPassword} className="profile-btn-primary">
            {changingPassword ? 'Verifying & Updating...' : 'Verify OTP & Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;