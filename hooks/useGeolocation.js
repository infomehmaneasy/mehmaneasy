"use client";

import { useCallback, useState } from "react";

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | locating | granted | denied | unsupported

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      (error) => {
        console.error("Unable to access the visitor's location:", error);
        setStatus("denied");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  return { coords, status, requestLocation };
}
