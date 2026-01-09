import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { Button } from '../../components/ui';
import { Trophy, Users, FileText, BarChart3, Plus, Settings, Scale, UserCheck } from 'lucide-react';
import { getMyTeams } from '../../services/teamService';
import { getHackathons } from '../../services/hackathonService';
import { getMyAssignments } from '../../services/assignmentService';

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Dashboard stats state
  const [stats, setStats] = useState({
    hackathons: 0,
    teams: 0,
    submissions: 0,
    evaluations: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!user) return;

    setIsLoadingStats(true);
    try {
      // Fetch teams count and submissions count
      const teamsResponse = await getMyTeams();
      const myTeams = teamsResponse?.teams || [];
      const teamsCount = myTeams.length;

      // Count submissions from teams that have submitted
      const submissionsCount = myTeams.filter(team => team.hasSubmitted || team.submission).length;

      // Fetch active hackathons count
      const hackathonsResponse = await getHackathons({ status: 'open', limit: 100 });
      const activeHackathons = hackathonsResponse?.hackathons || [];
      const hackathonsCount = activeHackathons.length;

      // For judges/admins, fetch pending evaluations count
      let evaluationsCount = 0;
      if (user.role === 'judge' || user.role === 'admin') {
        try {
          // Get all hackathons and check for assignments
          const allHackathonsResponse = await getHackathons({ limit: 100 });
          const allHackathons = allHackathonsResponse?.hackathons || [];

          for (const hackathon of allHackathons) {
            try {
              const assignmentData = await getMyAssignments(hackathon._id);
              if (assignmentData?.stats) {
                const assigned = assignmentData.stats.assigned || 0;
                const evaluated = assignmentData.stats.evaluated || 0;
                evaluationsCount += Math.max(0, assigned - evaluated);
              }
            } catch (e) {
              // Not assigned to this hackathon - skip
            }
          }
        } catch (e) {
          console.warn('Could not fetch evaluations:', e);
        }
      }

      setStats({
        hackathons: hackathonsCount,
        teams: teamsCount,
        submissions: submissionsCount,
        evaluations: evaluationsCount
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const getRoleDisplay = (role) => {
    const roleConfig = {
      admin: { label: 'Administrator', color: 'bg-error/10 text-error' },
      organizer: { label: 'Organizer', color: 'bg-info/10 text-info' },
      judge: { label: 'Judge', color: 'bg-warning/10 text-warning' },
      participant: { label: 'Participant', color: 'bg-success/10 text-success' },
    };
    return roleConfig[role] || { label: role, color: 'bg-muted text-muted-foreground' };
  };

  const roleInfo = getRoleDisplay(user?.role);
  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';
  const isJudge = user?.role === 'judge' || user?.role === 'admin';

  // Role-specific quick actions
  const getQuickActions = () => {
    const baseActions = [
      {
        title: 'Browse Hackathons',
        description: 'Discover and join exciting hackathons',
        icon: Trophy,
        onClick: () => navigate('/hackathons'),
      },
      {
        title: 'My Teams',
        description: 'Manage your teams and members',
        icon: Users,
        onClick: () => navigate('/my/teams'),
      },
      {
        title: 'My Submissions',
        description: 'View and manage your project submissions',
        icon: FileText,
        onClick: () => navigate('/my/submissions'),
      },
    ];

    if (isOrganizer) {
      return [
        {
          title: 'Create Hackathon',
          description: 'Start a new hackathon event',
          icon: Plus,
          onClick: () => navigate('/hackathons/create'),
          highlight: true,
        },
        {
          title: 'My Hackathons',
          description: 'Manage hackathons you organize',
          icon: Trophy,
          onClick: () => navigate('/my/hackathons'),
        },
        ...baseActions,
      ];
    }

    if (isJudge) {
      return [
        {
          title: 'My Evaluations',
          description: 'Review submissions assigned to you',
          icon: BarChart3,
          onClick: () => navigate('/my/evaluations'),
          highlight: true,
        },
        ...baseActions,
      ];
    }

    return baseActions;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Here's an overview of your hackathon activities.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          icon={Trophy}
          label="Hackathons"
          value={stats.hackathons}
          description="Active hackathons"
          color="text-secondary"
          bgColor="bg-secondary/10"
          isLoading={isLoadingStats}
        />
        <StatCard
          icon={Users}
          label="Teams"
          value={stats.teams}
          description="Your teams"
          color="text-info"
          bgColor="bg-info/10"
          isLoading={isLoadingStats}
        />
        <StatCard
          icon={FileText}
          label="Submissions"
          value={stats.submissions}
          description="Total submissions"
          color="text-success"
          bgColor="bg-success/10"
          isLoading={isLoadingStats}
        />
        <StatCard
          icon={BarChart3}
          label="Evaluations"
          value={stats.evaluations}
          description="Pending reviews"
          color="text-warning"
          bgColor="bg-warning/10"
          isLoading={isLoadingStats}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-primary rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getQuickActions().map((action, index) => (
            <QuickActionCard
              key={index}
              title={action.title}
              description={action.description}
              icon={action.icon}
              onClick={action.onClick}
              highlight={action.highlight}
            />
          ))}
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="bg-primary rounded-xl border border-border p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
          <Trophy size={32} className="text-secondary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Dashboard Coming Soon
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          We're building an amazing dashboard experience for you.
          Stay tuned for detailed analytics, activity feeds, and more!
        </p>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, description, color, bgColor, isLoading }) {
  return (
    <div className="bg-primary rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? (
            <div className="h-9 w-16 mt-1 bg-muted rounded-md animate-pulse" />
          ) : (
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon size={24} className={color} />
        </div>
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ title, description, icon: Icon, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-4 p-4 rounded-lg border transition-all text-left group ${highlight
        ? 'border-secondary bg-secondary/5 hover:bg-secondary/10'
        : 'border-border hover:border-secondary hover:bg-secondary/5'
        }`}
    >
      <div className={`p-2 rounded-lg transition-colors ${highlight
        ? 'bg-secondary/20 group-hover:bg-secondary/30'
        : 'bg-secondary/10 group-hover:bg-secondary/20'
        }`}>
        <Icon size={20} className="text-secondary" />
      </div>
      <div>
        <h3 className="font-medium text-foreground group-hover:text-secondary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

export default DashboardPage;
