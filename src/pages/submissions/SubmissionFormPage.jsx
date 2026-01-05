import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft,
  Save,
  Send,
  Trophy,
  Users,
  Link as LinkIcon,
  FileText,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Trash2,
  Image
} from 'lucide-react';
import { 
  Button, 
  Input, 
  Textarea,
  Badge, 
  LoadingScreen, 
  ErrorState,
  Alert
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui';
import { 
  saveSubmission, 
  getMySubmission,
  markSubmissionFinal,
  uploadSubmissionAssets,
  removeAssetFromSubmission,
  getSubmissionStatus,
  isDeadlinePassed
} from '../../services/submissionService';
import { getHackathonById } from '../../services/hackathonService';
import { formatDate, formatDateTime, cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

const submissionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description too long'),
  repoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  demoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

function SubmissionFormPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Get passed state or fetch
  const passedState = location.state;
  
  const [hackathon, setHackathon] = useState(passedState?.hackathon || null);
  const [team, setTeam] = useState(passedState?.team || null);
  const [submission, setSubmission] = useState(passedState?.submission || null);
  const [isLoading, setIsLoading] = useState(!passedState);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // File upload state
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [assets, setAssets] = useState(submission?.assets || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      title: submission?.title || '',
      description: submission?.description || '',
      repoUrl: submission?.repoUrl || '',
      demoUrl: submission?.demoUrl || '',
    }
  });

  // Fetch data if not passed
  useEffect(() => {
    const fetchData = async () => {
      if (passedState?.hackathon && passedState?.team) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch hackathon
        const hackathonData = await getHackathonById(hackathonId);
        setHackathon(hackathonData.hackathon);
        
        // Fetch submission (might not exist)
        try {
          const submissionData = await getMySubmission(hackathonId);
          setSubmission(submissionData.submission);
          setTeam(submissionData.team);
          setAssets(submissionData.submission?.assets || []);
          
          // Update form with existing data
          reset({
            title: submissionData.submission?.title || '',
            description: submissionData.submission?.description || '',
            repoUrl: submissionData.submission?.repoUrl || '',
            demoUrl: submissionData.submission?.demoUrl || '',
          });
        } catch (err) {
          // No submission yet - that's okay
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hackathonId, passedState, reset]);

  const deadline = hackathon?.submissionDeadline || hackathon?.endAt;
  const deadlinePassed = deadline && isDeadlinePassed({ submissionDeadline: deadline });
  const isFinal = submission?.isFinal;
  const canEdit = !deadlinePassed && !isFinal;
  const statusConfig = getSubmissionStatus(submission);

  const onSubmit = async (data, asFinal = false) => {
    if (!team?._id) {
      setSaveMessage({ type: 'error', text: 'No team found for this hackathon' });
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const result = await saveSubmission({
        teamId: team._id,
        title: data.title,
        description: data.description,
        repoUrl: data.repoUrl || undefined,
        demoUrl: data.demoUrl || undefined,
        isFinal: asFinal
      });
      
      setSubmission(result.submission);
      setSaveMessage({ 
        type: 'success', 
        text: asFinal ? 'Submission marked as final!' : 'Submission saved as draft' 
      });
      
      // If final, navigate back after delay
      if (asFinal) {
        setTimeout(() => navigate('/my/submissions'), 2000);
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save submission' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkFinal = async () => {
    if (!submission?._id) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to mark this submission as final? You won\'t be able to make changes after this.'
    );
    
    if (!confirmed) return;
    
    setIsSaving(true);
    try {
      const result = await markSubmissionFinal(submission._id);
      setSubmission(result.submission);
      setSaveMessage({ type: 'success', text: 'Submission marked as final!' });
      setTimeout(() => navigate('/my/submissions'), 2000);
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to finalize submission' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !submission?._id) return;
    
    setUploadingFiles(true);
    try {
      const result = await uploadSubmissionAssets(submission._id, files);
      setAssets(prev => [...prev, ...(result.assets || [])]);
      setSaveMessage({ type: 'success', text: `${files.length} file(s) uploaded` });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to upload files' });
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleRemoveAsset = async (assetId) => {
    if (!submission?._id) return;
    
    try {
      await removeAssetFromSubmission(submission._id, assetId);
      setAssets(prev => prev.filter(a => a._id !== assetId));
      setSaveMessage({ type: 'success', text: 'File removed' });
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to remove file' });
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading submission..." />;
  }

  if (error) {
    return (
      <ErrorState 
        title="Failed to load" 
        description={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        onClick={() => navigate('/my/submissions')}
        className="gap-2"
      >
        <ArrowLeft size={18} />
        Back to Submissions
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {submission ? 'Edit Submission' : 'Create Submission'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {hackathon?.title || 'Hackathon'}
          </p>
        </div>
        <Badge className={statusConfig.color}>
          {statusConfig.icon} {statusConfig.label}
        </Badge>
      </div>

      {/* Deadline Warning */}
      {deadline && (
        <Alert variant={deadlinePassed ? 'destructive' : 'default'}>
          <Clock size={16} />
          <span>
            Submission deadline: {formatDateTime(deadline)}
            {deadlinePassed && ' (Deadline has passed)'}
          </span>
        </Alert>
      )}

      {/* Final Warning */}
      {isFinal && (
        <Alert>
          <CheckCircle size={16} />
          <span>This submission has been marked as final and cannot be edited.</span>
        </Alert>
      )}

      {saveMessage && (
        <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
          {saveMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{saveMessage.text}</span>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Project Title *
                  </label>
                  <Input
                    {...register('title')}
                    placeholder="Enter your project title"
                    disabled={!canEdit}
                    error={errors.title?.message}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description *
                  </label>
                  <Textarea
                    {...register('description')}
                    placeholder="Describe your project, its features, and how it addresses the hackathon theme..."
                    rows={6}
                    disabled={!canEdit}
                    error={errors.description?.message}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {watch('description')?.length || 0} / 5000 characters (minimum 50)
                  </p>
                </div>

                {/* Repository URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <LinkIcon size={14} className="inline mr-1" />
                    Repository URL
                  </label>
                  <Input
                    {...register('repoUrl')}
                    type="url"
                    placeholder="https://github.com/username/project"
                    disabled={!canEdit}
                    error={errors.repoUrl?.message}
                  />
                </div>

                {/* Demo URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <ExternalLink size={14} className="inline mr-1" />
                    Demo URL
                  </label>
                  <Input
                    {...register('demoUrl')}
                    type="url"
                    placeholder="https://your-demo.vercel.app"
                    disabled={!canEdit}
                    error={errors.demoUrl?.message}
                  />
                </div>

                {/* Actions */}
                {canEdit && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
                    <Button
                      type="submit"
                      variant="outline"
                      className="flex-1"
                      disabled={isSaving}
                    >
                      <Save size={18} />
                      {isSaving ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    
                    {submission && !submission.isFinal && (
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={handleMarkFinal}
                        disabled={isSaving}
                      >
                        <Send size={18} />
                        {isSaving ? 'Processing...' : 'Mark as Final'}
                      </Button>
                    )}
                    
                    {!submission && (
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={handleSubmit((data) => onSubmit(data, true))}
                        disabled={isSaving}
                      >
                        <Send size={18} />
                        Save & Mark Final
                      </Button>
                    )}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users size={18} className="text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{team?.name || 'Unknown Team'}</p>
                  <p className="text-sm text-muted-foreground">
                    {team?.members?.length || 0} members
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Files & Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Button */}
              {canEdit && submission && (
                <div>
                  <label className="cursor-pointer">
                    <div className={cn(
                      'border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-secondary transition-colors',
                      uploadingFiles && 'opacity-50 pointer-events-none'
                    )}>
                      <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {uploadingFiles ? 'Uploading...' : 'Click to upload files'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Images, PDFs, videos (max 10MB each)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,video/*"
                    />
                  </label>
                </div>
              )}

              {/* Asset List */}
              {assets.length > 0 ? (
                <div className="space-y-2">
                  {assets.map((asset) => (
                    <div 
                      key={asset._id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Image size={16} className="text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{asset.filename || asset.originalName || 'File'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {asset.url && (
                          <a
                            href={asset.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-muted rounded"
                          >
                            <ExternalLink size={14} className="text-muted-foreground" />
                          </a>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveAsset(asset._id)}
                            className="p-1 hover:bg-muted rounded text-error"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {submission ? 'No files uploaded yet' : 'Save submission first to upload files'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Links */}
          {submission && (submission.repoUrl || submission.demoUrl) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-secondary"
                  >
                    <LinkIcon size={16} />
                    View Repository
                    <ExternalLink size={12} className="ml-auto" />
                  </a>
                )}
                {submission.demoUrl && (
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-secondary"
                  >
                    <ExternalLink size={16} />
                    View Demo
                    <ExternalLink size={12} className="ml-auto" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionFormPage;
