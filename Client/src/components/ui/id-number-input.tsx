import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { IdCard, CheckCircle2, XCircle } from "lucide-react";
import { isValidIsraeliID } from "@/lib/israeliIdValidator";

interface IdNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  "data-cy"?: string;
}

/**
 * IdNumberInput component for Israeli ID numbers (תעודת זהות)
 * - Plain digit input (no formatting)
 * - Real-time validation with visual feedback
 * - Shows checkmark icon when valid (9 digits + passes Luhn algorithm)
 * - Shows error icon when invalid (after user has entered digits)
 * - Shows numeric keyboard on mobile
 * - Max 9 digits
 * - Auto-cleans pasted content
 */
export function IdNumberInput({
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  name,
  "data-cy": dataCy,
}: IdNumberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Determine validation state
  const digitsOnly = value.replace(/\D/g, "");
  const isComplete = digitsOnly.length === 9;
  const isValid = isComplete && isValidIsraeliID(digitsOnly);
  const isInvalid = digitsOnly.length > 0 && !isValid && hasInteracted && !isFocused;
  const showCheckmark = isValid && hasInteracted;

  useEffect(() => {
    if (digitsOnly.length > 0) {
      setHasInteracted(true);
    }
  }, [digitsOnly.length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Remove all non-digits
    const digitsOnly = input.replace(/\D/g, "");
    
    // Limit to 9 digits
    const limitedDigits = digitsOnly.slice(0, 9);
    
    // Update form state with plain digits
    onChange(limitedDigits);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    
    // Extract only digits from pasted content (auto-clean)
    const digitsOnly = pastedText.replace(/\D/g, "");
    const limitedDigits = digitsOnly.slice(0, 9);
    
    onChange(limitedDigits);
    setHasInteracted(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setHasInteracted(true);
    onBlur?.();
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  // Determine icon color based on validation state
  const getIconColor = () => {
    if (showCheckmark) return "text-green-500";
    if (isInvalid) return "text-red-500";
    return isFocused ? "text-primary" : "text-gray-400";
  };

  // Determine which icon to show
  const renderValidationIcon = () => {
    if (showCheckmark) {
      return <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />;
    }
    if (isInvalid) {
      return <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
    }
    return null;
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* ID Card icon on the left */}
      <div className="absolute inset-y-0 left-2 sm:left-4 flex items-center pointer-events-none z-10">
        <IdCard className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${getIconColor()}`} />
      </div>

      {/* Input field */}
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        required={required}
        name={name}
        placeholder="תעודת זהות"
        data-cy={dataCy}
        autoComplete="off"
        dir="ltr"
        maxLength={9}
        className={`!text-center text-base sm:text-xl font-medium tracking-widest py-3.5 sm:py-4 px-8 sm:px-12 transition-all ${
          showCheckmark
            ? "border-green-500 focus:ring-green-500"
            : isInvalid
            ? "border-red-500 focus:ring-red-500"
            : ""
        }`}
      />

      {/* Validation icon on the right */}
      {(showCheckmark || isInvalid) && (
        <div className="absolute inset-y-0 right-2 sm:right-4 flex items-center pointer-events-none z-10">
          {renderValidationIcon()}
        </div>
      )}
    </div>
  );
}

