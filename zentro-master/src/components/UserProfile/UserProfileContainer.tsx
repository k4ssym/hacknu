import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UserMetaCard from "./UserMetaCard";
import UserInfoCard from "./UserInfoCard";
import { useNavigate } from "react-router-dom";

interface Session {
  id: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  current: boolean;
}

interface UserData {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  location: string;
  role: string;
  accountStatus: string;
  registrationDate: string;
  loginCount: number;
  avatarUrl: string;
  lastActivity: string;
  iin: string;
  postalCode: string;
  city: string;
  region: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  sessions: Session[];
  dateOfBirth: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfileContainer() {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  // Get current user ID from JWT token in localStorage
  const getCurrentUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return null;
    }
    
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      return decoded.id;
    } catch (error) {
      console.error("Error decoding token:", error);
      navigate('/login');
      return null;
    }
  };

  // Format date to avoid invalid date issues
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Fetch user data and sessions
  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userId = getCurrentUserId();
        if (!userId) return;

        // Fetch user data
        const userResponse = await fetch(`/api/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!userResponse.ok) {
          if (userResponse.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const userFromApi = await userResponse.json();
        
        // Fetch sessions data
        const sessionsResponse = await fetch(`/api/users/${userId}/sessions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        let sessions: Session[] = [];
        if (sessionsResponse.ok) {
          const sessionsData = await sessionsResponse.json();
          sessions = sessionsData.map((session: any) => ({
            id: session.id,
            device: session.device || 'Unknown Device',
            browser: session.browser || 'Unknown Browser',
            ip: session.ip || 'Unknown IP',
            location: session.location || 'Unknown Location',
            lastActive: formatDate(session.lastActive) || 'Unknown',
            current: session.current || false
          }));
        }

        // Transform the API response to match your frontend structure
        const transformedUser: UserData = {
          id: userFromApi.id,
          firstName: userFromApi.first_name || '',
          lastName: userFromApi.last_name || '',
          phone: userFromApi.phone || '',
          email: userFromApi.email || '',
          location: userFromApi.location || '',
          role: userFromApi.role || 'Specialist',
          accountStatus: userFromApi.account_status || 'active',
          registrationDate: formatDate(userFromApi.registration_date) || '',
          loginCount: userFromApi.login_count || 0,
          avatarUrl: userFromApi.avatar_url || 'https://i.pravatar.cc/300',
          lastActivity: formatDate(userFromApi.last_activity) || '',
          iin: userFromApi.iin || '',
          postalCode: userFromApi.postal_code || '',
          city: userFromApi.city || '',
          region: userFromApi.region || '',
          isVerified: userFromApi.is_verified || false,
          twoFactorEnabled: userFromApi.two_factor_enabled || false,
          sessions: sessions,
          dateOfBirth: formatDate(userFromApi.date_of_birth) || ''
        };

        if (isMounted) {
          setUserData(transformedUser);
        }
      } catch (error) {
        if (isMounted) {
          toast.error(`Failed to load user data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Update profile information
  const handleProfileUpdate = async (updatedData: Partial<UserData>) => {
    if (!userData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          first_name: updatedData.firstName,
          last_name: updatedData.lastName,
          phone: updatedData.phone,
          location: updatedData.location,
          city: updatedData.city,
          region: updatedData.region,
          postal_code: updatedData.postalCode,
          avatar_url: updatedData.avatarUrl || 'https://i.pravatar.cc/300',
          date_of_birth: updatedData.dateOfBirth
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      setUserData(prev => prev ? { 
        ...prev, 
        firstName: updatedUser.first_name || prev.firstName,
        lastName: updatedUser.last_name || prev.lastName,
        phone: updatedUser.phone || prev.phone,
        location: updatedUser.location || prev.location,
        city: updatedUser.city || prev.city,
        region: updatedUser.region || prev.region,
        postalCode: updatedUser.postal_code || prev.postalCode,
        avatarUrl: updatedUser.avatar_url || prev.avatarUrl,
        dateOfBirth: formatDate(updatedUser.date_of_birth) || prev.dateOfBirth
      } : null);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handlePasswordChange = async (passwordData: PasswordData) => {
    setLoading(true);
    try {
      if (!userData) return;

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("Passwords don't match");
      }
      
      if (passwordData.newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const response = await fetch(`/api/users/${userData.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error(errorData.message || "Failed to change password");
      }

      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  // Toggle 2FA
  const toggleTwoFactor = async () => {
    if (!userData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userData.id}/two-factor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enable: !userData.twoFactorEnabled
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error("Failed to update two-factor settings");
      }

      const result = await response.json();
      
      setUserData(prev => prev ? { 
        ...prev, 
        twoFactorEnabled: result.two_factor_enabled 
      } : null);
      
      toast.success(
        result.two_factor_enabled 
          ? "Two-factor authentication enabled" 
          : "Two-factor authentication disabled"
      );
    } catch (error) {
      toast.error("Failed to update two-factor settings");
    } finally {
      setLoading(false);
    }
  };

  // Terminate session
  const terminateSession = async (sessionId: string) => {
    if (!userData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error("Failed to terminate session");
      }

      setUserData(prev => prev ? { 
        ...prev, 
        sessions: prev.sessions.filter(session => session.id !== sessionId)
      } : null);
      
      toast.success("Session terminated successfully");
    } catch (error) {
      toast.error("Failed to terminate session");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UserMetaCard
        userData={{
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          email: userData.email,
          location: userData.location,
          city: userData.city,
          region: userData.region,
          postalCode: userData.postalCode,
          role: userData.role,
          avatarUrl: userData.avatarUrl,
          bio: `${userData.firstName} ${userData.lastName}`,
          dateOfBirth: userData.dateOfBirth
        }}
        loading={loading}
        onUpdate={handleProfileUpdate}
      />
      
      <UserInfoCard
        securityData={{
          lastActivity: userData.lastActivity,
          twoFactorEnabled: userData.twoFactorEnabled,
          sessions: userData.sessions
        }}
        loading={loading}
        onPasswordChange={handlePasswordChange}
        onToggleTwoFactor={toggleTwoFactor}
        onTerminateSession={terminateSession}
      />
    </div>
  );
}