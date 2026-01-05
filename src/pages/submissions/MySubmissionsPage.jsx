import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Trophy, 
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  ExternalLink,
  Plus
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen, 
  EmptyState,
  ErrorState
} from '../../components/ui';
import { Card, CardContent } from '../../components/ui';
import { getMySubmission, getSubmissionStatus } from '../../services/submissionService';
import { getHackathons } from '../../services/hackathonService';
import { getMyTeams } from '../../services/teamService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function MySubmissionsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [submissionsData, setSubmissionsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get user's teams
      const teamsData = await getMyTeams();
      const teams = teamsData.teams || [];
      
      // For each team, check if there's a submission for their hackathon
      const submissionPromises = teams
        .filter(team => team.hackathonId) // Only teams with hackathon
        .map(async (team) => {
          const hackathon = team.hackathonId;
          try {
            const submissionData = await getMySubmission(hackathon._id || hackathon);
            return {
              team,
              hackathon: typeof hackathon === 'object' ? hackathon : { _id: hackathon },
              submission: submissionData.submission
            };
          } catch (err) {
            // No submission yet
            return {
              team,
              hackathon: typeof hackathon === 'object' ? hackathon : { _id: hackathon },
              submission: null
            };
          }
        });

      const results = await Promise.all(submissionPromises);
      setSubmissionsData(results);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingScreen message="Loading your submissions..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load submissions" 
        description={error}
        onRetry={fetchData}
      />
    );
  }

  // Separate by status
  const activeSubmissions = submissionsData.filter(s => {
    const hackathon = s.hackathon;
    return hackathon && new Date(hackathon.endAt) >= new Date();
  });
  
  const pastSubmissions = submissionsData.filter(s => {
    const hackathon = s.hackathon;
    return hackathon && new Date(hackathon.endAt) < new Date();
  });

  // Stats
  const totalSubmissions = submissionsData.filter(s => s.submission).length;
  const finalSubmissions = submissionsData.filter(s => s.submission?.isFinal).length;
  const draftSubmissions = totalSubmissions - finalSubmissions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Submissions</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team submissions across hackathons
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Total Teams" 
          value={submissionsData.length}
          icon={Users}
        />
        <StatCard 
          label="Submissions" 
          value={totalSubmissions}
          icon={FileText}
        />
        <StatCard 
          label="Final" 
          value={finalSubmissions}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard 
          label="Draft" 
          value={draftSubmissions}
          icon={Clock}
          variant={draftSubmissions > 0 ? 'warning' : 'default'}
        />
      </div>

      {submissionsData.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No submissions yet"
          description="Join a hackathon team to start working on submissions"
          action={() => navigate('/hackathons')}
          actionLabel="Browse Hackathons"
        />
      ) : (
        <>
          {/* Active Hackathons */}
          {activeSubmissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Active Hackathons</h2>
              <div className="grid gap-4">
                {activeSubmissions.map(item => (
                  <SubmissionCard key={item.team._id} data={item} />
                ))}
              </div>
            </div>
          )}

          {/* Past Hackathons */}
          {pastSubmissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground">Past Hackathons</h2>
              <div className="grid gap-4">
                {pastSubmissions.map(item => (
                  <SubmissionCard key={item.team._id} data={item} isPast />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant = 'default' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={cn(
            'p-3 rounded-lg',
            variant === 'warning' ? 'bg-warning/10' : variant === 'success' ? 'bg-success/10' : 'bg-secondary/10'
          )}>
            <Icon size={20} className={cn(
              variant === 'warning' ? 'text-warning' : variant === 'success' ? 'text-success' : 'text-secondary'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SubmissionCard({ data, isPast }) {
  const navigate = useNavigate();
  const { team, hackathon, submission } = data;
  const statusConfig = getSubmissionStatus(submission);
  
  const deadline = hackathon?.submissionDeadline || hackathon?.endAt;
  const isDeadlinePassed = deadline && new Date(deadline) < new Date();
  
  return (
    <Card className={cn(
      'hover:shadow-md transition-all',
      isPast ? 'opacity-75' : 'hover:border-secondary/50'
    )}>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <div className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
              isPast ? 'bg-muted' : 'bg-secondary/10'
            )}>
              <Trophy size={24} className={isPast ? 'text-muted-foreground' : 'text-secondary'} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {hackathon?.title || 'Hackathon'}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Users size={14} />
                {team.name}
              </p>
              {deadline && !isPast && (
                <p className={cn(
                  'text-xs mt-1 flex items-center gap-1',
                  isDeadlinePassed ? 'text-error' : 'text-muted-foreground'
                )}>
                  <Clock size={12} />
                  Deadline: {formatDate(deadline)}
                  {isDeadlinePassed && ' (Passed)'}
                </p>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <Badge className={statusConfig.color}>
              {statusConfig.icon} {statusConfig.label}
            </Badge>
            
            {!isPast && (
              <Button
                variant={submission ? 'outline' : 'default'}
                size="sm"
                onClick={() => navigate(`/submissions/${hackathon._id}/edit`, { 
                  state: { team, hackathon, submission } 
                })}
                disabled={isDeadlinePassed && !submission}
              >
                {submission ? (
                  <>
                    <FileText size={16} />
                    {submission.isFinal ? 'View' : 'Edit'}
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Create
                  </>
                )}
              </Button>
            )}
            
            {isPast && submission && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/submissions/${submission._id}`)}
              >
                <FileText size={16} />
                View
              </Button>
            )}
          </div>
        </div>

        {/* Submission Preview */}
        {submission && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{submission.title}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {submission.description}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                {submission.repoUrl && (
                  <a 
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    Repo
                  </a>
                )}
                {submission.demoUrl && (
                  <a 
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                    Demo
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default MySubmissionsPage;
