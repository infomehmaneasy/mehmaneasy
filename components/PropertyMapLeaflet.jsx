"use client";

import { useEffect } from "react";
import { divIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

function MapViewport({ points, userLocation, destination, selectedPoint }) {
  const map = useMap();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(map.getContainer());
    map.invalidateSize();
    return () => resizeObserver.disconnect();
  }, [map]);

  useEffect(() => {
    if (selectedPoint) {
      map.setView(selectedPoint.position, selectedPoint.exact ? 14 : 11, {
        animate: true,
      });
      return;
    }

    if (userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 11, { animate: true });
      return;
    }

    if (points.length > 1) {
      map.fitBounds(points.map(({ position }) => position), {
        padding: [48, 48],
        maxZoom: 13,
        animate: true,
      });
    } else if (points.length === 1) {
      const { position, exact } = points[0];
      map.setView(position, exact ? 14 : 11, { animate: true });
    } else if (destination) {
      map.setView(destination, 10, { animate: true });
    } else {
      map.setView([22.5, 79], 5, { animate: true });
    }
  }, [destination, map, points, selectedPoint, userLocation]);

  useMapEvents({
    load() {
      map.invalidateSize();
    },
  });

  return null;
}

function priceIcon(property, exact, count) {
  const price = `₹${Number(property.price || 0).toLocaleString("en-IN")}`;
  const hasRating =
    property.rating !== null &&
    property.rating !== undefined &&
    property.rating !== "";
  const rating = hasRating ? Number(property.rating) : null;
  const ratingLabel =
    rating !== null && Number.isFinite(rating) && rating > 0 && rating <= 5
      ? `★ ${rating.toFixed(1)}`
      : "New";
  const icon = divIcon({
    className: "property-price-icon",
    html: `<span class="property-price-pin${exact ? "" : " property-price-pin--approximate"}"><span>${price}</span>${ratingLabel ? `<small>${ratingLabel}</small>` : ""}${!exact ? `<em>${count > 1 ? `${count} stays` : "area"}</em>` : ""}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
  return icon;
}

export default function PropertyMapLeaflet({
  points,
  userLocation,
  destination,
  selectedId,
  onSelect,
}) {
  const mapCenter = points[0]?.position || userLocation || destination || [22.5, 79];
  const selectedPoint = points.find(({ id }) => id === selectedId);

  return (
    <MapContainer
      center={mapCenter}
      zoom={5}
      minZoom={3}
      maxZoom={18}
      scrollWheelZoom
      className="property-map__canvas absolute inset-0 h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport
        points={points}
        userLocation={userLocation}
        destination={destination}
        selectedPoint={selectedPoint}
      />
      {points.map(({ id, position, property, exact, count }) => (
        <Marker
          key={id}
          position={position}
          icon={priceIcon(property, exact, count)}
          eventHandlers={{
            click: () => onSelect(id),
          }}
        />
      ))}
      {userLocation && (
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={divIcon({
            className: "property-map-user-icon",
            html: '<span aria-label="Your location"></span>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          })}
          interactive={false}
        />
      )}
    </MapContainer>
  );
}
