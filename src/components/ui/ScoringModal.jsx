import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';
import Button from './Button';
import { cn } from '../../lib/utils';

/**
 * ScoringModal Component
 * Handles paginated evaluation of criteria with a 1-10 number grid.
 */
const ScoringModal = ({
    isOpen,
    onClose,
    projectName = 'Project',
    criteria = [],
    scores = {},
    onScoreChange,
    onSave,
    isSubmitting = false,
    isMobile = false
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isExiting, setIsExiting] = useState(false);
    const [shouldRender, setShouldRender] = useState(isOpen);

    // Sync local render state with isOpen, but handle exit animation
    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            setIsExiting(false);
            setCurrentStep(0);
        } else if (shouldRender) {
            setIsExiting(true);
            const timer = setTimeout(() => {
                setShouldRender(false);
                setIsExiting(false);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!shouldRender || !criteria.length) return null;

    const currentCriterion = criteria[currentStep];
    const totalSteps = criteria.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const currentScore = scores[currentCriterion.key] || 0;

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onSave('submitted');
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleScoreSelect = (score) => {
        onScoreChange(currentCriterion.key, score);
    };

    const content = (
        <div className={cn(
            "bg-white flex flex-col h-full max-h-[90vh] sm:max-h-none overflow-hidden",
            isMobile ? "rounded-t-3xl" : "rounded-2xl shadow-xl border border-border w-full max-w-lg"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground truncate mr-4">Score {projectName}</h2>
                <button
                    onClick={handleClose}
                    className="p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                >
                    <X className="w-6 h-6 text-muted-foreground" />
                </button>
            </div>

            {/* Progress */}
            <div className="px-6 py-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm font-medium text-muted-foreground">{currentStep + 1}/{totalSteps}</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-secondary transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Criterion Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-foreground mb-3 mt-4 break-words w-full">
                    {currentCriterion.label}
                </h3>
                <p className="text-muted-foreground text-base max-w-sm mb-8 break-words">
                    {currentCriterion.description}
                </p>

                {/* Number Grid */}
                <div className="grid grid-cols-5 gap-3 w-full max-w-xs mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleScoreSelect(num)}
                            className={cn(
                                "w-full aspect-square rounded-full flex items-center justify-center text-lg font-semibold transition-all",
                                currentScore === num
                                    ? "bg-secondary text-white shadow-md transform scale-105"
                                    : "bg-muted text-foreground hover:bg-border"
                            )}
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer Navigation */}
            <div className="p-6 border-t border-border mt-auto">
                <div className="flex gap-4">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className="flex-1 h-14 rounded-xl gap-2 text-base font-semibold"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Previous
                    </Button>
                    <Button
                        onClick={handleNext}
                        className="flex-1 h-14 rounded-xl gap-2 text-base font-semibold bg-secondary hover:bg-secondary-hover text-white border-none"
                        disabled={isSubmitting}
                    >
                        {currentStep === totalSteps - 1 ? (isSubmitting ? 'Submitting...' : 'Submit') : 'Next'}
                        {currentStep < totalSteps - 1 && <ArrowRight className="w-5 h-5" />}
                    </Button>
                </div>
            </div>
        </div>
    );

    if (isMobile) {
        return (
            <div className={cn(
                "fixed inset-0 z-50 flex flex-col justify-end bg-black/60 sm:hidden",
                isExiting ? "animate-fade-out" : "animate-fade-in"
            )}>
                <div
                    className="absolute inset-0"
                    onClick={handleClose}
                />
                <div className={cn(
                    "relative",
                    isExiting ? "animate-slide-down" : "animate-slide-up"
                )}>
                    {content}
                </div>
            </div>
        );
    }

    return content;
};

export default ScoringModal;
