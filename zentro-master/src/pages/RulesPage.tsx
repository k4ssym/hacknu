import { useState, useEffect } from "react";
import { 
  FiAlertCircle, 
  FiBarChart2, 
  FiCheckCircle, 
  FiClock, 
  FiDollarSign, 
  FiShield,
  FiPlay, 
  FiSettings, 
  FiTrendingUp,
  FiTrendingDown,
  FiX,
  FiPlus,
  FiFileText,
  FiFilter,
  FiDownload,
  FiMail,
  FiMessageSquare,
  FiBell
} from "react-icons/fi";

export default function RiskRulesDashboard() {
  const [activeTab, setActiveTab] = useState<'rules' | 'history' | 'settings'>('rules');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    metric: 'risk_score',
    condition: 'greater',
    value: '0.7',
    notification: true,
    severity: 'medium'
  });
  
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'High Default Risk',
      metric: 'risk_score',
      condition: 'greater',
      value: 0.7,
      active: true,
      triggered: 12,
      lastTriggered: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Low Credit Score',
      metric: 'credit_score',
      condition: 'less',
      value: 600,
      active: true,
      triggered: 8,
      lastTriggered: new Date(Date.now() - 86400000).toISOString()
    }
  ]);

  const [alerts, setAlerts] = useState([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  useEffect(() => {
    if (activeTab === 'history' && alerts.length === 0) {
      setIsLoadingAlerts(true);
      setTimeout(() => {
        setAlerts([
          {
            id: 1,
            ruleId: 1,
            applicantId: 'APP-10023',
            score: 0.82,
            timestamp: new Date().toISOString(),
            viewed: false
          },
          {
            id: 2,
            ruleId: 2,
            applicantId: 'APP-10045',
            score: 580,
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            viewed: true
          }
        ]);
        setIsLoadingAlerts(false);
      }, 800);
    }
  }, [activeTab]);

  const handleCreateRule = () => {
    const newId = rules.length > 0 ? Math.max(...rules.map(r => r.id)) + 1 : 1;
    setRules([...rules, {
      id: newId,
      name: newRule.name,
      metric: newRule.metric,
      condition: newRule.condition,
      value: parseFloat(newRule.value),
      active: true,
      triggered: 0,
      lastTriggered: null
    }]);
    setNewRule({
      name: '',
      metric: 'risk_score',
      condition: 'greater',
      value: '0.7',
      notification: true,
      severity: 'medium'
    });
  };

  const toggleRuleStatus = (id) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, active: !rule.active } : rule
    ));
  };

  const deleteRule = (id) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  const markAlertAsRead = (id) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, viewed: true } : alert
    ));
  };

  const videoData = {
    title: "Risk Rules Configuration Guide",
    description: "Learn how to set up and manage your risk detection rules",
    url: "https://www.youtube.com/embed/zentro-demo-video"
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Risk Rules Management</h1>
          <p className="text-gray-600 dark:text-gray-300">Configure automated risk detection and alerting</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('rules')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rules'
                  ? 'border-[#ff671b] text-[#ff671b] dark:text-[#ff671b]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FiShield className="inline mr-2" />
              Rules
              <span className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-medium px-2 py-0.5 rounded-full">
                {rules.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-[#ff671b] text-[#ff671b] dark:text-[#ff671b]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FiAlertCircle className="inline mr-2" />
              Alert History
              {alerts.filter(a => !a.viewed).length > 0 && (
                <span className="ml-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-medium px-2 py-0.5 rounded-full">
                  {alerts.filter(a => !a.viewed).length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-[#ff671b] text-[#ff671b] dark:text-[#ff671b]'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <FiSettings className="inline mr-2" />
              Settings
            </button>
          </nav>
        </div>

        {/* Main Content */}
        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Rules List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Active Rules</h2>
                  <div className="flex space-x-2">
                    <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                      <FiFilter className="mr-2" /> Filter
                    </button>
                    <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                      <FiDownload className="mr-2" /> Export
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {rules.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400 mb-4">No rules created yet</p>
                      <button 
                        onClick={() => setShowVideoModal(true)}
                        className="text-[#ff671b] hover:text-[#e05c17] text-sm font-medium flex items-center justify-center mx-auto"
                      >
                        <FiPlay className="mr-1" /> Watch tutorial to get started
                      </button>
                    </div>
                  ) : (
                    rules.map(rule => (
                      <div key={rule.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-900 dark:text-white mr-2">{rule.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                rule.active 
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                              }`}>
                                {rule.active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                              {rule.metric === 'risk_score' ? 'Default Probability' : 'Credit Score'} 
                              {rule.condition === 'greater' ? ' > ' : ' < '}
                              {rule.value}
                            </p>
                            {rule.lastTriggered && (
                              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                Last triggered: {new Date(rule.lastTriggered).toLocaleString()}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => toggleRuleStatus(rule.id)}
                              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                rule.active 
                                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600' 
                                  : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                              }`}
                            >
                              {rule.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                              <FiX />
                            </button>
                          </div>
                        </div>
                        {rule.triggered > 0 && (
                          <div className="mt-4">
                            <div className="flex items-center">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-[#ff671b] h-2 rounded-full" 
                                  style={{ width: `${Math.min(100, rule.triggered * 10)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{rule.triggered} triggers</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Create Rule Panel */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Rule</h2>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateRule(); }}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#ff671b] focus:ring-[#ff671b] dark:bg-gray-700 dark:text-white transition-colors"
                      value={newRule.name}
                      onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                      placeholder="e.g. High Risk Alert"
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Metric</label>
                    <select
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#ff671b] focus:ring-[#ff671b] dark:bg-gray-700 dark:text-white transition-colors"
                      value={newRule.metric}
                      onChange={(e) => setNewRule({...newRule, metric: e.target.value})}
                      required
                    >
                      <option value="risk_score">Default Probability</option>
                      <option value="credit_score">Credit Score</option>
                      <option value="dti_ratio">Debt-to-Income Ratio</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Condition</label>
                      <select
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#ff671b] focus:ring-[#ff671b] dark:bg-gray-700 dark:text-white transition-colors"
                        value={newRule.condition}
                        onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                        required
                      >
                        <option value="greater">Greater than</option>
                        <option value="less">Less than</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Value</label>
                      <input
                        type="number"
                        step={newRule.metric === 'risk_score' ? '0.01' : '1'}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#ff671b] focus:ring-[#ff671b] dark:bg-gray-700 dark:text-white transition-colors"
                        value={newRule.value}
                        onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Severity Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['low', 'medium', 'high'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setNewRule({...newRule, severity: level})}
                          className={`py-2 text-sm font-medium rounded-lg capitalize transition-colors ${
                            newRule.severity === level
                              ? 'bg-[#ff671b] text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center mb-6">
                    <input
                      type="checkbox"
                      id="notification"
                      className="h-4 w-4 text-[#ff671b] focus:ring-[#ff671b] border-gray-300 dark:border-gray-600 rounded transition-colors"
                      checked={newRule.notification}
                      onChange={(e) => setNewRule({...newRule, notification: e.target.checked})}
                    />
                    <label htmlFor="notification" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Enable notifications
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#ff671b] hover:bg-[#e05c17] text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff671b] focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  >
                    Create Rule
                  </button>
                </form>
              </div>

              {/* Rule Templates */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 transition-colors">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Common Templates</h2>
                <div className="space-y-3">
                  <button
                    onClick={() => setNewRule({
                      name: 'High Default Risk',
                      metric: 'risk_score',
                      condition: 'greater',
                      value: '0.7',
                      notification: true,
                      severity: 'high'
                    })}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">Default Probability &gt; 0.7</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Flag high-risk applicants</p>
                  </button>

                  <button
                    onClick={() => setNewRule({
                      name: 'Low Credit Score',
                      metric: 'credit_score',
                      condition: 'less',
                      value: '600',
                      notification: true,
                      severity: 'medium'
                    })}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">Credit Score &lt; 600</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Identify subprime applicants</p>
                  </button>

                  <button
                    onClick={() => setNewRule({
                      name: 'High Debt-to-Income',
                      metric: 'dti_ratio',
                      condition: 'greater',
                      value: '0.4',
                      notification: true,
                      severity: 'medium'
                    })}
                    className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white">DTI Ratio &gt; 40%</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Flag high debt applicants</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Alert History</h2>
              <div className="flex space-x-2">
                <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                  <FiFilter className="mr-2" /> Filter
                </button>
                <button className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                  <FiDownload className="mr-2" /> Export
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoadingAlerts ? (
                <div className="p-8 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#ff671b] border-r-transparent"></div>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Loading alerts...</p>
                </div>
              ) : alerts.length > 0 ? (
                alerts.map(alert => (
                  <div 
                    key={alert.id} 
                    className={`p-6 transition-colors ${!alert.viewed ? 'bg-orange-50 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className={`p-2 rounded-full mr-4 ${
                          !alert.viewed 
                            ? 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-300' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <FiAlertCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {alert.ruleId === 1 ? 'High Default Risk' : 'Low Credit Score'} Detected
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Applicant: {alert.applicantId} • Score: {alert.score}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 px-3 py-1 rounded-lg transition-colors">
                          Details
                        </button>
                        {!alert.viewed && (
                          <button
                            onClick={() => markAlertAsRead(alert.id)}
                            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <FiCheckCircle className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No alerts found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Notification Settings</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Delivery Methods</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FiBell className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">In-app notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ff671b]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff671b] dark:bg-gray-700 dark:peer-checked:bg-[#ff671b]"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FiMail className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Email notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ff671b]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff671b] dark:bg-gray-700 dark:peer-checked:bg-[#ff671b]"></div>
                    </label>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FiMessageSquare className="text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Slack notifications</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#ff671b]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff671b] dark:bg-gray-700 dark:peer-checked:bg-[#ff671b]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#ff671b] focus:ring-[#ff671b] dark:bg-gray-700 dark:text-white transition-colors"
                      defaultValue="analyst@bank.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Frequency</label>
                    <select className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:border-[#ff671b] focus:ring-[#ff671b] dark:bg-gray-700 dark:text-white transition-colors">
                      <option>Immediately</option>
                      <option>Hourly Digest</option>
                      <option>Daily Digest</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="bg-[#ff671b] hover:bg-[#e05c17] text-white font-medium py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff671b] focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full transition-colors">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FiX className="h-6 w-6" />
            </button>
            <div className="aspect-w-16 aspect-h-9">
              <iframe
                className="w-full h-[500px] rounded-t-lg"
                src={videoData.url}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{videoData.title}</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{videoData.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}