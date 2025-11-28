import { useMemo } from "react";

interface HighlightMatchProps {
  text: string;
  query: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Component that highlights matching text in search results
 * Handles case-insensitive matching and multiple matches
 */
export function HighlightMatch({
  text,
  query,
  className = "",
  highlightClassName = "bg-yellow-200 dark:bg-yellow-900 font-medium",
}: HighlightMatchProps) {
  const parts = useMemo(() => {
    if (!query.trim()) {
      return [{ text, isMatch: false }];
    }

    const normalizedText = text;
    const normalizedQuery = query.toLowerCase();
    const lowerText = normalizedText.toLowerCase();
    const parts: Array<{ text: string; isMatch: boolean }> = [];
    let lastIndex = 0;
    let searchIndex = 0;

    // Find all matches
    while (true) {
      const index = lowerText.indexOf(normalizedQuery, searchIndex);
      if (index === -1) {
        break;
      }

      // Add text before match
      if (index > lastIndex) {
        parts.push({
          text: normalizedText.substring(lastIndex, index),
          isMatch: false,
        });
      }

      // Add matched text
      parts.push({
        text: normalizedText.substring(index, index + query.length),
        isMatch: true,
      });

      lastIndex = index + query.length;
      searchIndex = index + 1;
    }

    // Add remaining text
    if (lastIndex < normalizedText.length) {
      parts.push({
        text: normalizedText.substring(lastIndex),
        isMatch: false,
      });
    }

    // If no matches found, return original text
    if (parts.length === 0 || parts.every((p) => !p.isMatch)) {
      return [{ text: normalizedText, isMatch: false }];
    }

    return parts;
  }, [text, query]);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isMatch ? (
          <span key={index} className={highlightClassName}>
            {part.text}
          </span>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}

