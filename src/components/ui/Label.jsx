import { cn } from '../../lib/utils';

function Label({ className, required, children, ...props }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-foreground',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
}

export default Label;
