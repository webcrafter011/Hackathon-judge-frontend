import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Trophy, 
  Calendar,
  ArrowRight,
  UserCheck,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3,
  ClipboardList
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen, 
  EmptyState,
  ErrorState
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getMyAssignments } from '../../services/assignmentService';
import { getHackathons } from '../../services/hackathonService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

function MyEvaluationsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathonsWithAssignments, setHackathonsWithAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Get all hackathons (we'll check assignments for each)
      const hackathonsData = await getHackathons({ limit: 100 });
      const hackathons = hackathonsData.hackathons || [];
      
      // For each hackathon, try to fetch the judge's assignments
      // The /mine endpoint will return assignments if the user is assigned as a judge
      const assignmentPromises = hackathons.map(async (hackathon) => {
        try {
          const assignmentData = await getMyAssignments(hackathon._id);
          // Only include if there's actual assignment data
          if (assignmentData && (assignmentData.assignment || assignmentData.teams?.length > 0)) {
            return {
              hackathon,
              assignment: assignmentData.assignment,
              teams: assignmentData.teams || assignmentData.assignment?.teamIds || [],
              evaluatedCount: assignmentData.evaluatedCount || 0,
              totalCount: assignmentData.totalCount || assignmentData.teams?.length || assignmentData.assignment?.teamIds?.length || 0
            };
          }
          return null;
        } catch (err) {
          // 403/404 means not assigned to this hackathon - that's expected
          return null;
        }
      });

      const results = await Promise.all(assignmentPromises);
      // Filter out nulls (hackathons where user has no assignments)
      setHackathonsWithAssignments(results.filter(r => r !== null));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load evaluations');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'judge' || user?.role === 'admin') {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [fetchData, user]);

  if (user?.role !== 'judge' && user?.role !== 'admin') {
    return (
      <ErrorState 
        title="Access Denied" 
        message="This page is only accessible to judges."
        action={() => navigate('/dashboard')}
        actionLabel="Go to Dashboard"
      />
    );
  }

  if (isLoading) {
    return <LoadingScreen message="Loading your evaluations..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load evaluations" 
        message={error}
        action={fetchData}
        actionLabel="Try Again"
      />
    );
  }

  // Separate active and past hackathons
  const now = new Date();
  const activeHackathons = hackathonsWithAssignments.filter(h => 
    new Date(h.hackathon.endAt) >= now && h.hackathon.status !== 'completed'
  );
  const pastHackathons = hackathonsWithAssignments.filter(h => 
    new Date(h.hackathon.endAt) < now || h.hackathon.status === 'completed'
  );

  // Calculate overall stats
  const totalTeams = hackathonsWithAssignments.reduce((sum, h) => sum + h.teams.length, 0);
  const evaluatedTeams = hackathonsWithAssignments.reduce((sum, h) => sum + h.evaluatedCount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Evaluations</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your judge assignments across hackathons
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Active Hackathons" 
          value={activeHackathons.length}
          icon={Trophy}
        />
        <StatCard 
          label="Teams to Evaluate" 
          value={totalTeams}
          icon={Users}
        />
        <StatCard 
          label="Evaluated" 
          value={evaluatedTeams}
          icon={CheckCircle}
          variant="success"
        />
        <StatCard 
          label="Pending" 
          value={totalTeams - evaluatedTeams}
          icon={Clock}
          variant={totalTeams - evaluatedTeams > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Active Hackathons */}
      {activeHackathons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Active Assignments</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeHackathons.map(item => (
              <HackathonAssignmentCard key={item.hackathon._id} data={item} />
            ))}
          </div>
        </div>
      )}

      {/* Past Hackathons */}
      {pastHackathons.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Past Assignments</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {pastHackathons.map(item => (
              <HackathonAssignmentCard key={item.hackathon._id} data={item} isPast />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {hackathonsWithAssignments.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No assignments yet"
          description="You haven't been assigned to evaluate any teams yet."
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, variant }) {
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

function HackathonAssignmentCard({ data, isPast }) {
  const { hackathon, teams, evaluatedCount } = data;
  
  // Normalize teams - handle both populated objects and ID strings
  const normalizedTeams = (teams || []).map(team => {
    if (typeof team === 'string') {
      return { _id: team, name: `Team ${team.slice(-4)}` };
    }
    return team;
  });
  
  const totalCount = normalizedTeams.length;
  const progress = totalCount > 0 ? (evaluatedCount / totalCount) * 100 : 0;
  const isComplete = evaluatedCount >= totalCount && totalCount > 0;

  return (
    <Link to={`/hackathons/${hackathon._id}/evaluate`}>
      <Card className={cn(
        'h-full hover:shadow-md transition-all duration-300 group',
        isPast ? 'opacity-75' : 'hover:border-secondary/50'
      )}>
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                isPast ? 'bg-muted' : 'bg-secondary/10'
              )}>
                <Trophy size={24} className={isPast ? 'text-muted-foreground' : 'text-secondary'} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground group-hover:text-secondary transition-colors line-clamp-1">
                  {hackathon.title}
                </h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar size={12} />
                  {formatDate(hackathon.startAt)} - {formatDate(hackathon.endAt)}
                </p>
              </div>
            </div>
            {isComplete ? (
              <Badge className="bg-success/10 text-success shrink-0">
                <CheckCircle size={12} className="mr-1" />
                Complete
              </Badge>
            ) : isPast ? (
              <Badge variant="outline" className="shrink-0">Past</Badge>
            ) : (
              <Badge className="bg-warning/10 text-warning shrink-0">
                <Clock size={12} className="mr-1" />
                In Progress
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Evaluation Progress</span>
              <span className="font-medium">
                {evaluatedCount} / {totalCount} teams
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-success' : 'bg-secondary'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Teams Preview */}
          {normalizedTeams.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Assigned Teams:</p>
              <div className="flex flex-wrap gap-1.5">
                {normalizedTeams.slice(0, 4).map(team => (
                  <Badge key={team._id} variant="outline" className="text-xs">
                    {team.name}
                  </Badge>
                ))}
                {normalizedTeams.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{normalizedTeams.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action */}
          <div className="mt-4 flex justify-end">
            <span className="text-sm font-medium text-secondary group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              {isPast ? 'View Results' : 'Start Evaluating'} <ArrowRight size={14} />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default MyEvaluationsPage;
