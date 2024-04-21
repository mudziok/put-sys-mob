import { useEffect, useState } from "react";
import * as Location from "expo-location";

export const useLocation = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );

  useEffect(() => {
    const updateLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    };

    void updateLocation();
    const interval = setInterval(() => void updateLocation(), 10000);
    return () => clearInterval(interval);
  }, []);

  return { location };
};
