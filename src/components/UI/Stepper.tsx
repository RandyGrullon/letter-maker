import React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperProps {
    steps: string[];
    currentStep: number;
    onStepClick?: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
    return (
        <div className="flex items-center justify-between w-full mb-8 px-4">
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;

                return (
                    <div key={step} className="flex flex-col items-center relative z-10">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 bg-white",
                                isCompleted
                                    ? "border-indigo-600 bg-indigo-600 text-white"
                                    : isCurrent
                                        ? "border-indigo-600 text-indigo-600 shadow-lg shadow-indigo-200 scale-110"
                                        : "border-gray-200 text-gray-400"
                            )}
                        >
                            {isCompleted ? (
                                <Check className="w-5 h-5" />
                            ) : (
                                <span className="text-sm font-semibold">{index + 1}</span>
                            )}
                        </div>
                        <span
                            className={cn(
                                "absolute -bottom-6 text-xs font-medium whitespace-nowrap transition-colors duration-300",
                                isCurrent ? "text-indigo-600" : "text-gray-400"
                            )}
                        >
                            {step}
                        </span>

                        {/* Connecting Line */}
                        {index < steps.length - 1 && (
                            <div
                                className={cn(
                                    "absolute top-5 left-1/2 w-full h-[2px] -z-10",
                                    "bg-gray-200"
                                )}
                            >
                                <div
                                    className={cn(
                                        "h-full bg-indigo-600 transition-all duration-500 ease-out",
                                        index < currentStep ? "w-full" : "w-0"
                                    )}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
