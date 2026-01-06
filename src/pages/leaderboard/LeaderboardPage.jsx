import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Trophy,
  Medal,
  Award,
  ArrowLeft,
  Users,
  Star,
  TrendingUp,
  BarChart3,
  ExternalLink,
  RefreshCw,
  Crown,
  Zap
} from 'lucide-react';
import { 
  Button, 
  Badge, 
  LoadingScreen,
  EmptyState,
  ErrorState 
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { getHackathonById, getStatusConfig } from '../../services/hackathonService';
import { getLeaderboard } from '../../services/evaluationService';
import { formatDate, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

// Medal icons for top 3
const getRankIcon = (rank) => {
  switch (rank) {
    case 1:
      return <Trophy className="text-yellow-500" size={24} />;
    case 2:
      return <Medal className="text-gray-400" size={24} />;
    case 3:
      return <Award className="text-amber-600" size={24} />;
    default:
      return null;
  }
};

// Get rank badge color
const getRankBadgeColor = (rank) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-0';
    case 2:
      return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-0';
    case 3:
      return 'bg-gradient-to-r from-amber-500 to-amber-700 text-white border-0';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

// Helper to extract team name from various API response formats
const getTeamName = (entry) => {
  // Try direct team.name
  if (entry.team?.name) return entry.team.name;
  // Try if team is a string (just name)
  if (typeof entry.team === 'string') return entry.team;
  // Try teamName field
  if (entry.teamName) return entry.teamName;
  // Try submission.team.name (team might be nested in submission)
  if (entry.submission?.team?.name) return entry.submission.team.name;
  // Try submission.teamId if it's populated
  if (entry.submission?.teamId?.name) return entry.submission.teamId.name;
  return 'Unknown Team';
};

// Helper to extract submission title
const getSubmissionTitle = (entry) => {
  if (entry.submission?.title) return entry.submission.title;
  if (typeof entry.submission === 'string') return entry.submission;
  if (entry.submissionTitle) return entry.submissionTitle;
  return 'No submission title';
};

// Helper to get submission ID for navigation
const getSubmissionId = (entry) => {
  if (entry.submission?._id) return entry.submission._id;
  if (entry.submission?.id) return entry.submission.id;
  if (entry.submissionId) return entry.submissionId;
  return null;
};

// Leaderboard entry card for top 3
function TopThreeCard({ entry, rank }) {
  const navigate = useNavigate();
  const sizes = {
    1: 'col-span-full md:col-span-1 md:order-2',
    2: 'col-span-full md:col-span-1 md:order-1',
    3: 'col-span-full md:col-span-1 md:order-3'
  };
  
  const heights = {
    1: 'h-full',
    2: 'h-[95%] self-end',
    3: 'h-[90%] self-end'
  };

  const teamName = getTeamName(entry);
  const submissionTitle = getSubmissionTitle(entry);
  const submissionId = getSubmissionId(entry);

  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group",
        sizes[rank],
        rank === 1 && "ring-2 ring-yellow-400 shadow-yellow-400/20 shadow-lg"
      )}
      onClick={() => submissionId && navigate(`/submissions/${submissionId}`)}
    >
      {/* Rank Badge */}
      <div className={cn(
        "absolute top-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center",
        rank === 1 && "bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-lg shadow-yellow-500/30",
        rank === 2 && "bg-gradient-to-br from-gray-200 to-gray-400 shadow-lg shadow-gray-400/30",
        rank === 3 && "bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30"
      )}>
        {getRankIcon(rank)}
      </div>

      {/* Crown for 1st place */}
      {rank === 1 && (
        <div className="absolute top-0 right-0 p-3">
          <Crown className="text-yellow-400" size={28} />
        </div>
      )}

      <CardContent className="pt-16 pb-6 px-4">
        {/* Team Name */}
        <h3 className="text-xl font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-1 mb-2">
          {teamName}
        </h3>

        {/* Submission Title */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
          {submissionTitle}
        </p>

        {/* Stats */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary">
              {entry.avgScore?.toFixed(1) || '0.0'}
            </div>
            <div className="text-xs text-muted-foreground">Avg Score</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground">
              {entry.evaluationCount || 0}
            </div>
            <div className="text-xs text-muted-foreground">Evaluations</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Regular leaderboard table row
function LeaderboardRow({ entry, rank }) {
  const navigate = useNavigate();
  const teamName = getTeamName(entry);
  const submissionTitle = getSubmissionTitle(entry);
  const submissionId = getSubmissionId(entry);

  return (
    <tr 
      className="border-b border-border hover:bg-muted/50 transition-colors cursor-pointer group"
      onClick={() => submissionId && navigate(`/submissions/${submissionId}`)}
    >
      {/* Rank */}
      <td className="py-4 px-4 w-16">
        <Badge className={cn("w-8 h-8 flex items-center justify-center", getRankBadgeColor(rank))}>
          {rank}
        </Badge>
      </td>

      {/* Team & Submission */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-secondary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground group-hover:text-secondary transition-colors line-clamp-1">
              {teamName}
            </p>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {submissionTitle}
            </p>
          </div>
        </div>
      </td>

      {/* Average Score */}
      <td className="py-4 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <Star size={16} className="text-yellow-500 fill-yellow-500" />
          <span className="font-semibold text-foreground">
            {entry.avgScore?.toFixed(2) || '0.00'}
          </span>
        </div>
      </td>

      {/* Evaluation Count */}
      <td className="py-4 px-4 text-center hidden sm:table-cell">
        <Badge variant="outline" className="gap-1">
          <BarChart3 size={12} />
          {entry.evaluationCount || 0}
        </Badge>
      </td>

      {/* View Link */}
      <td className="py-4 px-4 text-right">
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink size={16} />
        </Button>
      </td>
    </tr>
  );
}

function LeaderboardPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [hackathon, setHackathon] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch hackathon details
      const hackathonData = await getHackathonById(hackathonId);
      setHackathon(hackathonData.hackathon);
      
      // Fetch leaderboard
      const leaderboardData = await getLeaderboard(hackathonId);
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const leaderboardData = await getLeaderboard(hackathonId);
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (err) {
      // Silent fail on refresh
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading leaderboard..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load leaderboard"
        description={error}
        onRetry={fetchData}
      />
    );
  }

  // Only show leaderboard for closed or archived hackathons
  const isLeaderboardAvailable = hackathon?.status === 'closed' || hackathon?.status === 'archived';
  
  if (hackathon && !isLeaderboardAvailable) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/hackathons/${hackathonId}`)}
          className="gap-2"
        >
          <ArrowLeft size={18} />
          Back to Hackathon
        </Button>
        
        <EmptyState
          icon={Trophy}
          title="Leaderboard Not Available Yet"
          description={`The leaderboard will be available once the hackathon is closed. Current status: ${hackathon.status}.`}
        />
      </div>
    );
  }

  const statusConfig = hackathon ? getStatusConfig(hackathon.status) : null;
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/hackathons/${hackathonId}`)}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back to Hackathon
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="text-secondary" size={32} />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Leaderboard
            </h1>
          </div>
          {hackathon && (
            <div className="flex items-center gap-2">
              <Link 
                to={`/hackathons/${hackathonId}`}
                className="text-muted-foreground hover:text-secondary transition-colors"
              >
                {hackathon.title}
              </Link>
              {statusConfig && (
                <Badge className={cn("text-xs", statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Empty State */}
      {leaderboard.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No rankings yet"
          description="The leaderboard will appear once judges have submitted their evaluations."
        />
      ) : (
        <>
          {/* Top 3 Podium */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {topThree.map((entry, index) => (
                <TopThreeCard 
                  key={entry.submission?._id || entry.team?._id || index} 
                  entry={entry} 
                  rank={entry.rank || index + 1} 
                />
              ))}
            </div>
          )}

          {/* Stats Summary */}
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-foreground">{leaderboard.length}</div>
                  <div className="text-sm text-muted-foreground">Teams Ranked</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">
                    {topThree[0]?.avgScore?.toFixed(1) || '-'}
                  </div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {leaderboard.reduce((sum, e) => sum + (e.evaluationCount || 0), 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Evaluations</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {leaderboard.length > 0 
                      ? (leaderboard.reduce((sum, e) => sum + (e.avgScore || 0), 0) / leaderboard.length).toFixed(1)
                      : '-'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Full Leaderboard Table */}
          {rest.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  Full Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground w-16">
                          Rank
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                          Team / Submission
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground">
                          Score
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground hidden sm:table-cell">
                          Reviews
                        </th>
                        <th className="py-3 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {rest.map((entry, index) => (
                        <LeaderboardRow 
                          key={entry.submission?._id || entry.team?._id || index + 3} 
                          entry={entry} 
                          rank={entry.rank || index + 4} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full table for all if only top 3 or less */}
          {rest.length === 0 && topThree.length > 0 && topThree.length <= 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp size={20} />
                  All Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground w-16">
                          Rank
                        </th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-muted-foreground">
                          Team / Submission
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground">
                          Score
                        </th>
                        <th className="py-3 px-4 text-center text-sm font-medium text-muted-foreground hidden sm:table-cell">
                          Reviews
                        </th>
                        <th className="py-3 px-4 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {topThree.map((entry, index) => (
                        <LeaderboardRow 
                          key={entry.submission?._id || entry.team?._id || index} 
                          entry={entry} 
                          rank={entry.rank || index + 1} 
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default LeaderboardPage;
