import React from "react";
// import { useEffect, useState } from "react";
// import PlacesAutocomplete, {
//   geocodeByAddress,
//   getLatLng,
// } from "react-places-autocomplete";
import { cn } from "@/lib/utils";

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  onSelect?: (address: string, placeId?: string) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  name?: string;
}

/**
 * AddressInput Component
 * 
 * Currently using a simple text input for addresses.
 * 
 * FUTURE IMPLEMENTATION - Google Maps Places Autocomplete:
 * The code below (commented out) is ready to be used when Google Maps API key is available.
 * To enable autocomplete functionality:
 * 1. Uncomment the imports and code below
 * 2. Set VITE_GOOGLE_MAPS_API_KEY in your .env file
 * 3. Replace the simple input return with the PlacesAutocomplete implementation
 * 
 * Note: Google Maps API requires billing and may incur costs.
 */

// Declare global types for Google Maps (for future use)
// declare global {
//   interface Window {
//     google?: {
//       maps?: {
//         places?: any;
//       };
//     };
//   }
// }

export function AddressInput({
  value,
  onChange,
  onSelect,
  onBlur,
  onKeyDown,
  placeholder = "הכנס כתובת",
  className,
  required,
  name,
}: AddressInputProps) {
  // Simple text input implementation (current)
  // Note: onSelect is only called when selecting an address from autocomplete
  // For now, we're not using autocomplete, so onSelect won't be called
  // When implementing autocomplete in the future, onSelect should only be called
  // when user selects a suggestion, not on every keystroke
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
        // onSelect is not called here - it should only be called when selecting from autocomplete
      }}
      onBlur={() => {
        // Call onBlur if provided (for table inline editing)
        if (onBlur) {
          onBlur();
        }
        // Optionally call onSelect on blur if you want to notify parent component
        // This is optional and can be removed if not needed
        if (onSelect && value) {
          onSelect(value);
        }
      }}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={cn(
        "bg-white border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left w-full focus:outline-border outline-none px-3 py-2",
        className
      )}
      required={required}
      name={name}
    />
  );
}

