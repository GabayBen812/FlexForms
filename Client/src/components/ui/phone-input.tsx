import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Smartphone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  "data-cy"?: string;
}

/**
 * PhoneInput component for Israeli phone numbers
 * - Displays formatted: 050-123-4567
 * - Stores plain digits: 0501234567
 * - Validates: Must start with 05, exactly 10 digits
 * - Shows numeric keyboard on mobile
 */
export function PhoneInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  name,
  "data-cy": dataCy,
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // Format phone number for display: 050-123-4567
  const formatPhoneDisplay = (digits: string): string => {
    // Remove all non-digits
    const cleaned = digits.replace(/\D/g, "");
    
    // Format based on length
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  // Update display value when prop value changes
  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneDisplay(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove all non-digits
    const digitsOnly = input.replace(/\D/g, "");
    
    // Limit to 10 digits
    const limitedDigits = digitsOnly.slice(0, 10);
    
    // Update display with formatting
    setDisplayValue(formatPhoneDisplay(limitedDigits));
    
    // Update form state with plain digits
    onChange(limitedDigits);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    
    // Extract only digits from pasted content
    const digitsOnly = pastedText.replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 10);
    
    setDisplayValue(formatPhoneDisplay(limitedDigits));
    onChange(limitedDigits);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <Smartphone className={`w-5 h-5 transition-colors ${
          isFocused ? "text-primary" : "text-gray-400"
        }`} />
      </div>
      <Input
        type="tel"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.();
        }}
        onFocus={() => setIsFocused(true)}
        disabled={disabled}
        required={required}
        name={name}
        placeholder="טלפון נייד"
        data-cy={dataCy}
        autoComplete="tel"
        dir="ltr"
        className="!text-center text-lg sm:text-xl font-medium tracking-wide py-3.5 sm:py-4 pl-12 pr-4"
      />
    </div>
  );
}

