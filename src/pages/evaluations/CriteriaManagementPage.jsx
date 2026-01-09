import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  GripVertical,
  Loader2,
  Scale,
  Info
} from 'lucide-react';
import {
  Button,
  Input,
  Label,
  Textarea,
  Badge,
  Alert,
  LoadingScreen,
  ErrorState
} from '../../components/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui';
import { getHackathonById } from '../../services/hackathonService';
import { getCriteria, setCriteria } from '../../services/evaluationService';
import { cn } from '../../lib/utils';
import useAuthStore from '../../store/authStore';

// Validation schema
const criteriaSchema = z.object({
  items: z.array(z.object({
    key: z.string().min(1, 'Key is required').regex(/^[a-z_]+$/, 'Key must be lowercase letters and underscores only'),
    label: z.string().min(1, 'Label is required').max(50, 'Label must be under 50 characters'),
    description: z.string().max(200, 'Description must be under 200 characters').optional(),
    maxScore: z.coerce.number().min(1, 'Must be at least 1').max(100, 'Must be at most 100'),
    weight: z.coerce.number().min(0, 'Must be at least 0').max(10, 'Must be at most 10'),
  })).min(1, 'At least one criterion is required'),
});

// Default criteria templates
const CRITERIA_TEMPLATES = {
  standard: [
    { key: 'innovation', label: 'Innovation & Creativity', description: 'How creative and innovative is the solution?', maxScore: 10, weight: 2 },
    { key: 'technical', label: 'Technical Implementation', description: 'Quality of code, architecture, and technical execution', maxScore: 10, weight: 2 },
    { key: 'design', label: 'UI/UX Design', description: 'Visual design and user experience', maxScore: 10, weight: 1.5 },
    { key: 'impact', label: 'Business Impact', description: 'Potential real-world impact and viability', maxScore: 10, weight: 1.5 },
    { key: 'presentation', label: 'Presentation', description: 'Quality of demo and pitch', maxScore: 10, weight: 1 },
  ],
  minimal: [
    { key: 'overall', label: 'Overall Score', description: 'Overall quality of the submission', maxScore: 100, weight: 1 },
  ],
  detailed: [
    { key: 'innovation', label: 'Innovation', description: 'Originality and creativity', maxScore: 10, weight: 1.5 },
    { key: 'technical', label: 'Technical Complexity', description: 'Difficulty and sophistication of implementation', maxScore: 10, weight: 1.5 },
    { key: 'code_quality', label: 'Code Quality', description: 'Clean, readable, maintainable code', maxScore: 10, weight: 1 },
    { key: 'design', label: 'UI/UX Design', description: 'User experience and visual design', maxScore: 10, weight: 1.5 },
    { key: 'functionality', label: 'Functionality', description: 'Features work correctly', maxScore: 10, weight: 1.5 },
    { key: 'documentation', label: 'Documentation', description: 'README, comments, and instructions', maxScore: 10, weight: 1 },
    { key: 'presentation', label: 'Presentation', description: 'Demo and pitch quality', maxScore: 10, weight: 1 },
    { key: 'impact', label: 'Real-World Impact', description: 'Potential to solve actual problems', maxScore: 10, weight: 1 },
  ],
};

