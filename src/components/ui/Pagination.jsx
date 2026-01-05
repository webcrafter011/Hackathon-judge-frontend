import { cn } from '../../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button';

function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange,
  className 
}) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft size={18} />
      </Button>

      {startPage > 1 && (
        <>
          <Button
            variant={1 === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(1)}
            className="w-10"
          >
            1
          </Button>
          {startPage > 2 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
        </>
      )}

      {pages.map((page) => (
        <Button
          key={page}
          variant={page === currentPage ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onPageChange(page)}
          className="w-10"
        >
          {page}
        </Button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="px-2 text-muted-foreground">...</span>
          )}
          <Button
            variant={totalPages === currentPage ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="w-10"
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight size={18} />
      </Button>
    </div>
  );
}

export default Pagination;
