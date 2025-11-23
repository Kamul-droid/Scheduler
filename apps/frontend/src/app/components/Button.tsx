import clsx from 'clsx';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

export default function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={clsx(
        'btn',
        {
          'btn-primary': variant === 'primary',
          'btn-secondary': variant === 'secondary',
          'btn-danger': variant === 'danger',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

