"use client";

import { useEffect, useMemo } from "react";
import { divIcon } from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { isValidCoordinates } from "@/lib/mapLocation";

function PinViewport({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, map, zoom]);
  return null;
}

function PinEvents({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function pinIcon() {
  return divIcon({
    className: "property-map-user-icon",
    html: '<span aria-label="Selected property location"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

export default function PropertyPinPicker({ latitude, longitude, onPick }) {
  const hasCoordinates =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined &&
    String(latitude).trim() !== "" &&
    String(longitude).trim() !== "";
  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasPin = hasCoordinates && isValidCoordinates(lat, lng);
  const center = useMemo(
    () => hasPin ? [lat, lng] : [15.2993, 74.124],
    [hasPin, lat, lng]
  );

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-ink-line">
      <MapContainer
        center={center}
        zoom={hasPin ? 15 : 8}
        scrollWheelZoom
        className="absolute inset-0 h-full w-full"
      >
        <PinViewport center={center} zoom={hasPin ? 15 : 8} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PinEvents onPick={onPick} />
        {hasPin && <Marker position={center} icon={pinIcon()} />}
      </MapContainer>
      <span className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-full bg-white/95 px-3 py-2 text-xs font-semibold text-[#26322c] shadow">
        {hasPin ? "Click the map to move your pin" : "Click the map to place your pin"}
      </span>
    </div>
  );
}
