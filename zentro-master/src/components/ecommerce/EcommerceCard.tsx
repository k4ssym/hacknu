import { useState } from "react";
import { 
  FiUpload, 
  FiDatabase, 
  FiActivity, 
  FiCheckCircle, 
  FiMoreVertical,
  FiRefreshCw,
  FiAlertTriangle,
  FiDownload,
  FiTrash2
} from "react-icons/fi";
import Badge from "../ui/badge/Badge";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import ProgressBar from "../ui/progress/ProgressBar";

type ModelVersion = {
  id: string;
  name: string;
  algorithm: string;
  datasetVersion: string;
  metrics: {
    auc: number;
    accuracy: number;
    f1: number;
    precision?: number;
    recall?: number;
  };
  status: 'training' | 'success' | 'failed' | 'deploying';
  timestamp: string;
  isProduction: boolean;
  trainingProgress?: number;
};

export default function ModelManagementCard() {
  const [activeTab, setActiveTab] = useState<'datasets' | 'models'>('datasets');
  const [isOpen, setIsOpen] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  // Mock data
  const [datasets, setDatasets] = useState([
    { version: 'v1.2', rows: 12543, features: 28, uploaded: '2025-07-17', size: '45.2 MB' },
    { version: 'v1.1', rows: 11200, features: 28, uploaded: '2025-07-10', size: '40.1 MB' },
    { version: 'v1.0', rows: 9800, features: 25, uploaded: '2025-06-11', size: '35.7 MB' }
  ]);

  const [models, setModels] = useState<ModelVersion[]>([
    {
      id: 'm5',
      name: 'XGBoost v1.2',
      algorithm: 'XGBoost',
      datasetVersion: 'v1.2',
      metrics: { auc: 0.92, accuracy: 0.88, f1: 0.89, precision: 0.87, recall: 0.91 },
      status: 'success',
      timestamp: '2025-07-17 14:30',
      isProduction: true
    },
    {
      id: 'm4',
      name: 'LightGBM v1.2',
      algorithm: 'LightGBM',
      datasetVersion: 'v1.2',
      metrics: { auc: 0.91, accuracy: 0.87, f1: 0.88, precision: 0.86, recall: 0.90 },
      status: 'success',
      timestamp: '2025-07-16 12:15',
      isProduction: false
    },
    {
      id: 'm3',
      name: 'XGBoost v1.1',
      algorithm: 'XGBoost',
      datasetVersion: 'v1.1',
      metrics: { auc: 0.89, accuracy: 0.85, f1: 0.86, precision: 0.84, recall: 0.88 },
      status: 'success',
      timestamp: '2025-07-12 09:45',
      isProduction: false
    },
    {
      id: 'm6',
      name: 'Neural Net v1.2',
      algorithm: 'Neural Network',
      datasetVersion: 'v1.2',
      metrics: { auc: 0.90, accuracy: 0.86, f1: 0.87, precision: 0.85, recall: 0.89 },
      status: 'training',
      timestamp: '2025-07-10 10:20',
      isProduction: false,
      trainingProgress: 45
    }
  ]);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const promoteToProduction = (modelId: string) => {
    setModels(prev => 
      prev.map(model => ({
        ...model,
        isProduction: model.id === modelId,
        status: model.id === modelId ? 'deploying' : model.status
      }))
    );
    
    // Simulate deployment completion
    setTimeout(() => {
      setModels(prev => 
        prev.map(model => ({
          ...model,
          status: model.id === modelId ? 'success' : model.status
        }))
      );
    }, 2000);
  };

  const deleteModel = (modelId: string) => {
    if (models.find(m => m.id === modelId)?.isProduction) {
      alert("Cannot delete production model");
      return;
    }
    setModels(prev => prev.filter(model => model.id !== modelId));
  };

  const deleteDataset = (version: string) => {
    if (models.some(m => m.datasetVersion === version)) {
      alert("Cannot delete dataset used by existing models");
      return;
    }
    setDatasets(prev => prev.filter(d => d.version !== version));
  };

  const trainNewModel = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        const newProgress = prev + Math.random() * 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          
          // Add the new model
          const newModel: ModelVersion = {
            id: `m${models.length + 1}`,
            name: `New Model v1.${datasets.length}`,
            algorithm: ['XGBoost', 'LightGBM', 'Random Forest'][Math.floor(Math.random() * 3)],
            datasetVersion: datasets[0].version,
            metrics: { 
              auc: 0.85 + Math.random() * 0.1,
              accuracy: 0.8 + Math.random() * 0.1,
              f1: 0.82 + Math.random() * 0.1,
              precision: 0.81 + Math.random() * 0.1,
              recall: 0.83 + Math.random() * 0.1
            },
            status: 'success',
            timestamp: new Date().toLocaleString(),
            isProduction: false
          };
          
          setModels(prev => [newModel, ...prev]);
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };

  const uploadDataset = () => {
    const newVersion = `v1.${datasets.length + 1}`;
    const newDataset = {
      version: newVersion,
      rows: Math.floor(Math.random() * 5000) + 10000,
      features: 28,
      uploaded: new Date().toISOString().split('T')[0],
      size: `${(Math.random() * 10 + 30).toFixed(1)} MB`
    };
    setDatasets(prev => [newDataset, ...prev]);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Model Management Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-white/90">
              Model Management
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Version control and model lifecycle management
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={uploadDataset}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-orange-500 text-white text-sm md:text-base rounded-lg hover:bg-orange-600 transition-colors"
            >
              <FiUpload className="text-sm md:text-lg" />
              <span>New Dataset</span>
            </button>
            <div className="relative">
              <button 
                onClick={toggleDropdown} 
                className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <FiMoreVertical className="text-gray-500 dark:text-gray-400" />
              </button>
              <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-48 md:w-56">
                <DropdownItem 
                  onClick={() => {
                    closeDropdown();
                    trainNewModel();
                  }}
                  className="flex items-center px-3 py-1.5 md:px-4 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiActivity className="mr-2 text-sm md:text-base" />
                  <span className="text-sm md:text-base">Train New Model</span>
                </DropdownItem>
                <DropdownItem className="flex items-center px-3 py-1.5 md:px-4 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiDatabase className="mr-2 text-sm md:text-base" />
                  <span className="text-sm md:text-base">View All Versions</span>
                </DropdownItem>
                <DropdownItem className="flex items-center px-3 py-1.5 md:px-4 md:py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FiDownload className="mr-2 text-sm md:text-base" />
                  <span className="text-sm md:text-base">Export Data</span>
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="flex mt-4 md:mt-6 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('datasets')}
            className={`pb-2 md:pb-3 px-3 md:px-4 text-sm md:text-base font-medium transition-colors ${
              activeTab === 'datasets' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Datasets
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-2 md:pb-3 px-3 md:px-4 text-sm md:text-base font-medium transition-colors ${
              activeTab === 'models' 
                ? 'text-orange-500 border-b-2 border-orange-500' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Model Versions
          </button>
        </div>
      </div>

      {/* Current Production Model Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white/90">
              Production Model
            </h3>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
              Currently active model serving predictions
            </p>
          </div>
          {models.some(m => m.status === 'deploying') ? (
            <Badge color="warning">
              <FiRefreshCw className="mr-1 animate-spin" />
              Deploying...
            </Badge>
          ) : (
            <Badge color="success">
              <FiCheckCircle className="mr-1" />
              Active
            </Badge>
          )}
        </div>

        {models.filter(m => m.isProduction).map(model => (
          <div key={model.id} className="mt-3 p-3 md:p-4 bg-orange-50 rounded-lg dark:bg-orange-900/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h4 className="font-bold text-gray-800 dark:text-white/90 text-sm md:text-base">{model.name}</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                  {model.algorithm} • Trained on {model.datasetVersion} • {model.timestamp}
                </p>
              </div>
              <div className="flex gap-2 md:gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">AUC</p>
                  <p className="font-bold text-orange-500 text-sm md:text-base">{model.metrics.auc.toFixed(3)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Accuracy</p>
                  <p className="font-bold text-orange-500 text-sm md:text-base">{model.metrics.accuracy.toFixed(3)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">F1</p>
                  <p className="font-bold text-orange-500 text-sm md:text-base">{model.metrics.f1.toFixed(3)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {models.filter(m => m.isProduction).length === 0 && (
          <div className="mt-3 p-3 md:p-4 bg-gray-50 rounded-lg dark:bg-gray-900 text-center">
            <p className="text-gray-500 dark:text-gray-400">No production model selected</p>
          </div>
        )}
      </div>

      {/* Dataset or Model List */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-white/[0.03]">
        {activeTab === 'datasets' ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <div className="grid grid-cols-12 p-3 md:p-4 bg-gray-50 dark:bg-gray-900 gap-2 md:gap-4">
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-3">Version</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-2">Rows</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-2">Features</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-3">Size</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-2">Uploaded</div>
            </div>
            {datasets.map((dataset, index) => (
              <div key={index} className="grid grid-cols-12 p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-900 gap-2 md:gap-4 items-center">
                <div className="font-medium text-orange-500 text-xs md:text-sm col-span-3">{dataset.version}</div>
                <div className="text-xs md:text-sm col-span-2">{dataset.rows.toLocaleString()}</div>
                <div className="text-xs md:text-sm col-span-2">{dataset.features}</div>
                <div className="text-xs md:text-sm col-span-3">{dataset.size}</div>
                <div className="text-xs md:text-sm col-span-2">{dataset.uploaded}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            <div className="grid grid-cols-12 p-3 md:p-4 bg-gray-50 dark:bg-gray-900 gap-2 md:gap-4">
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-3">Model</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-2">Algorithm</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-2">Dataset</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-3">Metrics</div>
              <div className="font-medium text-gray-700 dark:text-gray-300 text-xs md:text-sm col-span-2">Actions</div>
            </div>
            {models.map((model) => (
              <div key={model.id} className="grid grid-cols-12 p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-900 gap-2 md:gap-4 items-center">
                <div className="font-medium text-xs md:text-sm col-span-3">
                  <div className="flex items-center gap-1">
                    {model.status === 'training' && <FiRefreshCw className="animate-spin text-yellow-500" size={14} />}
                    {model.status === 'deploying' && <FiRefreshCw className="animate-spin text-orange-500" size={14} />}
                    {model.status === 'failed' && <FiAlertTriangle className="text-red-500" size={14} />}
                    {model.status === 'success' && model.isProduction && <FiCheckCircle className="text-green-500" size={14} />}
                    <span>{model.name}</span>
                  </div>
                </div>
                <div className="text-xs md:text-sm col-span-2">{model.algorithm}</div>
                <div className="text-xs md:text-sm col-span-2">{model.datasetVersion}</div>
                <div className="flex flex-wrap gap-1 col-span-3">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded whitespace-nowrap">
                    AUC: {model.metrics.auc.toFixed(3)}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded whitespace-nowrap">
                    F1: {model.metrics.f1.toFixed(3)}
                  </span>
                  {model.status === 'training' && (
                    <div className="w-full mt-1">
                      <ProgressBar 
                        value={model.trainingProgress || 0} 
                        color="orange" 
                        className="h-1.5" 
                      />
                    </div>
                  )}
                </div>
                <div className="col-span-2 flex gap-1">
                  {!model.isProduction && model.status === 'success' && (
                    <button 
                      onClick={() => promoteToProduction(model.id)}
                      className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded whitespace-nowrap"
                    >
                      Promote
                    </button>
                  )}
                  {model.status === 'success' && (
                    <button 
                      onClick={() => alert(`Downloading model ${model.name}`)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded whitespace-nowrap"
                    >
                      <FiDownload size={14} />
                    </button>
                  )}
                  {!model.isProduction && (
                    <button 
                      onClick={() => deleteModel(model.id)}
                      className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-2 py-1 rounded whitespace-nowrap text-red-500"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training Progress Indicator */}
      {isTraining && (
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <FiRefreshCw className="animate-spin text-orange-500" size={20} />
          <div className="min-w-[200px]">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">Training Model</p>
            <ProgressBar value={trainingProgress} color="orange" className="mt-1 h-2" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trainingProgress.toFixed(0)}% complete</p>
          </div>
        </div>
      )}
    </div>
  );
}