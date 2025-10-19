import { useEffect, useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { 
  FiEdit, 
  FiCalendar, 
  FiPhone, 
  FiMapPin, 
  FiMail
} from "react-icons/fi";
import { AnimatePresence, motion } from "framer-motion";
import AvatarEditor from "react-avatar-editor";
import { toast } from "react-hot-toast";

interface UserData {
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  city: string;
  region: string;
  postalCode: string;
  role: string;
  email: string;
  birthDate: string;
  avatarUrl: string;
  location: string;
}

export default function UserMetaCard({ 
  userData,
  loading,
  onUpdate
}: {
  userData: UserData;
  loading: boolean;
  onUpdate: (updatedData: Partial<UserData>) => Promise<void>;
}) {
  const { isOpen, openModal, closeModal } = useModal();
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarEditor, setAvatarEditor] = useState<AvatarEditor | null>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [localData, setLocalData] = useState<UserData>({
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    city: '',
    region: '',
    postalCode: '',
    role: '',
    email: '',
    birthDate: '',
    avatarUrl: 'https://i.pravatar.cc/300',
    location: '',
    ...userData
  });

  useEffect(() => {
    if (userData) {
      setLocalData(prev => ({
        ...prev,
        ...userData,
        avatarUrl: userData.avatarUrl || 'https://i.pravatar.cc/300',
        birthDate: userData.birthDate || ''
      }));
    }
  }, [userData]);

  const handleSave = async () => {
    try {
      let updatedAvatar = localData.avatarUrl;
      
      if (avatarEditor && tempAvatar) {
        const canvas = avatarEditor.getImageScaledToCanvas();
        updatedAvatar = canvas.toDataURL();
      }

      // Format date for backend (YYYY-MM-DD)
      const formattedDate = localData.birthDate 
        ? new Date(localData.birthDate).toISOString().split('T')[0]
        : '';

      await onUpdate({
        firstName: localData.firstName,
        lastName: localData.lastName,
        phone: localData.phone,
        city: localData.city,
        region: localData.region,
        postalCode: localData.postalCode,
        avatarUrl: updatedAvatar,
        birthDate: formattedDate,
        email: localData.email // Ensure email is included in updates
      });
      
      toast.success("Profile updated successfully");
      closeModal();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Update error:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocalData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setTempAvatar(url);
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) 
        ? 'Invalid date' 
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
    } catch {
      return 'Invalid date';
    }
  };

  if (loading || !localData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm dark:bg-gray-900 dark:shadow-none">
      <div className="flex flex-col justify-between gap-6 mb-8 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 overflow-hidden border-2 border-white rounded-full shadow-lg dark:border-gray-800">
              <img 
                src={localData.avatarUrl} 
                alt="user" 
                className="object-cover w-full h-full"
              />
            </div>
            <label className="absolute bottom-0 right-0 flex items-center justify-center w-6 h-6 p-1 transition-all duration-200 bg-green-600 rounded-full cursor-pointer hover:bg-green-700 group-hover:opacity-100 opacity-0">
              <FiEdit className="w-3 h-3 text-white" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {localData.firstName} {localData.lastName}
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">
                {localData.role}
              </span>
            </h4>
            <p className="text-gray-500 dark:text-gray-400">{localData.bio}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={openModal}
            disabled={loading}
          >
            <FiEdit className="mr-2" />
            Edit Profile
          </Button>
        </div>
      </div>

      <div className="p-5 border border-gray-200 rounded-xl dark:border-gray-800">
        <h5 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Personal Information
        </h5>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FiMail className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-800 dark:text-white/90">
                {localData.email || 'Not specified'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiPhone className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-gray-800 dark:text-white/90">
                {localData.phone || 'Not specified'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiCalendar className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Date of Birth</p>
              <p className="text-gray-800 dark:text-white/90">
                {formatDisplayDate(localData.birthDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiMapPin className="flex-shrink-0 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
              <p className="text-gray-800 dark:text-white/90">
                {[localData.city, localData.region].filter(Boolean).join(', ') || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-2xl">
        <div className="relative w-full overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
          <div className="p-6 pb-0">
            <h4 className="text-2xl font-bold text-gray-800 dark:text-white/90">
              Edit Profile
            </h4>
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              Update your personal information
            </p>
          </div>
          
          <div className="custom-scrollbar max-h-[70vh] overflow-y-auto px-6 pb-6">
            <div className="space-y-6 pt-6">
              {tempAvatar && (
                <div className="flex flex-col items-center gap-4">
                  <AvatarEditor
                    ref={(ref) => setAvatarEditor(ref)}
                    image={tempAvatar}
                    width={150}
                    height={150}
                    border={50}
                    borderRadius={100}
                    color={[255, 255, 255, 0.6]}
                    scale={avatarScale}
                    rotate={0}
                  />
                  <div className="w-full max-w-xs">
                    <label className="block mb-1 text-sm text-gray-500 dark:text-gray-400">Zoom</label>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={avatarScale}
                      onChange={(e) => setAvatarScale(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input 
                    type="text" 
                    name="firstName"
                    value={localData.firstName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input 
                    type="text" 
                    name="lastName"
                    value={localData.lastName}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input 
                    type="email" 
                    name="email"
                    value={localData.email}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input 
                    type="tel" 
                    name="phone"
                    value={localData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Date of Birth</Label>
                  <Input 
                    type="date" 
                    name="birthDate"
                    value={localData.birthDate}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input 
                    type="text" 
                    name="city"
                    value={localData.city}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Region</Label>
                  <Input 
                    type="text" 
                    name="region"
                    value={localData.region}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input 
                    type="text" 
                    name="postalCode"
                    value={localData.postalCode}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Bio</Label>
                  <Input 
                    type="text" 
                    name="bio"
                    value={localData.bio}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-6 pt-0 mt-6">
            <Button variant="outline" onClick={closeModal} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}