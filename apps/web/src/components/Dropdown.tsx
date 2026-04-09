import type { ChangeEvent } from 'react';

interface DropdownOption {
  value: string | number;
  label: string;
}

interface DropdownProps {
  value: string | number;
  options: DropdownOption[];
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  placeholderValue?: string | number;
  className?: string;
}

export default function Dropdown({
  value,
  options,
  onChange,
  required = false,
  id,
  name,
  placeholder,
  placeholderValue = '',
  className = ''
}: DropdownProps) {
  return (
    <select
      id={id}
      name={name}
      className={`form-select ${className}`.trim()}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      required={required}
    >
      {placeholder ? (
        <option value={placeholderValue}>{placeholder}</option>
      ) : null}
      {options.map(option => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
