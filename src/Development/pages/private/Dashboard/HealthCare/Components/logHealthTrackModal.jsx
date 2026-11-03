import React, { useState } from "react";

export default function HealthMetricsModal({ open, onClose }) {
  const [tab, setTab] = useState(0);
  const [metrics, setMetrics] = useState({
    weight: "",
    bpSys: "",
    bpDia: "",
    bloodSugar: "",
    cholesterol: "",
  });
  const [reminder, setReminder] = useState(false);

  const metricsLogged = [
    metrics.weight,
    metrics.bpSys,
    metrics.bpDia,
    metrics.bloodSugar,
    metrics.cholesterol,
  ].filter((v) => v !== "").length;
  const progressPercent = (metricsLogged / 5) * 100;

  if (!open) return null;

  return (
    <div
      id="metrics-modal"
      tabIndex={-1}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm bg-opacity-40"
    >
      <div className="relative w-full max-w-xl bg-white rounded-lg shadow dark:bg-gray-700 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b pb-3 mb-4">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Log Your Health Metrics
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 rounded-lg p-2"
          >
            <span className="sr-only">Close modal</span>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mb-6">
          <button
            type="button"
            className={`flex-1 py-2 px-4 border-b-2 font-semibold ${
              tab === 0
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-600"
            }`}
            onClick={() => setTab(0)}
          >
            Week 0 (Baseline)
          </button>
          <button
            type="button"
            className={`flex-1 py-2 px-4 border-b-2 font-semibold ${
              tab === 1
                ? "border-green-600 text-green-700"
                : "border-transparent text-gray-600"
            }`}
            onClick={() => setTab(1)}
          >
            Week 1 (Latest)
          </button>
        </div>

        {/* Metrics Inputs */}
        <form>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 text-gray-700">Weight</label>
              <input
                type="number"
                value={metrics.weight}
                onChange={(e) =>
                  setMetrics({ ...metrics, weight: e.target.value })
                }
                className="w-full border rounded-lg p-2 mb-1 focus:ring-2 focus:ring-green-200"
                placeholder="Enter weight"
              />
              <span className="text-xs text-gray-500">kg</span>
              <div className="text-green-600 text-sm mt-1">
                Great start! Keep tracking your progress!
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Blood Pressure</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={metrics.bpSys}
                  onChange={(e) =>
                    setMetrics({ ...metrics, bpSys: e.target.value })
                  }
                  className="w-24 border rounded-lg p-2"
                  placeholder="Sys"
                />
                <span>/</span>
                <input
                  type="number"
                  value={metrics.bpDia}
                  onChange={(e) =>
                    setMetrics({ ...metrics, bpDia: e.target.value })
                  }
                  className="w-24 border rounded-lg p-2"
                  placeholder="Dia"
                />
                <span className="text-xs text-gray-500 ml-1">mmHg</span>
              </div>
              <div className="text-green-600 text-sm mt-1">
                Your heart health matters – keep it up!
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Blood Sugar</label>
              <input
                type="number"
                value={metrics.bloodSugar}
                onChange={(e) =>
                  setMetrics({ ...metrics, bloodSugar: e.target.value })
                }
                className="w-full border rounded-lg p-2 mb-1 focus:ring-2 focus:ring-yellow-200"
                placeholder="Enter blood sugar"
              />
              <span className="text-xs text-gray-500">mg/dL</span>
              <div className="text-yellow-600 text-sm mt-1">
                Steady monitoring leads to better control!
              </div>
            </div>
            <div>
              <label className="block mb-1 text-gray-700">Cholesterol</label>
              <input
                type="number"
                value={metrics.cholesterol}
                onChange={(e) =>
                  setMetrics({ ...metrics, cholesterol: e.target.value })
                }
                className="w-full border rounded-lg p-2 mb-1 focus:ring-2 focus:ring-green-200"
                placeholder="Enter cholesterol"
              />
              <span className="text-xs text-gray-500">mg/dL</span>
              <div className="text-green-600 text-sm mt-1">
                Every reading counts towards better health!
              </div>
            </div>
          </div>

          <div className="flex items-center mt-5">
            <input
              type="checkbox"
              className="mr-2"
              checked={reminder}
              onChange={(e) => setReminder(e.target.checked)}
            />
            <span className="text-gray-700">Send me weekly reminders</span>
          </div>

          <div className="w-full mt-6 mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span>Weekly Progress</span>
              <span className="text-gray-500">
                {metricsLogged}/5 metrics logged
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`bg-green-600 h-2.5 rounded-full transition-all`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex mt-4 gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 rounded-lg"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              Save Metrics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
