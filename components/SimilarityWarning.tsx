"use client";

interface SimilarityWarningProps {
  warning: boolean;
  maxScore?: number;
  results?: { prompt: string; score: number }[];
}

export default function SimilarityWarning({
  warning,
  maxScore,
}: SimilarityWarningProps) {
  if (!warning) {
    return (
      <div className="w-full rounded-md border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
        <h3 className="mb-2 font-semibold">No Duplication Detected</h3>
        <p className="mb-2 text-sm">
          Your prompt appears to be original based on our current database.
        </p>
        {maxScore !== undefined && (
          <p className="text-sm font-medium">
            Similarity Score: {maxScore.toFixed(2)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      <h3 className="mb-2 font-semibold">Duplication Warning</h3>
      <p className="mb-2 text-sm">
        The submitted prompt has been flagged for high similarity with existing
        database entries. Please ensure your submission is original.
      </p>
      {maxScore !== undefined && (
        <p className="text-sm font-medium">
          Similarity Score: {maxScore.toFixed(2)}
        </p>
      )}
    </div>
  );
}