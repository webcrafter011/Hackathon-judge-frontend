import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Eye,
  Calendar,
  Trophy,
  Users,
  FileText,
  Settings,
  AlertCircle,
  Upload,
  Image,
  X,
  MoreHorizontal
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  Alert,
  Badge,
  LoadingScreen
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import {
  createHackathon,
  updateHackathon,
  getHackathonById,
  HACKATHON_VISIBILITY
} from '../../services/hackathonService';
import { uploadHackathonBanner } from '../../services/assetService';
import { cn, getErrorMessage } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

// Validation schema
const hackathonSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  startAt: z.string().min(1, 'Start date is required'),
  endAt: z.string().min(1, 'End date is required'),
  submissionDeadline: z.string().optional(),
  visibility: z.enum(['public', 'private', 'unlisted']),
  rules: z.string().optional(),
  tags: z.string().optional(),
  contactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  teamConstraints: z.object({
    minSize: z.coerce.number().min(1).max(10),
    maxSize: z.coerce.number().min(1).max(20),
    allowSolo: z.boolean(),
  }),
  prizes: z.array(z.object({
    rank: z.coerce.number().min(1),
    title: z.string().min(1, 'Prize title is required'),
    description: z.string().optional(),
    value: z.string().min(1, 'Prize value is required'),
  })).optional(),
}).refine((data) => new Date(data.endAt) > new Date(data.startAt), {
  message: 'End date must be after start date',
  path: ['endAt'],
}).refine((data) => data.teamConstraints.maxSize >= data.teamConstraints.minSize, {
  message: 'Max size must be greater than or equal to min size',
  path: ['teamConstraints.maxSize'],
});

function HackathonFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('basic');
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Banner state
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(hackathonSchema),
    defaultValues: {
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      submissionDeadline: '',
      visibility: 'public',
      rules: '',
      tags: '',
      contactEmail: '',
      teamConstraints: {
        minSize: 2,
        maxSize: 5,
        allowSolo: false,
      },
      prizes: [
        { rank: 1, title: 'First Place', description: '', value: '' },
      ],
    },
  });

  const { fields: prizeFields, append: appendPrize, remove: removePrize } = useFieldArray({
    control,
    name: 'prizes',
  });

  // Fetch hackathon data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchHackathon = async () => {
        setIsFetching(true);
        try {
          const data = await getHackathonById(id);
          const h = data.hackathon;

          // Format dates for input[type="datetime-local"]
          const formatDateForInput = (date) => {
            if (!date) return '';
            return new Date(date).toISOString().slice(0, 16);
          };

          reset({
            title: h.title || '',
            description: h.description || '',
            startAt: formatDateForInput(h.startAt),
            endAt: formatDateForInput(h.endAt),
            submissionDeadline: formatDateForInput(h.submissionDeadline),
            visibility: h.visibility || 'public',
            rules: h.rules || '',
            tags: h.tags?.join(', ') || '',
            contactEmail: h.contactEmail || '',
            teamConstraints: h.teamConstraints || { minSize: 2, maxSize: 5, allowSolo: false },
            prizes: h.prizes?.length > 0 ? h.prizes : [{ rank: 1, title: 'First Place', description: '', value: '' }],
          });

          // Set banner URL if available (enriched by hackathonService)
          if (h.bannerUrl) {
            setCurrentBannerUrl(h.bannerUrl);
          }
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setIsFetching(false);
        }
      };
      fetchHackathon();
    }
  }, [id, isEditing, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      // Process tags
      const tags = data.tags
        ? data.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [];

      // Process prizes
      const prizes = data.prizes?.filter(p => p.title && p.value) || [];

      const payload = {
        ...data,
        tags,
        prizes,
        startAt: new Date(data.startAt).toISOString(),
        endAt: new Date(data.endAt).toISOString(),
        submissionDeadline: data.submissionDeadline
          ? new Date(data.submissionDeadline).toISOString()
          : undefined,
      };

      if (isEditing) {
        await updateHackathon(id, payload);
      } else {
        await createHackathon(payload);
      }

      navigate('/my/hackathons');
    } catch (err) {
      setError(getErrorMessage(err));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle banner file selection
  const handleBannerSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setBannerMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setBannerMessage({ type: 'error', text: 'Image must be less than 5MB' });
      return;
    }

    setBannerFile(file);
    setBannerMessage(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload banner
  const handleBannerUpload = async () => {
    if (!bannerFile || !id) {
      setBannerMessage({ type: 'error', text: 'Please select a banner image first' });
      return;
    }

    setIsUploadingBanner(true);
    setBannerMessage(null);

    try {
      const result = await uploadHackathonBanner(id, bannerFile);
      console.log('Banner upload result:', result);

      // Get the URL from the response
      const bannerUrl = result.asset?.storageUrl || result.asset?.url || result.url;
      if (bannerUrl) {
        setCurrentBannerUrl(bannerUrl);
      }

      setBannerMessage({ type: 'success', text: 'Banner uploaded successfully!' });
      setBannerFile(null);
      setBannerPreview(null);
    } catch (err) {
      console.error('Banner upload error:', err);
      setBannerMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  // Remove banner preview (cancel selection)
  const handleBannerRemove = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setBannerMessage(null);
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: FileText },
    { id: 'dates', label: 'Dates', icon: Calendar },
    { id: 'team', label: 'Team Settings', icon: Users },
    { id: 'prizes', label: 'Prizes', icon: Trophy },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ];

  if (isFetching) {
    return <LoadingScreen message="Loading hackathon..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="gap-2 mb-2"
          >
            <ArrowLeft size={18} />
            Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {isEditing ? 'Edit Hackathon' : 'Create Hackathon'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing
              ? 'Update your hackathon details'
              : 'Set up a new hackathon for participants'
            }
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error">
          <AlertCircle size={16} />
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section Navigation */}
        {/* Desktop: Show all tabs */}
        <div className="hidden sm:flex gap-2 pb-2">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeSection === section.id
                  ? 'bg-secondary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </div>

        {/* Mobile: Show first 3 tabs + overflow menu */}
        <div className="flex sm:hidden gap-2 pb-2">
          {sections.slice(0, 2).map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                activeSection === section.id
                  ? 'bg-secondary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}

          {/* Overflow menu for remaining sections */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn(
                'flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                sections.slice(2).some(s => s.id === activeSection)
                  ? 'bg-secondary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Dropdown menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-card border border-border rounded-lg shadow-lg py-1">
                {sections.slice(2).map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      setShowMoreMenu(false);
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors text-left',
                      activeSection === section.id
                        ? 'bg-secondary/10 text-secondary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <section.icon size={16} />
                    {section.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Basic Info Section */}
        {activeSection === 'basic' && (
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set the title, description, and visibility of your hackathon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" required>Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Spring Hackathon 2026"
                  error={errors.title}
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-error">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" required>Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your hackathon, its theme, and what participants can expect..."
                  rows={5}
                  error={errors.description}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-error">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  id="visibility"
                  {...register('visibility')}
                >
                  <option value="public">Public - Anyone can view and join</option>
                  <option value="private">Private - Invite only</option>
                  <option value="unlisted">Unlisted - Only accessible via link</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="e.g., AI, Web, Mobile (comma separated)"
                  {...register('tags')}
                />
                <p className="text-xs text-muted-foreground">Separate tags with commas</p>
              </div>

              {/* Banner Upload - Only show when editing */}
              {isEditing && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <Label>Hackathon Banner</Label>
                  <p className="text-xs text-muted-foreground">
                    Upload a banner image for your hackathon (recommended: 1200x400px, max 5MB)
                  </p>

                  {/* Current Banner Preview */}
                  {(currentBannerUrl || bannerPreview) && (
                    <div className="relative rounded-lg overflow-hidden border border-border">
                      <img
                        src={bannerPreview || currentBannerUrl}
                        alt="Banner preview"
                        className="w-full h-40 object-cover"
                      />
                      {bannerPreview && (
                        <button
                          type="button"
                          onClick={handleBannerRemove}
                          className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Upload Area */}
                  {!bannerPreview && (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col items-center justify-center py-4">
                        <Image className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-secondary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (max 5MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleBannerSelect}
                      />
                    </label>
                  )}

                  {/* Upload Button (when file is selected) */}
                  {bannerFile && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleBannerUpload}
                        disabled={isUploadingBanner}
                        className="flex-1"
                      >
                        {isUploadingBanner ? (
                          <>
                            <span className="animate-spin mr-2">⏳</span>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload Banner
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBannerRemove}
                        disabled={isUploadingBanner}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {/* Banner Message */}
                  {bannerMessage && (
                    <Alert variant={bannerMessage.type === 'success' ? 'success' : 'error'}>
                      {bannerMessage.text}
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dates Section */}
        {activeSection === 'dates' && (
          <Card>
            <CardHeader>
              <CardTitle>Event Dates</CardTitle>
              <CardDescription>Set the start, end, and submission deadline for your hackathon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startAt" required>Start Date & Time</Label>
                  <Input
                    id="startAt"
                    type="datetime-local"
                    error={errors.startAt}
                    {...register('startAt')}
                  />
                  {errors.startAt && (
                    <p className="text-sm text-error">{errors.startAt.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endAt" required>End Date & Time</Label>
                  <Input
                    id="endAt"
                    type="datetime-local"
                    error={errors.endAt}
                    {...register('endAt')}
                  />
                  {errors.endAt && (
                    <p className="text-sm text-error">{errors.endAt.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionDeadline">Submission Deadline</Label>
                <Input
                  id="submissionDeadline"
                  type="datetime-local"
                  {...register('submissionDeadline')}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to use the end date as the deadline
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Settings Section */}
        {activeSection === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure team size limits and participation rules</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minSize">Minimum Team Size</Label>
                  <Input
                    id="minSize"
                    type="number"
                    min={1}
                    max={10}
                    {...register('teamConstraints.minSize')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxSize">Maximum Team Size</Label>
                  <Input
                    id="maxSize"
                    type="number"
                    min={1}
                    max={20}
                    error={errors.teamConstraints?.maxSize}
                    {...register('teamConstraints.maxSize')}
                  />
                  {errors.teamConstraints?.maxSize && (
                    <p className="text-sm text-error">{errors.teamConstraints.maxSize.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="allowSolo"
                  className="w-4 h-4 text-secondary rounded border-border focus:ring-secondary"
                  {...register('teamConstraints.allowSolo')}
                />
                <div>
                  <Label htmlFor="allowSolo" className="cursor-pointer">Allow Solo Participation</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow participants to join without forming a team
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Prizes Section */}
        {activeSection === 'prizes' && (
          <Card>
            <CardHeader>
              <CardTitle>Prizes</CardTitle>
              <CardDescription>Add prizes for winners</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {prizeFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-border rounded-lg space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">Prize #{index + 1}</Badge>
                    {prizeFields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removePrize(index)}
                        className="text-error hover:text-error"
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Rank</Label>
                      <Input
                        type="number"
                        min={1}
                        {...register(`prizes.${index}.rank`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        placeholder="e.g., First Place"
                        {...register(`prizes.${index}.title`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Value</Label>
                      <Input
                        placeholder="e.g., $5000"
                        {...register(`prizes.${index}.value`)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (Optional)</Label>
                    <Input
                      placeholder="Additional details about the prize"
                      {...register(`prizes.${index}.description`)}
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={() => appendPrize({
                  rank: prizeFields.length + 1,
                  title: '',
                  description: '',
                  value: ''
                })}
                className="w-full"
              >
                <Plus size={16} />
                Add Prize
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Advanced Section */}
        {activeSection === 'advanced' && (
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Rules, guidelines, and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rules">Rules & Guidelines</Label>
                <Textarea
                  id="rules"
                  placeholder="Enter the rules and guidelines for your hackathon..."
                  rows={8}
                  {...register('rules')}
                />
                <p className="text-xs text-muted-foreground">
                  You can use line breaks for formatting
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contact@example.com"
                  error={errors.contactEmail}
                  {...register('contactEmail')}
                />
                {errors.contactEmail && (
                  <p className="text-sm text-error">{errors.contactEmail.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Public email for participants to contact you
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="sm:ml-auto"
          >
            <Save size={16} />
            {isEditing ? 'Save Changes' : 'Create Hackathon'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default HackathonFormPage;
