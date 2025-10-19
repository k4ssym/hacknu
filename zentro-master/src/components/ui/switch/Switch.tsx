import React from 'react';

export interface SwitchProps {
  /** текущее состояние переключателя */
  checked: boolean;
  /** колбэк для изменения состояния */
  onChange: (checked: boolean) => void;
  /** опционально: отключить переключатель */
  disabled?: boolean;
  /** опционально: дополнительные CSS-классы */
  className?: string;
  /** опционально: размер переключателя */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Улучшенный компонент переключателя (Toggle Switch) в стиле ZAMAN.AI ML
 */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  className = '',
  size = 'md'
}: SwitchProps) {
  // Размерные стили
  const sizeStyles = {
    sm: {
      container: 'h-5 w-9',
      thumb: 'h-4 w-4',
      translate: 'translate-x-4'
    },
    md: {
      container: 'h-6 w-11',
      thumb: 'h-5 w-5',
      translate: 'translate-x-6'
    },
    lg: {
      container: 'h-7 w-14',
      thumb: 'h-6 w-6',
      translate: 'translate-x-7'
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={
        `relative inline-flex items-center flex-shrink-0 rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#61962e]/50 focus:ring-offset-2 dark:focus:ring-[#8bc34a]/50 ${
          sizeStyles[size].container
        } ` +
        (checked
          ? 'bg-[#61962e] hover:bg-[#4d7a25] dark:bg-[#8bc34a] dark:hover:bg-[#7cb342]'
          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500') +
        ` ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${className}`
      }
    >
      <span
        className={
          `inline-block bg-white rounded-full shadow-md transform transition-all duration-300 ease-in-out ${
            sizeStyles[size].thumb
          } ` +
          (checked ? sizeStyles[size].translate : 'translate-x-1') +
          (disabled ? ' opacity-80' : '')
        }
      />
    </button>
  );
}