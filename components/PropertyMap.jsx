"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LocateFixed, MapPin, Star, X } from "lucide-react";
import { isValidCoordinates } from "@/lib/mapLocation";
import { useGeolocation } from "@/hooks/useGeolocation";

const LeafletMap = dynamic(() => import("./PropertyMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 animate-pulse bg-[#e8e9e4]" aria-label="Loading map" />
  ),
});

const CITY_COORDINATES = {
  agra: [27.1767, 78.0081],
  ahmedabad: [23.0225, 72.5714],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  bhopal: [23.2599, 77.4126],
  chandigarh: [30.7333, 76.7794],
  chennai: [13.0827, 80.2707],
  coimbatore: [11.0168, 76.9558],
  delhi: [28.6139, 77.209],
  goa: [15.2993, 74.124],
  gurugram: [28.4595, 77.0266],
  hyderabad: [17.385, 78.4867],
  jaipur: [26.9124, 75.7873],
  kochi: [9.9312, 76.2673],
  kolkata: [22.5726, 88.3639],
  lucknow: [26.8467, 80.9462],
  mumbai: [19.076, 72.8777],
  mysuru: [12.2958, 76.6394],
  pune: [18.5204, 73.8567],
  udaipur: [24.5854, 73.7125],
  visakhapatnam: [17.6868, 83.2185],
  calangute: [15.5439, 73.7553],
  candolim: [15.5181, 73.7626],
  panaji: [15.4909, 73.8278],
};

function getCityCoordinates(city) {
  const name = String(city || "").toLowerCase().trim();
  const match = Object.entries(CITY_COORDINATES)
    .sort(([left], [right]) => right.length - left.length)
    .find(([cityName]) => name.includes(cityName));
  return match?.[1] || null;
}

function getDestinationCoordinates(destination) {
  return getCityCoordinates(destination);
}

function buildMapPoints(properties) {
  const exactPoints = [];
  const approximateByCity = new Map();

  properties.forEach((property, index) => {
    const id = String(property.id || property._id || index);
    const coordinates = property.mapCoordinates;
    if (
      coordinates &&
      isValidCoordinates(Number(coordinates.lat), Number(coordinates.lng))
    ) {
      exactPoints.push({
        id,
        position: [Number(coordinates.lat), Number(coordinates.lng)],
        property,
        exact: true,
        count: 1,
      });
      return;
    }

    const position = getCityCoordinates(property.city);
    if (!position) return;
    const cityKey = String(property.city || "").trim().toLowerCase();
    const current = approximateByCity.get(cityKey);
    if (current) {
      current.properties.push(property);
    } else {
      approximateByCity.set(cityKey, {
        id: `area-${cityKey || id}`,
        position,
        property,
        properties: [property],
        exact: false,
      });
    }
  });

  const approximatePoints = Array.from(approximateByCity.values()).map((group) => {
    const lowestPriceProperty = group.properties.reduce((lowest, property) =>
      Number(property.price || 0) < Number(lowest.price || 0) ? property : lowest
    );
    return {
      ...group,
      property: lowestPriceProperty,
      count: group.properties.length,
    };
  });

  return [...exactPoints, ...approximatePoints];
}

