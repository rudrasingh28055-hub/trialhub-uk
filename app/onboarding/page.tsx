"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid } from "../../lib/design/tokens";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  content: React.ReactNode;
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: "Welcome to AthLink",
      description: "The premium platform for football talent discovery and career development",
      icon: "⚽",
      content: (
        <div className="text-center space-y-8">
          <div className="text-8xl">⚽</div>
          <div>
            <h2 
              className="text-3xl font-black mb-4"
              style={{ 
                fontFamily: typography.family,
                fontWeight: typography.black,
                color: colors.white,
                letterSpacing: "-0.05em"
              }}
            >
              Welcome to AthLink
            </h2>
            <p 
              className="text-lg max-w-md mx-auto"
              style={{ 
                fontFamily: typography.family,
                color: colors.muted,
                fontSize: "18px"
              }}
            >
              The premium platform connecting talented footballers with opportunities worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div 
              className="p-6 rounded-xl text-center"
              style={{ ...glassPanel }}
            >
              <div className="text-3xl mb-2">🌍</div>
              <div 
                className="font-bold"
                style={{ color: colors.electricViolet }}
              >
                50+
              </div>
              <div 
                className="text-xs"
                style={{ color: colors.muted }}
              >
                Countries
              </div>
            </div>
            <div 
              className="p-6 rounded-xl text-center"
              style={{ ...glassPanel }}
            >
              <div className="text-3xl mb-2">👥</div>
              <div 
                className="font-bold"
                style={{ color: colors.electricViolet }}
              >
                10K+
              </div>
              <div 
                className="text-xs"
                style={{ color: colors.muted }}
              >
                Athletes
              </div>
            </div>
            <div 
              className="p-6 rounded-xl text-center"
              style={{ ...glassPanel }}
            >
              <div className="text-3xl mb-2">🏆</div>
              <div 
                className="font-bold"
                style={{ color: colors.electricViolet }}
              >
                500+
              </div>
              <div 
                className="text-xs"
                style={{ color: colors.muted }}
              >
                Clubs
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 1,
      title: "Choose Your Role",
      description: "Select how you'll use AthLink to achieve your football goals",
      icon: "👤",
      content: (
        <div className="space-y-6">
          <h2 
            className="text-2xl font-bold text-center mb-8"
            style={{ 
              fontFamily: typography.family,
              fontWeight: typography.bold,
              color: colors.white
            }}
          >
            How will you use AthLink?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "athlete",
                title: "Athlete",
                description: "Showcase your talent and get discovered",
                icon: "⚽",
                features: ["Create highlights", "Track performance", "Connect with scouts"]
              },
              {
                id: "scout",
                title: "Scout",
                description: "Discover and evaluate talented players",
                icon: "🔍",
                features: ["Search talent", "Advanced analytics", "Direct messaging"]
              },
              {
                id: "coach",
                title: "Coach",
                description: "Manage and develop your team",
                icon: "👨‍🏫",
                features: ["Player evaluations", "Training programs", "Performance tracking"]
              },
              {
                id: "club",
                title: "Club",
                description: "Build your squad and manage operations",
                icon: "🏢",
                features: ["Team management", "Scouting tools", "Career development"]
              }
            ].map((role) => (
              <motion.div
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(role.id)}
                className={`p-6 rounded-xl cursor-pointer border-2 transition-all ${
                  selectedRole === role.id ? "border-violet-500" : "border-transparent"
                }`}
                style={{
                  ...glassPanel,
                  border: selectedRole === role.id ? `2px solid ${colors.electricViolet}` : `2px solid ${colors.glass.border}`
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="text-4xl"
                    style={{ 
                      backgroundColor: colors.electricViolet,
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{ 
                        fontFamily: typography.family,
                        fontWeight: typography.bold,
                        color: colors.white
                      }}
                    >
                      {role.title}
                    </h3>
                    <p 
                      className="text-sm mb-3"
                      style={{ 
                        fontFamily: typography.family,
                        color: colors.muted
                      }}
                    >
                      {role.description}
                    </p>
                    <div className="space-y-1">
                      {role.features.map((feature, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-2 text-xs"
                          style={{ color: colors.electricViolet }}
                        >
                          <span>✓</span>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Select Your Interests",
      description: "Tell us what you're most interested in to personalize your experience",
      icon: "🎯",
      content: (
        <div className="space-y-6">
          <h2 
            className="text-2xl font-bold text-center mb-8"
            style={{ 
              fontFamily: typography.family,
              fontWeight: typography.bold,
              color: colors.white
            }}
          >
            What interests you most?
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Performance Analysis",
              "Tactical Training",
              "Career Development",
              "Scouting & Recruitment",
              "Injury Prevention",
              "Mental Performance",
              "Nutrition & Fitness",
              "Video Analysis",
              "Networking",
              "Contract Negotiation",
              "Agent Relations",
              "Club Management"
            ].map((interest) => (
              <motion.button
                key={interest}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (selectedInterests.includes(interest)) {
                    setSelectedInterests(prev => prev.filter(i => i !== interest));
                  } else {
                    setSelectedInterests(prev => [...prev, interest]);
                  }
                }}
                className={`p-4 rounded-xl text-center transition-all ${
                  selectedInterests.includes(interest) ? "ring-2 ring-violet-500" : ""
                }`}
                style={{
                  ...glassPanel,
                  border: selectedInterests.includes(interest) ? `2px solid ${colors.electricViolet}` : `1px solid ${colors.glass.border}`
                }}
              >
                <div 
                  className="text-sm font-medium"
                  style={{ 
                    fontFamily: typography.family,
                    fontWeight: typography.medium,
                    color: selectedInterests.includes(interest) ? colors.electricViolet : colors.white
                  }}
                >
                  {interest}
                </div>
              </motion.button>
            ))}
          </div>
          
          <div className="text-center">
            <p 
              className="text-sm"
              style={{ color: colors.muted }}
            >
              Select {selectedInterests.length > 0 ? selectedInterests.length : "at least 3"} interests
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Complete Your Profile",
      description: "Add your details to get started with personalized recommendations",
      icon: "✨",
      content: (
        <div className="space-y-6">
          <h2 
            className="text-2xl font-bold text-center mb-8"
            style={{ 
              fontFamily: typography.family,
              fontWeight: typography.bold,
              color: colors.white
            }}
          >
            Almost there!
          </h2>
          
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: typography.family,
                  fontWeight: typography.medium,
                  color: colors.white
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg bg-transparent border-0 outline-none text-white placeholder-gray-500"
                style={{ 
                  ...glassPanel,
                  fontFamily: typography.family
                }}
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: typography.family,
                  fontWeight: typography.medium,
                  color: colors.white
                }}
              >
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-lg bg-transparent border-0 outline-none text-white placeholder-gray-500"
                style={{ 
                  ...glassPanel,
                  fontFamily: typography.family
                }}
              />
            </div>
            
            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ 
                  fontFamily: typography.family,
                  fontWeight: typography.medium,
                  color: colors.white
                }}
              >
                Location
              </label>
              <input
                type="text"
                placeholder="City, Country"
                className="w-full px-4 py-3 rounded-lg bg-transparent border-0 outline-none text-white placeholder-gray-500"
                style={{ 
                  ...glassPanel,
                  fontFamily: typography.family
                }}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                className="rounded"
              />
              <label 
                htmlFor="terms"
                className="text-sm"
                style={{ color: colors.muted }}
              >
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Handle completion - redirect to dashboard
    console.log("Onboarding completed!");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedRole !== null;
      case 2:
        return selectedInterests.length >= 3;
      case 3:
        return true; // Add validation for form fields
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      backgroundColor: colors.obsidian,
      ...pitchGrid
    }}>
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse_at_top_left, ${colors.electricViolet}15, transparent 50%),
          radial-gradient(ellipse_at_bottom_right, ${colors.royalBlue}10, transparent 50%),
          radial-gradient(ellipse_at_center, ${colors.electricViolet}05, transparent 70%)
        `
      }} />

      <div className="relative px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      index <= currentStep ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white" : "bg-white/10 text-gray-500"
                    }`}
                    style={{
                      ...(index <= currentStep && {
                        background: gradient.violet,
                        color: colors.white,
                        boxShadow: "0 4px 20px rgba(124, 58, 237, 0.4)"
                      })
                    }}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`flex-1 h-1 mx-4 transition-all ${
                        index < currentStep ? "bg-gradient-to-r from-violet-500 to-purple-500" : "bg-white/10"
                      }`}
                      style={{
                        ...(index < currentStep && {
                          background: gradient.violet
                        })
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs" style={{ color: colors.muted }}>
              {steps.map((step) => (
                <span key={step.id} className="flex-1 text-center">
                  {step.title}
                </span>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-12"
          >
            {steps[currentStep].content}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-6 py-3 font-medium rounded-lg transition-all disabled:opacity-50"
              style={{
                fontFamily: typography.family,
                fontWeight: typography.medium,
                backgroundColor: colors.glass.background,
                color: colors.white,
                border: `1px solid ${colors.glass.border}`,
                borderRadius: borderRadius.small
              }}
            >
              Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-8 py-3 font-medium rounded-lg transition-all disabled:opacity-50"
                style={{
                  fontFamily: typography.family,
                  fontWeight: typography.medium,
                  background: canProceed() ? gradient.violet : colors.glass.background,
                  color: colors.white,
                  border: "none",
                  borderRadius: borderRadius.small
                }}
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-8 py-3 font-medium rounded-lg transition-all"
                style={{
                  fontFamily: typography.family,
                  fontWeight: typography.medium,
                  background: gradient.violet,
                  color: colors.white,
                  border: "none",
                  borderRadius: borderRadius.small
                }}
              >
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