function CriteriaManagementPage() {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [hackathon, setHackathon] = useState(null);
  const [existingCriteria, setExistingCriteria] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(criteriaSchema),
    defaultValues: {
      items: CRITERIA_TEMPLATES.standard,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const totalWeight = watchItems?.reduce((sum, item) => sum + (Number(item.weight) || 0), 0) || 0;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [hackathonData, criteriaData] = await Promise.all([
        getHackathonById(hackathonId),
        getCriteria(hackathonId).catch(() => null),
      ]);

      setHackathon(hackathonData.hackathon);

      if (criteriaData?.criteria?.items?.length > 0) {
        setExistingCriteria(criteriaData.criteria);
        reset({ items: criteriaData.criteria.items });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [hackathonId, reset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Permissions - handle multiple ID formats
  const userId = user?.id || user?._id;
  const getOrgId = () => {
    const org = hackathon?.organizerId || hackathon?.organizer;
    if (!org) return null;
    if (typeof org === 'string') return org;
    return org.id || org._id;
  };
  const organizerId = getOrgId();
  const isOrganizer = !!(organizerId && userId && String(organizerId) === String(userId));
  const isAdmin = user?.role === 'admin';
  const canManage = isOrganizer || isAdmin;

  const onSubmit = async (data) => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      await setCriteria(hackathonId, data.items);
      setSaveMessage({ type: 'success', text: 'Criteria saved successfully!' });

      // Refresh to get updated data
      const criteriaData = await getCriteria(hackathonId);
      if (criteriaData?.criteria) {
        setExistingCriteria(criteriaData.criteria);
        reset({ items: criteriaData.criteria.items });
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: err.response?.data?.message || 'Failed to save criteria' });
    } finally {
      setIsSaving(false);
    }
  };

  const applyTemplate = (templateName) => {
    const template = CRITERIA_TEMPLATES[templateName];
    if (template) {
      reset({ items: template });
    }
  };

  const addCriterion = () => {
    append({
      key: `criterion_${fields.length + 1}`,
      label: '',
      description: '',
      maxScore: 10,
      weight: 1,
    });
  };

  if (isLoading) {
    return <LoadingScreen message="Loading criteria..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load"
        description={error}
        onRetry={fetchData}
      />
    );
  }

  if (!canManage) {
    return (
      <ErrorState
        title="Access Denied"
        description="You don't have permission to manage criteria for this hackathon."
        onRetry={() => navigate(`/hackathons/${hackathonId}`)}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
          <h1 className="text-2xl font-bold text-foreground">Evaluation Criteria</h1>
          <p className="text-muted-foreground mt-1">
            {hackathon?.title || 'Hackathon'}
          </p>
        </div>
        <Badge className="bg-secondary/10 text-secondary py-2 w-35 text-center justify-center">
          <Scale size={14} className="mr-1" />
          Total Weight: {totalWeight.toFixed(1)}
        </Badge>
      </div>

      {/* Messages */}
      {saveMessage && (
        <Alert variant={saveMessage.type === 'error' ? 'error' : 'success'}>
          <span>{saveMessage.text}</span>
        </Alert>
      )}

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Templates</CardTitle>
          <CardDescription>Start with a pre-defined set of criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyTemplate('standard')}
            >
              Standard (5 criteria)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyTemplate('detailed')}
            >
              Detailed (8 criteria)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyTemplate('minimal')}
            >
              Minimal (1 criterion)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Criteria</CardTitle>
                <CardDescription>Define what judges will evaluate</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCriterion}
              >
                <Plus size={16} />
                Add Criterion
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Scale size={32} className="mx-auto mb-2 opacity-50" />
                <p>No criteria defined</p>
                <p className="text-sm">Add criteria or use a template above</p>
              </div>
            ) : (
              fields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-4 border border-border rounded-lg bg-muted/30 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical size={18} className="text-muted-foreground cursor-move" />
                      <Badge variant="outline">#{index + 1}</Badge>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="text-error hover:text-error hover:bg-error/10"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Key (unique identifier)</Label>
                      <Input
                        {...register(`items.${index}.key`)}
                        placeholder="e.g., innovation"
                        className={cn(errors.items?.[index]?.key && 'border-error')}
                      />
                      {errors.items?.[index]?.key && (
                        <p className="text-xs text-error">{errors.items[index].key.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Label (display name)</Label>
                      <Input
                        {...register(`items.${index}.label`)}
                        placeholder="e.g., Innovation"
                        className={cn(errors.items?.[index]?.label && 'border-error')}
                      />
                      {errors.items?.[index]?.label && (
                        <p className="text-xs text-error">{errors.items[index].label.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea
                      {...register(`items.${index}.description`)}
                      placeholder="Describe what judges should look for..."
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Max Score</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.maxScore`)}
                        min={1}
                        max={100}
                        className={cn(errors.items?.[index]?.maxScore && 'border-error')}
                      />
                      {errors.items?.[index]?.maxScore && (
                        <p className="text-xs text-error">{errors.items[index].maxScore.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Weight (multiplier)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        {...register(`items.${index}.weight`)}
                        min={0}
                        max={10}
                        className={cn(errors.items?.[index]?.weight && 'border-error')}
                      />
                      {errors.items?.[index]?.weight && (
                        <p className="text-xs text-error">{errors.items[index].weight.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Alert>
          <Info size={16} />
          <div>
            <p className="font-medium">How Scoring Works</p>
            <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
              <li>Each criterion has a max score (e.g., 10 points)</li>
              <li>Weight is a multiplier for importance (e.g., 2 = twice as important)</li>
              <li>Final score = Σ (score × weight) / Σ (maxScore × weight)</li>
            </ul>
          </div>
        </Alert>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/hackathons/${hackathonId}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Criteria
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CriteriaManagementPage;
