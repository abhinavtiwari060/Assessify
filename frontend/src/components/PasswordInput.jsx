import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

const PasswordInput = ({
  value,
  onChange,
  placeholder = '••••••••',
  required = false,
  minLength,
  maxLength,
  className = '',
  name,
  id,
  autoComplete,
  showLockIcon = true,
  icon: Icon = Lock,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      {showLockIcon && (
        <Icon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
      )}
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        name={name}
        id={id}
        autoComplete={autoComplete}
        className={`w-full bg-[var(--bg-sub)] border border-[var(--border)] rounded-xl ${
          showLockIcon ? 'pl-10' : 'pl-3.5'
        } pr-10 py-2.5 text-xs sm:text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#FA8128] transition-colors ${className}`}
      />
      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        title={showPassword ? 'Hide password' : 'Show password'}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FA8128] cursor-pointer"
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
        ) : (
          <Eye className="w-4 h-4 text-[var(--text-muted)] hover:text-[var(--text-main)]" />
        )}
      </button>
    </div>
  );
};

export default PasswordInput;
