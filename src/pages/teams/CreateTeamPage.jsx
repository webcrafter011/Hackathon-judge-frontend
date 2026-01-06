import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Users, 
  Trophy, 
  ArrowLeft,
  Info,
  AlertCircle
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Label,
  Alert,
  LoadingScreen,
  ErrorState
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { createTeam } from '../../services/teamService';
import { getHackathonById } from '../../services/hackathonService';
import { formatDate } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

const createTeamSchema = z.object({
  name: z.string()
    .min(2, 'Team name must be at least 2 characters')
    .max(50, 'Team name must be less than 50 characters'),
  contactEmail: z.string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
});

function CreateTeamPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const hackathonId = searchParams.get('hackathon');
  
  const [hackathon, setHackathon] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      contactEmail: user?.email || '',
    },
  });

  // Set user email as default
  useEffect(() => {
    if (user?.email) {
      setValue('contactEmail', user.email);
    }
  }, [user, setValue]);

  // Fetch hackathon details
  useEffect(() => {
    const fetchHackathon = async () => {
      if (!hackathonId) {
        setError('No hackathon selected');
        setIsLoading(false);
        return;
      }

      try {
        const data = await getHackathonById(hackathonId);
        setHackathon(data.hackathon);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hackathon');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHackathon();
  }, [hackathonId]);

  const onSubmit = async (data) => {
    setSubmitError(null);
    try {
      const response = await createTeam({
        hackathonId,
        name: data.name,
        contactEmail: data.contactEmail || undefined,
      });
      navigate(`/teams/${response.team._id}`, { replace: true });
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to create team');
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading hackathon details..." />;
  }

  if (error || !hackathon) {
    return (
      <ErrorState 
        title="Cannot create team" 
        message={error || "Please select a hackathon first."}
        action={() => navigate('/hackathons')}
        actionLabel="Browse Hackathons"
      />
    );
  }

  // Check if registration is open
  // 1. Hackathon status must be 'open' or 'running'
  // 2. registration.open must not be explicitly set to false
  const isValidStatus = hackathon.status === 'open' || hackathon.status === 'running';
  const isRegistrationEnabled = hackathon.registration?.open !== false;
  const isRegistrationOpen = isValidStatus && isRegistrationEnabled;

  if (!isRegistrationOpen) {
    let message = 'Team registration for this hackathon is currently closed.';
    
    if (!isValidStatus) {
      const statusMessages = {
        draft: 'This hackathon is not yet published.',
        closed: 'This hackathon has ended and team registration is closed.',
        archived: 'This hackathon has been archived.',
      };
      message = statusMessages[hackathon.status] || message;
    } else if (!isRegistrationEnabled) {
      message = 'The organizer has temporarily closed team registration for this hackathon.';
    }
    
    return (
      <ErrorState 
        title="Registration Closed" 
        message={message}
        action={() => navigate(`/hackathons/${hackathonId}`)}
        actionLabel="View Hackathon"
      />
    );
  }

  const teamConstraints = hackathon.teamConstraints || {};

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create a Team</h1>
        <p className="text-muted-foreground mt-1">
          Start a new team for this hackathon
        </p>
      </div>

      {/* Hackathon Info */}
      <Card className="bg-secondary/5 border-secondary/20">
        <CardContent className="p-4">
          <Link 
            to={`/hackathons/${hackathonId}`}
            className="flex items-center gap-3 hover:text-secondary transition-colors"
          >
            <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center shrink-0">
              <Trophy size={24} className="text-secondary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{hackathon.title}</p>
              <p className="text-sm text-muted-foreground">
                {formatDate(hackathon.startAt)} - {formatDate(hackathon.endAt)}
              </p>
            </div>
          </Link>
        </CardContent>
      </Card>

      {/* Team Constraints Info */}
      {(teamConstraints.minSize || teamConstraints.maxSize) && (
        <Alert>
          <Info size={16} />
          <div>
            <p className="font-medium">Team Requirements</p>
            <ul className="text-sm mt-1 space-y-0.5">
              {teamConstraints.minSize && (
                <li>• Minimum {teamConstraints.minSize} member{teamConstraints.minSize > 1 ? 's' : ''}</li>
              )}
              {teamConstraints.maxSize && (
                <li>• Maximum {teamConstraints.maxSize} member{teamConstraints.maxSize > 1 ? 's' : ''}</li>
              )}
              {teamConstraints.allowSolo === false && (
                <li>• Solo participation not allowed</li>
              )}
            </ul>
          </div>
        </Alert>
      )}

      {/* Create Team Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={20} className="text-secondary" />
            Team Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <Alert variant="error">
                <AlertCircle size={16} />
                {submitError}
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                placeholder="Enter your team name"
                {...register('name')}
                error={errors.name?.message}
              />
              {errors.name && (
                <p className="text-sm text-error">{errors.name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Choose a unique and memorable name for your team
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="team@example.com"
                {...register('contactEmail')}
                error={errors.contactEmail?.message}
              />
              {errors.contactEmail && (
                <p className="text-sm text-error">{errors.contactEmail.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                This email will be visible to potential team members and organizers
              </p>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg mb-4">
                <Info size={18} className="text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  You will automatically become the team leader. You can invite other participants to join your team after creation.
                </p>
              </div>
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/hackathons/${hackathonId}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating Team...' : 'Create Team'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateTeamPage;
