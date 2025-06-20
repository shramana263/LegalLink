// This component renders the Ola Map and allows the user to select a location.
import React, { useEffect, useRef } from 'react';
import { OlaMaps } from 'olamaps-web-sdk';

interface OlaMapProps {
  apiKey: string;
  center: [number, number];
  zoom?: number;
  onLocationSelect?: (coords: [number, number]) => void;
}

const OLA_MAP_STYLE = "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard-mr/style.json";

const OlaMap: React.FC<OlaMapProps> = ({ apiKey, center, zoom = 15, onLocationSelect }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    const olaMaps = new OlaMaps({ apiKey });
    mapInstance.current = olaMaps.init({
      style: OLA_MAP_STYLE,
      container: mapRef.current,
      center,
      zoom,
    });

    // Add click event to get coordinates
    mapInstance.current.on('click', (e: any) => {
      if (onLocationSelect && e.lngLat) {
        onLocationSelect([e.lngLat.lng, e.lngLat.lat]);
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, [apiKey, center, zoom, onLocationSelect]);

  return <div ref={mapRef} id="ola-map-container" style={{ width: '100%', height: '400px', borderRadius: 8, margin: '16px 0' }} />;
};

export default OlaMap;
