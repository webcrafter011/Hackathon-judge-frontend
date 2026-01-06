import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Calendar,
  Users,
  Trophy,
  MapPin,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';
import {
  Button,
  Badge,
  Select,
  Input,
  Pagination,
  LoadingScreen,
  EmptyState,
  ErrorState
} from '../../components/ui';
import { Card, CardContent } from '../../components/ui';
import { getHackathons, getStatusConfig, HACKATHON_STATUS } from '../../services/hackathonService';
import { formatDate, cn, debounce } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

// Roles that can view archived hackathons
const PRIVILEGED_ROLES = ['admin', 'organizer', 'judge'];

function HackathonCard({ hackathon }) {
  const statusConfig = getStatusConfig(hackathon.status);

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startStr = formatDate(startDate, { month: 'short', day: 'numeric' });
    const endStr = formatDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const start = new Date(hackathon.startAt);
    const end = new Date(hackathon.endAt);

    if (hackathon.status === 'open') {
      const diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));
      if (diff > 0) return `Starts in ${diff} days`;
      return 'Starting soon';
    }
    if (hackathon.status === 'running') {
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (diff > 0) return `${diff} days remaining`;
      return 'Ending soon';
    }
    return null;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Link to={`/hackathons/${hackathon._id}`}>
      <Card className="h-full hover:shadow-md hover:border-secondary/50 transition-all duration-300 group overflow-hidden">
        {/* Banner Image */}
        <div className="p-2 relative h-40 overflow-hidden">
          {hackathon.bannerUrl ? (
            <img
              src={hackathon.bannerUrl}
              alt={hackathon.title}
              className="rounded-lg w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy size={48} className="text-secondary/30" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge className={statusConfig.color}>
              {statusConfig.icon} {statusConfig.label}
            </Badge>
          </div>

          {/* Days Remaining */}
          {daysRemaining && (
            <div className="absolute top-3 right-3">
              <Badge variant="outline" className="bg-primary/90 backdrop-blur-sm">
                <Clock size={12} className="mr-1" />
                {daysRemaining}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-lg text-foreground group-hover:text-secondary transition-colors line-clamp-1">
            {hackathon.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {hackathon.description}
          </p>

          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{formatDateRange(hackathon.startAt, hackathon.endAt)}</span>
            </div>
            {hackathon.teamCount !== undefined && (
              <div className="flex items-center gap-1">
                <Users size={14} />
                <span>{hackathon.teamCount} teams</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {hackathon.tags && hackathon.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hackathon.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {hackathon.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{hackathon.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* View Button */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              {hackathon.prizes && hackathon.prizes.length > 0 && (
                <span className="text-sm font-medium text-secondary">
                  🏆 {hackathon.prizes[0].value}
                </span>
              )}
            </div>
            <Button variant="outline" className="text-sm bg-secondary text-white">
              View Details
            </Button>
            {/* <span className="text-sm font-medium text-secondary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              View Details <ArrowRight size={14} />
            </span> */}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function HackathonsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuthStore();

  // Check if user is privileged (can see archived hackathons)
  const canViewArchived = useMemo(() => {
    if (!user) return false;
    return PRIVILEGED_ROLES.includes(user.role);
  }, [user]);

  const [hackathons, setHackathons] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // Get filter values from URL
  const filters = {
    page: parseInt(searchParams.get('page') || '1'),
    status: searchParams.get('status') || '',
    visibility: searchParams.get('visibility') || '',
    search: searchParams.get('q') || '',
    tag: searchParams.get('tag') || '',
  };

  const [searchInput, setSearchInput] = useState(filters.search);

  // Fetch hackathons
  const fetchHackathons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: filters.page,
        limit: 12,
      };
      if (filters.status) params.status = filters.status;
      if (filters.visibility) params.visibility = filters.visibility;
      if (filters.search) params.search = filters.search;
      if (filters.tag) params.tag = filters.tag;

      const data = await getHackathons(params);

      // Filter out archived hackathons for participants
      // Only privileged roles (admin, organizer, judge) can see archived hackathons
      let filteredHackathons = data.hackathons || [];
      if (!canViewArchived) {
        filteredHackathons = filteredHackathons.filter(h => h.status !== 'archived');
      }

      setHackathons(filteredHackathons);

      // Adjust pagination total if we filtered
      const filteredCount = filteredHackathons.length;
      const originalPagination = data.pagination || { page: 1, pages: 1, total: 0 };
      if (!canViewArchived && filteredCount !== (data.hackathons || []).length) {
        // Rough adjustment - backend should ideally filter this
        const archivedCount = (data.hackathons || []).length - filteredCount;
        setPagination({
          ...originalPagination,
          total: Math.max(0, originalPagination.total - archivedCount)
        });
      } else {
        setPagination(originalPagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hackathons');
    } finally {
      setIsLoading(false);
    }
  }, [filters.page, filters.status, filters.visibility, filters.search, filters.tag, canViewArchived]);

  useEffect(() => {
    fetchHackathons();
  }, [fetchHackathons]);

  // Update URL params
  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...newFilters, page: newFilters.page || 1 };

    if (merged.page > 1) params.set('page', merged.page);
    if (merged.status) params.set('status', merged.status);
    if (merged.visibility) params.set('visibility', merged.visibility);
    if (merged.search) params.set('q', merged.search);
    if (merged.tag) params.set('tag', merged.tag);

    setSearchParams(params);
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((value) => {
      updateFilters({ search: value });
    }, 500),
    [filters]
  );

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
    debouncedSearch(e.target.value);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const hasActiveFilters = filters.status || filters.visibility || filters.search || filters.tag;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Explore Hackathons
          </h1>
          <p className="text-muted-foreground mt-1">
            Discover and join exciting hackathons
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search hackathons..."
              value={searchInput}
              onChange={handleSearchChange}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'border-secondary text-secondary')}
          >
            <Filter size={18} />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-5 h-5 bg-secondary text-white rounded-full text-xs flex items-center justify-center">
                {[filters.status, filters.visibility, filters.tag].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <Select
                  value={filters.status}
                  onChange={(e) => updateFilters({ status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="running">Running</option>
                  <option value="closed">Closed</option>
                  {canViewArchived && <option value="archived">Archived</option>}
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Visibility</label>
                <Select
                  value={filters.visibility}
                  onChange={(e) => updateFilters({ visibility: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Tag</label>
                <Input
                  placeholder="Filter by tag"
                  value={filters.tag}
                  onChange={(e) => updateFilters({ tag: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters} className="w-full">
                    <X size={16} />
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {filters.status && (
              <Badge variant="primary" className="gap-1">
                Status: {filters.status}
                <button onClick={() => updateFilters({ status: '' })} className="hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {filters.visibility && (
              <Badge variant="primary" className="gap-1">
                Visibility: {filters.visibility}
                <button onClick={() => updateFilters({ visibility: '' })} className="hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {filters.search && (
              <Badge variant="primary" className="gap-1">
                Search: "{filters.search}"
                <button onClick={() => { setSearchInput(''); updateFilters({ search: '' }); }} className="hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {filters.tag && (
              <Badge variant="primary" className="gap-1">
                Tag: {filters.tag}
                <button onClick={() => updateFilters({ tag: '' })} className="hover:text-white">
                  <X size={12} />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!isLoading && !error && (
        <p className="text-sm text-muted-foreground">
          Showing {hackathons.length} of {pagination.total} hackathons
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingScreen message="Loading hackathons..." />
      ) : error ? (
        <ErrorState
          description={error}
          onRetry={fetchHackathons}
        />
      ) : hackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hackathons found"
          description={hasActiveFilters
            ? "Try adjusting your filters to find what you're looking for."
            : "There are no hackathons available at the moment. Check back later!"
          }
          action={hasActiveFilters ? clearFilters : undefined}
          actionLabel="Clear Filters"
        />
      ) : (
        <>
          {/* Hackathon Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {hackathons.map((hackathon) => (
              <HackathonCard key={hackathon._id} hackathon={hackathon} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={(page) => updateFilters({ page })}
              className="mt-8"
            />
          )}
        </>
      )}
    </div>
  );
}

export default HackathonsPage;
