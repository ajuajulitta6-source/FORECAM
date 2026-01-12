
import React, { useEffect, useState } from 'react';
import { MapPin, Bell, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PermissionManager: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [permissions, setPermissions] = useState({
    location: false,
    notification: false
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = () => {
    const isLocGranted = 'geolocation' in navigator; // Basic check, real status check is async
    const isNotifGranted = 'Notification' in window && Notification.permission === 'granted';

    setPermissions({
      location: isLocGranted,
      notification: isNotifGranted
    });

    // If notifications are not granted (default or denied), show banner
    if ('Notification' in window && Notification.permission === 'default') {
      setShowBanner(true);
    }
  };

  const requestPermissions = async () => {
    // 1. Request Notification Permission
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast.success("Notifications enabled!");
          new Notification("ConstructMate", {
            body: "You will now receive alerts even when the app is closed.",
            icon: "/vite.svg"
          });
        }
      } catch (error) {
        console.error("Notification permission error:", error);
      }
    }

    // 2. Request Location Access
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("User Location:", position.coords.latitude, position.coords.longitude);
          // In a real app, you would send this to your backend API here
          // updateUserLocation(user.id, position.coords);
          toast.success("Location tracking enabled");
        },
        (error) => {
          console.error("Location error:", error);
          if (error.code === error.PERMISSION_DENIED) {
            toast.error("Location access denied. Some features may not work.");
          }
        }
      );
    }

    setShowBanner(false);
    checkPermissions();
  };

  if (!showBanner) return null;

  return (
    <div className="bg-blue-600 text-white px-4 py-3 shadow-lg relative z-50">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Enable Permissions</p>
            <p className="text-xs text-blue-100">Allow notifications and location access to receive critical alerts when you are off-site.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={requestPermissions}
            className="flex-1 sm:flex-none bg-white text-blue-600 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors whitespace-nowrap"
          >
            Allow Access
          </button>
          <button onClick={() => setShowBanner(false)} className="text-blue-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;
