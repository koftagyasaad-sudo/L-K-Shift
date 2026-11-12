'use client';

import { useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  showLabel?: string;
  hideLabel?: string;
}

export default function PasswordInput({
  className = '',
  dir,
  showLabel = 'إظهار كلمة المرور',
  hideLabel = 'إخفاء كلمة المرور',
  ...inputProps
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative w-full" dir={dir}>
      <input
        {...inputProps}
        dir={dir}
        type={visible ? 'text' : 'password'}
        className={`${className} pe-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? hideLabel : showLabel}
        className="absolute inset-y-0 end-3 flex items-center text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
      >
        {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
      </button>
    </div>
  );
}
