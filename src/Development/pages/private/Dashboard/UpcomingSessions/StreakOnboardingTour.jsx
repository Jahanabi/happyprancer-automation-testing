import React from "react";
import Joyride, { STATUS, ACTIONS, EVENTS } from "react-joyride";
import {
  Calendar,
  TrendingUp,
  Flame,
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  Target,
  Zap,
} from "lucide-react";

const StreakOnboardingTour = ({ run, onFinish, primaryColor }) => {
  const steps = [
    {
      target: "body",
      content: (
        <div
          className="text-center py-3"
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px",
            animation: "joyrideFadeIn 260ms ease both",
            willChange: "transform, opacity",
          }}>
          <div className="mb-3">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}>
              <Sparkles
                className="w-7 h-7 animate-pulse"
                style={{ color: "white" }}
              />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "white" }}>
            Welcome! 👋
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}>
            Quick tour of your progress metrics
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="classes"]',
      content: (
        <div
          className="py-2"
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px",
            padding: "12px",
            animation: "joyrideFadeIn 260ms ease both",
            willChange: "transform, opacity",
          }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: "white" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold" style={{ color: "white" }}>
                Mark Attendance
              </h3>
              <p
                className="text-xs"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                How to join classes
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}>
                <Target className="w-3 h-3" style={{ color: "white" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Click the <strong>Join</strong> button for any upcoming class
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}>
                <Zap className="w-3 h-3" style={{ color: "white" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Your <strong>Attendance +1</strong> automatically
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}>
                <Flame className="w-3 h-3" style={{ color: "white" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Daily attendance builds your <strong>Streak & Level</strong>
              </p>
            </div>
          </div>
        </div>
      ),
      placement: "auto",
      disableBeacon: true,
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="attendance"]',
      content: (
        <div
          className="py-2"
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px",
            padding: "12px",
            animation: "joyrideFadeIn 260ms ease both",
            willChange: "transform, opacity",
          }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
              <Calendar className="w-5 h-5" style={{ color: "white" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold" style={{ color: "white" }}>
                Attendance
              </h3>
              <p
                className="text-xs"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Total classes count
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}>
                <CheckCircle2 className="w-3 h-3" style={{ color: "white" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Tracks every class you attend
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}>
                <Target className="w-3 h-3" style={{ color: "white" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Never resets, shows total progress
              </p>
            </div>
          </div>
        </div>
      ),
      placement: "auto",
      disableBeacon: true,
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="level"]',
      content: (
        <div
          className="py-2"
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px",
            padding: "12px",
            animation: "joyrideFadeIn 260ms ease both",
            willChange: "transform, opacity",
          }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
              <TrendingUp className="w-5 h-5" style={{ color: "white" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold" style={{ color: "white" }}>
                Level
              </h3>
              <p
                className="text-xs"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Achievement milestone
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 space-y-2.5"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🌱</span>
                <span className="font-medium" style={{ color: "white" }}>
                  Beginner
                </span>
              </div>
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>0-3</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-base">🚀</span>
                <span className="font-medium" style={{ color: "white" }}>
                  Advanced
                </span>
              </div>
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>4-5</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-base">👑</span>
                <span className="font-medium" style={{ color: "white" }}>
                  Expert
                </span>
              </div>
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>6+</span>
            </div>
            <div
              className="pt-2 mt-2"
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
              <div className="flex items-start gap-2">
                <Zap
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "white" }}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "white" }}>
                  <strong>+1 Level</strong> every 7 days of attendance
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      placement: "auto",
      disableBeacon: true,
      spotlightPadding: 4,
    },
    {
      target: '[data-tour="streak"]',
      content: (
        <div
          className="py-2"
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px",
            padding: "12px",
            animation: "joyrideFadeIn 260ms ease both",
            willChange: "transform, opacity",
          }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}>
              <Flame className="w-5 h-5" style={{ color: "white" }} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold" style={{ color: "white" }}>
                Streak
              </h3>
              <p
                className="text-xs"
                style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                Consecutive days
              </p>
            </div>
          </div>
          <div
            className="rounded-xl p-3 space-y-2"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(34, 197, 94, 0.3)" }}>
                <CheckCircle2
                  className="w-3 h-3"
                  style={{ color: "#22c55e" }}
                />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Attend today → <strong>Streak +1</strong>
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: "rgba(239, 68, 68, 0.3)" }}>
                <XCircle className="w-3 h-3" style={{ color: "#ef4444" }} />
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "white" }}>
                Miss a day → <strong>Resets to 0</strong>
              </p>
            </div>
            <div
              className="pt-2 mt-2"
              style={{ borderTop: "1px solid rgba(255, 255, 255, 0.2)" }}>
              <div className="flex items-start gap-2">
                <Flame
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "#fb923c" }}
                />
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "white" }}>
                  Keep it alive to stay <strong>On Fire!</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      placement: "auto",
      disableBeacon: true,
      spotlightPadding: 4,
    },
    {
      target: "body",
      content: (
        <div
          className="text-center py-3"
          style={{
            backgroundColor: primaryColor,
            borderRadius: "16px",
            animation: "joyrideFadeIn 260ms ease both",
            willChange: "transform, opacity",
          }}>
          <div className="mb-3">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-lg"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}>
              <Trophy className="w-7 h-7" style={{ color: "white" }} />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "white" }}>
            You're Ready! 🎉
          </h2>
          <p
            className="text-sm mb-3 leading-relaxed"
            style={{ color: "rgba(255, 255, 255, 0.9)" }}>
            Start attending classes to track your journey
          </p>
          <div
            className="rounded-xl p-3"
            style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="space-y-1">
                <Calendar
                  className="w-5 h-5 mx-auto"
                  style={{ color: "white" }}
                />
                <p className="text-xs font-medium" style={{ color: "white" }}>
                  Attendance
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  Total count
                </p>
              </div>
              <div className="space-y-1">
                <TrendingUp
                  className="w-5 h-5 mx-auto"
                  style={{ color: "white" }}
                />
                <p className="text-xs font-medium" style={{ color: "white" }}>
                  Level
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  Per 7 days
                </p>
              </div>
              <div className="space-y-1">
                <Flame className="w-5 h-5 mx-auto" style={{ color: "white" }} />
                <p className="text-xs font-medium" style={{ color: "white" }}>
                  Streak
                </p>
                <p
                  className="text-[10px]"
                  style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                  Daily chain
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
  ];

  // Inject a lightweight keyframe for smooth step transitions
  const animationCss = `
    @keyframes joyrideFadeIn {
      from { opacity: 0; transform: translateY(8px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  const handleJoyrideCallback = (data) => {
    const { status, action, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      onFinish();
    }

    // Log for debugging
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      console.log("Joyride step:", data);
    }
  };

  return (
    <>
      <style>{animationCss}</style>
      {run && <style>{`html, body { overflow: hidden !important; }`}</style>}
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: primaryColor,
            zIndex: 10000,
            arrowColor: primaryColor,
            backgroundColor: primaryColor,
            overlayColor: "rgba(0, 0, 0, 0.6)",
            textColor: "#fff",
          },
          tooltip: {
            borderRadius: 16,
            padding: 16,
            maxWidth: 360,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            backgroundColor: primaryColor,
            transition: "transform 240ms ease, opacity 240ms ease",
          },
          tooltipContainer: {
            textAlign: "left",
          },
          overlay: {
            transition: "opacity 200ms ease",
          },
          tooltipFooter: {
            marginTop: 12,
            paddingTop: 12,
            paddingBottom: 12,
            paddingLeft: 16,
            paddingRight: 16,
          },
          buttonNext: {
            backgroundColor: "#fff",
            color: primaryColor,
            fontSize: 13,
            fontWeight: 600,
            padding: "8px 18px",
            borderRadius: 10,
            outline: "none",
            marginBottom: 4,
          },
          buttonBack: {
            backgroundColor: "#fff",
            color: primaryColor,
            fontSize: 13,
            marginRight: 8,
            padding: "8px 18px",
            borderRadius: 10,
            marginBottom: 4,
          },
          buttonSkip: {
            color: "#fff",
            fontSize: 12,
          },
          spotlight: {
            borderRadius: 12,
          },
        }}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip",
        }}
        disableScrolling={true}
        disableOverlayClose
        hideCloseButton={false}
        spotlightClicks={false}
        scrollToFirstStep={true}
        scrollOffset={120}
      />
    </>
  );
};

export default StreakOnboardingTour;
