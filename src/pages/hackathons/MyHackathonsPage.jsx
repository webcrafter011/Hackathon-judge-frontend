import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trophy, 
  Calendar,
  Users,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Settings,
  BarChart3,
  FileText,
  Scale
} from 'lucide-react';
import { 
  Button, 
  Badge,
  LoadingScreen,
  EmptyState,
  ErrorState 
} from '../../components/ui';
import { Card, CardContent } from '../../components/ui';
import { getMyHackathons, getStatusConfig, updateHackathonStatus, deleteHackathon, STATUS_TRANSITIONS } from '../../services/hackathonService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function MyHackathonsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathons, setHackathons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchHackathons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMyHackathons();
      setHackathons(data.hackathons || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load hackathons');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  const handleStatusChange = async (hackathonId, newStatus) => {
    try {
      await updateHackathonStatus(hackathonId, newStatus);
      fetchHackathons(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
    setActiveMenu(null);
  };

  const handleDelete = async (hackathonId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteHackathon(hackathonId);
      fetchHackathons(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete hackathon');
    }
  };

  const getAvailableTransitions = (status) => {
    return STATUS_TRANSITIONS[status] || [];
  };

  if (isLoading) {
    return <LoadingScreen message="Loading your hackathons..." />;
  }

  if (error) {
    return <ErrorState description={error} onRetry={fetchHackathons} />;
  }

  // Group hackathons by status
  const groupedHackathons = {
    active: hackathons.filter(h => ['draft', 'open', 'running'].includes(h.status)),
    past: hackathons.filter(h => ['closed', 'archived'].includes(h.status)),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            My Hackathons
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage hackathons you've created
          </p>
        </div>
        <Button onClick={() => navigate('/hackathons/create')}>
          <Plus size={18} />
          Create Hackathon
        </Button>
      </div>

      {hackathons.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No hackathons yet"
          description="You haven't created any hackathons. Start by creating your first one!"
          action={() => navigate('/hackathons/create')}
          actionLabel="Create Hackathon"
        />
      ) : (
        <div className="space-y-8">
          {/* Active Hackathons */}
          {groupedHackathons.active.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-success rounded-full" />
                Active ({groupedHackathons.active.length})
              </h2>
              <div className="grid gap-4">
                {groupedHackathons.active.map((hackathon) => (
                  <HackathonCard
                    key={hackathon._id}
                    hackathon={hackathon}
                    isMenuOpen={activeMenu === hackathon._id}
                    onMenuToggle={() => setActiveMenu(activeMenu === hackathon._id ? null : hackathon._id)}
                    onMenuClose={() => setActiveMenu(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    availableTransitions={getAvailableTransitions(hackathon.status)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Hackathons */}
          {groupedHackathons.past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-muted-foreground rounded-full" />
                Past ({groupedHackathons.past.length})
              </h2>
              <div className="grid gap-4">
                {groupedHackathons.past.map((hackathon) => (
                  <HackathonCard
                    key={hackathon._id}
                    hackathon={hackathon}
                    isMenuOpen={activeMenu === hackathon._id}
                    onMenuToggle={() => setActiveMenu(activeMenu === hackathon._id ? null : hackathon._id)}
                    onMenuClose={() => setActiveMenu(null)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    availableTransitions={getAvailableTransitions(hackathon.status)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HackathonCard({ 
  hackathon, 
  isMenuOpen, 
  onMenuToggle, 
  onMenuClose,
  onStatusChange,
  onDelete,
  availableTransitions 
}) {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(hackathon.status);

  const formatDateRange = (start, end) => {
    const startDate = formatDate(start, { month: 'short', day: 'numeric' });
    const endDate = formatDate(end, { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startDate} - ${endDate}`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Icon */}
          <div className="hidden sm:flex w-14 h-14 bg-secondary/10 rounded-xl items-center justify-center flex-shrink-0">
            <Trophy size={24} className="text-secondary" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link 
                  to={`/hackathons/${hackathon._id}`}
                  className="font-semibold text-lg text-foreground hover:text-secondary transition-colors line-clamp-1"
                >
                  {hackathon.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDateRange(hackathon.startAt, hackathon.endAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={14} />
                    {hackathon.teamCount || 0} teams
                  </span>
                </div>
              </div>
              <Badge className={statusConfig.color}>
                {statusConfig.icon} {statusConfig.label}
              </Badge>
            </div>

            {/* Tags */}
            {hackathon.tags && hackathon.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hackathon.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/hackathons/${hackathon._id}`)}
            >
              <Eye size={16} />
              <span className="hidden sm:inline">View</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/hackathons/${hackathon._id}/judges`)}
              title="Manage Judges"
            >
              <Users size={16} />
              <span className="hidden sm:inline">Judges</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/hackathons/${hackathon._id}/submissions`)}
              title="View Submissions"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Submissions</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/hackathons/${hackathon._id}/assignments`)}
              title="Manage Judge Assignments"
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">Assignments</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/hackathons/${hackathon._id}/edit`)}
            >
              <Edit size={16} />
              <span className="hidden sm:inline">Edit</span>
            </Button>
            
            {/* More Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuToggle}
              >
                <MoreVertical size={16} />
              </Button>

              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={onMenuClose}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-primary rounded-lg border border-border shadow-lg z-50">
                    <div className="py-1">
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors text-left"
                        onClick={() => {
                          navigate(`/hackathons/${hackathon._id}/criteria`);
                          onMenuClose();
                        }}
                      >
                        <Scale size={16} />
                        Set Criteria
                      </button>
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors text-left"
                        onClick={() => {
                          navigate(`/hackathons/${hackathon._id}/submissions`);
                          onMenuClose();
                        }}
                      >
                        <BarChart3 size={16} />
                        Submissions
                      </button>
                      
                      {/* Status Transitions */}
                      {availableTransitions.length > 0 && (
                        <>
                          <div className="border-t border-border my-1" />
                          <div className="px-4 py-1 text-xs text-muted-foreground">
                            Change Status
                          </div>
                          {availableTransitions.map((status) => {
                            const config = getStatusConfig(status);
                            return (
                              <button
                                key={status}
                                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors text-left"
                                onClick={() => onStatusChange(hackathon._id, status)}
                              >
                                <span>{config.icon}</span>
                                Set to {config.label}
                              </button>
                            );
                          })}
                        </>
                      )}
                      
                      {/* Delete Option */}
                      <div className="border-t border-border my-1" />
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-error/10 text-error transition-colors text-left"
                        onClick={() => {
                          onMenuClose();
                          onDelete(hackathon._id, hackathon.title);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete Hackathon
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default MyHackathonsPage;