export default function PropertyMap({ properties = [], destination = "" }) {
  const [selectedId, setSelectedId] = useState(null);
  const { coords, status, requestLocation } = useGeolocation();
  const points = useMemo(() => buildMapPoints(properties), [properties]);
  const selectedPoint = points.find((point) => point.id === selectedId);
  const selectedProperty = selectedPoint?.property;
  const exactCount = points.filter((point) => point.exact).length;
  const approximateCount = points.filter((point) => !point.exact).length;

  return (
    <aside
      aria-label="Map of available stays"
      className="property-map relative h-[min(68svh,720px)] min-h-[420px] overflow-hidden rounded-[28px] border border-[#dce1da] bg-[#e8e9e4] text-[#24302b] shadow-[0_24px_70px_rgba(25,39,31,0.16)] sm:min-h-[520px]"
    >
      <LeafletMap
        points={points}
        userLocation={coords}
        destination={getDestinationCoordinates(destination)}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId((current) => (current === id ? null : id))}
      />

      <div className="pointer-events-none absolute inset-0 z-[400] bg-[linear-gradient(180deg,rgba(18,31,25,0.5),transparent_22%,transparent_72%,rgba(18,31,25,0.12))]" />

      <div className="absolute left-4 right-4 top-4 z-[500] flex items-start justify-between gap-3 sm:left-6 sm:right-6 sm:top-6">
        <div className="rounded-2xl border border-white/55 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[#bd604a]">
            The stay atlas
          </p>
          <p className="mt-1 text-sm font-semibold text-[#26322c]">
            {exactCount + approximateCount}{" "}
            {exactCount + approximateCount === 1 ? "map location" : "map locations"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => requestLocation()}
          disabled={status === "locating"}
          aria-label="Center map on my location"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/90 text-[#26322c] shadow-lg backdrop-blur transition hover:scale-105 hover:text-[#bd604a] disabled:cursor-wait disabled:opacity-60"
          title="Explore stays near me"
        >
          <LocateFixed size={18} />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2 sm:bottom-6 sm:left-6">
        {exactCount > 0 && (
          <span className="rounded-full border border-white/55 bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-[#34433b] shadow backdrop-blur">
            {exactCount} exact {exactCount === 1 ? "pin" : "pins"}
          </span>
        )}
        {approximateCount > 0 && (
          <span className="rounded-full border border-white/55 bg-white/90 px-3 py-1.5 text-[10px] font-medium text-[#65716a] shadow backdrop-blur">
            {approximateCount} approximate{" "}
            {approximateCount === 1 ? "area" : "areas"}
          </span>
        )}
        {status === "denied" && (
          <span role="status" className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] text-[#65716a] shadow">
            Location access is off
          </span>
        )}
        {status === "unsupported" && (
          <span role="status" className="rounded-full bg-white/95 px-3 py-1.5 text-[10px] text-[#65716a] shadow">
            Location is unavailable in this browser
          </span>
        )}
      </div>

      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-x-6 top-1/2 z-[450] -translate-y-1/2 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#bd604a] shadow">
            <MapPin size={20} />
          </span>
          <p className="mt-4 text-base font-semibold text-[#26322c]">
            Your next stay will find its place here.
          </p>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#65716a]">
            Hosts add an exact pin when listing. The public map never displays a
            full street address.
          </p>
        </div>
      )}

      {selectedProperty && (
        <div className="absolute bottom-14 left-4 right-4 z-[600] flex items-center gap-3 rounded-2xl border border-white/15 bg-[#17221d]/95 p-3 text-white shadow-xl backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-auto sm:w-[min(350px,calc(100%-3rem))]">
          {selectedProperty.images?.[0] ? (
            <img
              src={selectedProperty.images[0]}
              alt=""
              className="h-16 w-16 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#f0b39d]">
              <MapPin size={22} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {selectedProperty.title || "A welcoming stay"}
            </p>
            <p className="mt-1 text-xs text-white/70">
              {selectedProperty.city || "India"} · ₹
              {Number(selectedProperty.price || 0).toLocaleString("en-IN")}
              {selectedProperty.priceBasis === "night" ? " / night" : ""}
              {selectedProperty.rating && (
                <span className="ml-2 inline-flex items-center gap-1">
                  <Star size={11} className="fill-[#f2c26b] text-[#f2c26b]" />
                  {Number(selectedProperty.rating).toFixed(1)}
                </span>
              )}
            </p>
            {!selectedPoint.exact && selectedPoint.count > 1 && (
              <p className="mt-1 text-[10px] text-white/55">
                Lowest price in this area · {selectedPoint.count} stays
              </p>
            )}
            <Link
              href={`/property/${selectedProperty.id || selectedProperty._id}`}
              className="mt-2 inline-block text-xs font-semibold text-[#f0b39d] hover:underline"
            >
              View stay
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            aria-label="Close stay preview"
            className="self-start rounded-full p-1 text-white/60 hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </aside>
  );
}
