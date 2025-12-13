import React, { useState, useRef, useEffect } from 'react';
import { ProblemAnalysis, BoundingBox } from '../types';

interface Props {
  imageUrl: string | null;
  problems: ProblemAnalysis[];
  selectedProblemId: number | null;
  onSelectProblem: (id: number) => void;
  highContrast: boolean;
}

export const ImageViewer: React.FC<Props> = ({ 
  imageUrl, 
  problems, 
  selectedProblemId, 
  onSelectProblem,
  highContrast 
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  // Update image size for calculating relative box positions if needed, 
  // though we use percentages so it's responsive by default.
  const handleImageLoad = () => {
    if (imgRef.current) {
      setImageSize({ 
        width: imgRef.current.offsetWidth, 
        height: imgRef.current.offsetHeight 
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleImageLoad);
    return () => window.removeEventListener('resize', handleImageLoad);
  }, []);

  if (!imageUrl) return null;

  return (
    <div className={`relative w-full rounded-xl overflow-hidden shadow-lg border ${highContrast ? 'border-slate-700 bg-black' : 'border-slate-200 bg-slate-50'}`}>
      <img 
        ref={imgRef}
        src={imageUrl} 
        alt="Homework" 
        className="w-full h-auto block"
        onLoad={handleImageLoad}
      />
      
      {problems.map((problem) => {
        if (problem.isCorrect || !problem.boundingBox) return null;

        const { ymin, xmin, ymax, xmax } = problem.boundingBox;
        
        // ROBUST COORDINATE HANDLING
        // Auto-detect coordinate scale (0-1 or 0-1000)
        // If any coordinate is > 1.5, we assume 0-1000 scale. (Using 1.5 to be safe against 1.0)
        // If all are <= 1, we assume 0-1 scale.
        const isNormalized = Math.max(ymin, xmin, ymax, xmax) <= 1.5;

        let top, left, width, height;

        if (isNormalized) {
             // Already 0-1 (e.g., 0.5 = 50%)
             top = ymin * 100;
             left = xmin * 100;
             width = (xmax - xmin) * 100;
             height = (ymax - ymin) * 100;
        } else {
             // Assume 0-1000 (e.g., 500 = 50%)
             top = ymin / 10;
             left = xmin / 10;
             width = (xmax - xmin) / 10;
             height = (ymax - ymin) / 10;
        }

        // Clamp values to valid range (0-100%) to prevent boxes from flying off screen
        // if model hallucinates weird numbers
        top = Math.max(0, Math.min(100, top));
        left = Math.max(0, Math.min(100, left));
        
        // Ensure width/height don't push off right/bottom edges
        const maxWidth = 100 - left;
        const maxHeight = 100 - top;
        
        width = Math.max(0.5, Math.min(maxWidth, width)); // Minimum 0.5% size to be visible
        height = Math.max(0.5, Math.min(maxHeight, height));

        const isSelected = selectedProblemId === problem.id;

        return (
          <button
            key={problem.id}
            onClick={() => onSelectProblem(problem.id)}
            className={`absolute transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-yellow-400
              ${isSelected 
                ? 'bg-red-500/20 border-4 border-red-600 z-20 scale-[1.02]' 
                : 'bg-red-500/10 border-2 border-red-500 hover:bg-red-500/20 z-10'
              }`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
            aria-label={`Error in Problem ${problem.id}. Click for solution.`}
          >
             <span className={`absolute -top-7 left-0 px-2 py-0.5 text-xs font-bold text-white rounded shadow-sm whitespace-nowrap
               ${isSelected ? 'bg-red-600' : 'bg-red-500'}`}>
               Error {problem.id}
             </span>
          </button>
        );
      })}
    </div>
  );
};