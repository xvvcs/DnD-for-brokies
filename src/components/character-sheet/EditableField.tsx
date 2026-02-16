/**
 * EditableField Component
 *
 * Inline editing field for character sheet values
 * Supports text, number, and select input types
 * with validation and auto-save integration
 */

import React, { useState, useRef, useEffect } from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type EditableFieldType = 'text' | 'number' | 'select';

interface EditableFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  type?: EditableFieldType;
  options?: string[];
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  label?: string;
  validate?: (value: string | number) => boolean;
  onSave?: () => void;
  saveDelay?: number;
}

/**
 * Inline editable field with click-to-edit functionality
 */
export function EditableField({
  value,
  onChange,
  type = 'text',
  // options = [], // TODO: Implement select type support
  min,
  max,
  placeholder,
  className,
  label,
  validate,
  onSave,
  saveDelay = 500,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [isValid, setIsValid] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Clear save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleStartEdit = () => {
    setEditValue(value.toString());
    setIsValid(true);
    setIsEditing(true);
  };

  const handleSave = () => {
    let newValue: string | number = editValue;

    // Convert number type
    if (type === 'number') {
      newValue = parseInt(editValue, 10);
      if (isNaN(newValue)) {
        setIsValid(false);
        return;
      }
      if (min !== undefined && newValue < min) newValue = min;
      if (max !== undefined && newValue > max) newValue = max;
    }

    // Validate
    if (validate && !validate(newValue)) {
      setIsValid(false);
      return;
    }

    // Update value
    onChange(newValue);
    setIsEditing(false);

    // Trigger auto-save
    if (onSave) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onSave();
      }, saveDelay);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsValid(true);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow click events to process
    setTimeout(() => {
      handleSave();
    }, 100);
  };

  // Display mode
  if (!isEditing) {
    return (
      <div
        className={cn(
          'cursor-pointer rounded px-2 py-1',
          'hover:bg-amber-100 transition-colors',
          'border border-transparent hover:border-amber-300',
          className
        )}
        onClick={handleStartEdit}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleStartEdit();
          }
        }}
      >
        {label && <span className="text-xs text-gray-500 block">{label}</span>}
        <span className="font-medium">{value || placeholder || '\u00A0'}</span>
      </div>
    );
  }

  // Edit mode
  return (
    <div className={cn('relative', className)}>
      {label && <span className="text-xs text-gray-500 block mb-1">{label}</span>}
      <Input
        ref={inputRef}
        type={type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => {
          setEditValue(e.target.value);
          setIsValid(true);
        }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        min={min}
        max={max}
        placeholder={placeholder}
        className={cn(
          'h-auto py-1 px-2 text-center',
          // Hide number input spinners completely
          'appearance-textfield',
          '[&::-webkit-outer-spin-button]:appearance-none',
          '[&::-webkit-inner-spin-button]:appearance-none',
          '[&::-webkit-inner-spin-button]:m-0',
          '[&::-webkit-outer-spin-button]:m-0',
          'focus-visible:ring-2 focus-visible:ring-amber-500',
          !isValid && 'border-red-500 focus-visible:ring-red-500'
        )}
        style={{
          MozAppearance: 'textfield',
        }}
      />
      {!isValid && (
        <span className="text-xs text-red-500 absolute -bottom-5 left-0">Invalid value</span>
      )}
    </div>
  );
}

interface EditableNumberProps extends Omit<EditableFieldProps, 'type' | 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  showSign?: boolean;
}

/**
 * Specialized editable field for numbers with optional +/- sign
 */
export function EditableNumber({
  value,
  onChange,
  showSign = false,
  ...props
}: EditableNumberProps) {
  const displayValue = showSign && value >= 0 ? `+${value}` : value;

  return (
    <EditableField
      {...props}
      value={displayValue}
      type="number"
      onChange={(val) => onChange(Number(val))}
    />
  );
}

interface EditableSelectProps extends Omit<EditableFieldProps, 'type'> {
  options: string[];
}

/**
 * Editable dropdown field
 */
export function EditableSelect({ options, ...props }: EditableSelectProps) {
  return <EditableField {...props} type="select" options={options} />;
}
