// src/components/modals/model-training-modal.tsx
import { useState } from "react";

interface ModelTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTrain: (config: { algorithm: string; dataset: string; parameters: any }) => void;
  datasets: { version: string }[];
}

export function ModelTrainingModal({
  isOpen,
  onClose,
  onTrain,
  datasets
}: ModelTrainingModalProps) {
  const [algorithm, setAlgorithm] = useState('XGBoost');
  const [dataset, setDataset] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTrain({
      algorithm,
      dataset: dataset || datasets[0]?.version,
      parameters: {} // Add actual parameters here
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Train New Model</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Algorithm
              </label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700"
              >
                <option value="XGBoost">XGBoost</option>
                <option value="LightGBM">LightGBM</option>
                <option value="Random Forest">Random Forest</option>
                <option value="Neural Network">Neural Network</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dataset Version
              </label>
              <select
                value={dataset}
                onChange={(e) => setDataset(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 bg-white dark:bg-gray-700"
              >
                {datasets.map((ds) => (
                  <option key={ds.version} value={ds.version}>
                    {ds.version}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Start Training
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}