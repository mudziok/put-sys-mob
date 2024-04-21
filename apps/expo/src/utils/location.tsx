import { useEffect, useState } from "react";
import * as Location from "expo-location";

export interface Coords {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

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

  const coords = {
    latitude: location?.coords.latitude ?? 37.78825,
    longitude: location?.coords.longitude ?? -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return { coords };
};

export const useScrollLocation = () => {
  const { coords: locationCoords } = useLocation();
  const [scrollCoords, setScrollCoords] = useState<Coords | null>(null);

  const isScrolled = Boolean(scrollCoords);
  const resetCoords = () => setScrollCoords(null);

  const coords = scrollCoords ?? locationCoords;

  return {
    coords,
    scrollCoords,
    locationCoords,
    isScrolled,
    setScrollCoords,
    resetCoords,
  };
};