/* 
 * FUTURE IMPLEMENTATION - Google Maps Places Autocomplete
 * 
 * To enable autocomplete functionality in the future:
 * 1. Uncomment the imports at the top: useEffect, useState, PlacesAutocomplete, geocodeByAddress, getLatLng
 * 2. Uncomment the global Window interface declaration
 * 3. Replace the simple input above with the implementation below
 * 4. Set VITE_GOOGLE_MAPS_API_KEY in your .env file
 * 
 * Note: Google Maps API requires billing and may incur costs.
 * 
 * Implementation code (uncomment when ready):
 * 
 * const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
 * const [loadError, setLoadError] = useState<string | null>(null);
 * 
 * useEffect(() => {
 *   // Check if Google Maps is already loaded
 *   if (window.google && window.google.maps && window.google.maps.places) {
 *     setIsGoogleMapsLoaded(true);
 *     return;
 *   }
 * 
 *   // Get API key from environment variable
 *   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
 *   if (!apiKey || apiKey === "YOUR_API_KEY") {
 *     setLoadError("Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.");
 *     console.error("Google Maps API key is not configured. Set VITE_GOOGLE_MAPS_API_KEY in your .env file.");
 *     return;
 *   }
 * 
 *   // Check if script is already being loaded
 *   const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
 *   if (existingScript) {
 *     // Script exists, wait for it to load
 *     const checkLoaded = setInterval(() => {
 *       if (window.google && window.google.maps && window.google.maps.places) {
 *         setIsGoogleMapsLoaded(true);
 *         setLoadError(null);
 *         clearInterval(checkLoaded);
 *       }
 *     }, 100);
 * 
 *     // Timeout after 10 seconds
 *     setTimeout(() => {
 *       clearInterval(checkLoaded);
 *       if (!window.google || !window.google.maps || !window.google.maps.places) {
 *         setLoadError("Failed to load Google Maps API. Please check your API key and network connection.");
 *       }
 *     }, 10000);
 * 
 *     return () => clearInterval(checkLoaded);
 *   }
 * 
 *   // Load the script dynamically
 *   const script = document.createElement("script");
 *   script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
 *   script.async = true;
 *   script.defer = true;
 *   script.onload = () => {
 *     if (window.google && window.google.maps && window.google.maps.places) {
 *       setIsGoogleMapsLoaded(true);
 *       setLoadError(null);
 *     } else {
 *       setLoadError("Google Maps API loaded but Places library is not available.");
 *     }
 *   };
 *   script.onerror = () => {
 *     setLoadError("Failed to load Google Maps API script. Please check your API key.");
 *   };
 *   document.head.appendChild(script);
 * 
 *   return () => {
 *     // Cleanup: don't remove the script as it might be used by other components
 *   };
 * }, []);
 * 
 * const handleSelect = async (address: string, placeId?: string) => {
 *   onChange(address);
 *   if (onSelect) {
 *     try {
 *       const results = await geocodeByAddress(address);
 *       const latLng = await getLatLng(results[0]);
 *       onSelect(address, placeId);
 *     } catch (error) {
 *       console.error("Error geocoding address:", error);
 *       onSelect(address, placeId);
 *     }
 *   }
 * };
 * 
 * // Show error state if API key is not configured
 * if (loadError) {
 *   return (
 *     <div className="w-full">
 *       <input
 *         type="text"
 *         value={value}
 *         onChange={(e) => onChange(e.target.value)}
 *         placeholder={placeholder}
 *         className={cn(
 *           "bg-white border border-red-300 rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left w-full focus:outline-border outline-none px-3 py-2",
 *           className
 *         )}
 *         required={required}
 *         name={name}
 *       />
 *       <p className="text-xs text-red-500 mt-1">{loadError}</p>
 *     </div>
 *   );
 * }
 * 
 * // Show loading state while Google Maps is loading
 * if (!isGoogleMapsLoaded) {
 *   return (
 *     <div className="w-full">
 *       <input
 *         type="text"
 *         value={value}
 *         onChange={(e) => onChange(e.target.value)}
 *         placeholder={placeholder}
 *         className={cn(
 *           "bg-white border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left w-full focus:outline-border outline-none px-3 py-2 opacity-50",
 *           className
 *         )}
 *         required={required}
 *         name={name}
 *         disabled
 *       />
 *       <p className="text-xs text-gray-500 mt-1">טוען Google Maps...</p>
 *     </div>
 *   );
 * }
 * 
 * // Render PlacesAutocomplete when Google Maps is loaded
 * return (
 *   <PlacesAutocomplete
 *     value={value}
 *     onChange={onChange}
 *     onSelect={handleSelect}
 *     searchOptions={{
 *       componentRestrictions: { country: "il" }, // Restrict to Israel
 *     }}
 *   >
 *     {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
 *       <div className="relative w-full">
 *         <input
 *           {...getInputProps({
 *             placeholder,
 *             className: cn(
 *               "bg-white border border-border rounded-md placeholder:text-muted-foreground font-normal rtl:text-right ltr:text-left w-full focus:outline-border outline-none px-3 py-2",
 *               className
 *             ),
 *             required,
 *             name,
 *           })}
 *         />
 *         {suggestions.length > 0 && (
 *           <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
 *             {loading && (
 *               <div className="px-3 py-2 text-sm text-gray-500">טוען...</div>
 *             )}
 *             {suggestions.map((suggestion) => {
 *               const suggestionClassName = cn(
 *                 "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
 *                 suggestion.active && "bg-gray-100"
 *               );
 *               return (
 *                 <div
 *                   {...getSuggestionItemProps(suggestion, { className: suggestionClassName })}
 *                   key={suggestion.placeId}
 *                 >
 *                   <span>{suggestion.description}</span>
 *                 </div>
 *               );
 *             })}
 *           </div>
 *         )}
 *       </div>
 *     )}
 *   </PlacesAutocomplete>
 * );
 */

