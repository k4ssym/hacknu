import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { 
  FiShield, 
  FiGlobe,
  FiEye,
  FiEyeOff,
  FiUser,
  FiClock
} from "react-icons/fi";
import Switch from "../ui/switch/Switch";
import { toast } from "react-hot-toast";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface SecurityData {
  lastActivity: string;
  twoFactorEnabled: boolean;
  sessions: Session[];
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserInfoCard({ 
  securityData,
  loading,
  onPasswordChange,
  onToggleTwoFactor,
  onTerminateSession
}: {
  securityData: SecurityData;
  loading: boolean;
  onPasswordChange: (data: PasswordData) => Promise<void>;
  onToggleTwoFactor: () => Promise<void>;
  onTerminateSession: (sessionId: string) => Promise<void>;
}) {
  const { isOpen, openModal, closeModal } = useModal();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'sessions' | 'security'>('sessions');
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      await onPasswordChange(passwordData);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      closeModal();
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error("Failed to change password");
    }
  };

  const formatLastActive = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString();
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm dark:bg-gray-900 dark:shadow-none">
      <div className="p-5 border border-gray-200 rounded-xl dark:border-gray-800">
        <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4">
          <button
            className={`flex-1 py-2 font-medium text-center ${activeTab === 'sessions' ? 'text-green-600 border-b-2 border-green-600 dark:text-green-400 dark:border-green-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('sessions')}
          >
            Active Sessions
          </button>
          <button
            className={`flex-1 py-2 font-medium text-center ${activeTab === 'security' ? 'text-green-600 border-b-2 border-green-600 dark:text-green-400 dark:border-green-400' : 'text-gray-500 dark:text-gray-400'}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>

        {activeTab === 'sessions' ? (
          <div className="space-y-4">
            {securityData.sessions.length > 0 ? (
              securityData.sessions.map((session) => (
                <div key={session.id} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${session.current ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {session.current ? (
                          <FiUser className="w-4 h-4" />
                        ) : (
                          <FiGlobe className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {session.device || 'Unknown Device'} • {session.browser || 'Unknown Browser'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.location || 'Unknown Location'} • {session.ip || 'Unknown IP'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <FiClock className="inline mr-1" />
                          Last active: {formatLastActive(session.lastActive)}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => onTerminateSession(session.id)}
                        className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        disabled={loading}
                      >
                        Terminate
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                No active sessions found
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <FiShield className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">Password</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {securityData.lastActivity ? `Last changed ${formatLastActive(securityData.lastActivity)}` : 'Password change history not available'}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={openModal}
                disabled={loading}
              >
                Change
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <FiShield className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {securityData.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
              <Switch 
                checked={securityData.twoFactorEnabled}
                onChange={onToggleTwoFactor}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl">
        <div className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
          <div className="p-6 pb-0">
            <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Security Settings
            </h4>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Manage your account security settings
            </p>
          </div>
          
          <div className="custom-scrollbar max-h-[70vh] overflow-y-auto px-6 pb-6">
            <div className="space-y-6 pt-6">
              <div className="p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                <h5 className="mb-2 font-medium text-gray-800 dark:text-white/90">Password Change</h5>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Update your password to keep your account secure. Make sure it's at least 8 characters long.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label>Current Password</Label>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    icon={showPassword ? <FiEyeOff /> : <FiEye />}
                    onIconClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>New Password</Label>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Enter new password"
                    icon={showPassword ? <FiEyeOff /> : <FiEye />}
                    onIconClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="Re-enter new password"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-800 dark:text-white/90">Two-Factor Authentication</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {securityData.twoFactorEnabled
                        ? "Currently enabled for your account"
                        : "Add an extra layer of security to your account"}
                    </p>
                  </div>
                  <Switch 
                    checked={securityData.twoFactorEnabled}
                    onChange={onToggleTwoFactor}
                    disabled={loading}
                  />
                </div>
                {!securityData.twoFactorEnabled && (
                  <button className="mt-2 text-sm text-green-600 hover:underline dark:text-green-400">
                    Learn how to set up 2FA
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-0 mt-6">
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} loading={loading}>
              Update Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}