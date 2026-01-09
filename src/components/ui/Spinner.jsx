import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  return (
    <div className={cn(sizes[size], className, 'relative')}>
      <svg
        viewBox="0 0 128 128"
        className="pl1 w-full h-full"
      >
        <defs>
          <linearGradient y2="1" x2="1" y1="0" x1="0" id="pl-grad">
            <stop stopColor="currentColor" offset="0%"></stop>
            <stop stopColor="var(--color-secondary)" offset="100%"></stop>
          </linearGradient>
          <mask id="pl-mask">
            <rect fill="url(#pl-grad)" height="128" width="128" y="0" x="0"></rect>
          </mask>
        </defs>
        <g fill="var(--color-border)">
          <g className="pl1__g">
            <g transform="translate(20,20) rotate(0,44,44)">
              <g className="pl1__rect-g">
                <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
              </g>
              <g transform="rotate(180,44,44)" className="pl1__rect-g">
                <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
              </g>
            </g>
          </g>
        </g>
        <g mask="url(#pl-mask)" fill="var(--color-secondary)">
          <g className="pl1__g">
            <g transform="translate(20,20) rotate(0,44,44)">
              <g className="pl1__rect-g">
                <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
              </g>
              <g transform="rotate(180,44,44)" className="pl1__rect-g">
                <rect height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
                <rect transform="translate(0,48)" height="40" width="40" ry="8" rx="8" className="pl1__rect"></rect>
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-8">
      <Spinner size="xl" />
      <p className="text-muted-foreground font-medium animate-pulse">{message}</p>
    </div>
  );
}

export { Spinner, LoadingScreen };
