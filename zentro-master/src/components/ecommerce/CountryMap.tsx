  import { VectorMap } from "@react-jvectormap/core";
  import { worldMill } from "@react-jvectormap/world";

  interface RegionMarker {
    name: string;
    latLng: [number, number];
    value?: number; // например, количество клиентов
  }

  interface CountryMapProps {
    mapColor?: string;
    markers?: RegionMarker[];
    onRegionClick?: (regionName: string) => void;
  }

  const CountryMap: React.FC<CountryMapProps> = ({
    mapColor,
    markers = [],
    onRegionClick,
  }) => {
    const getRadius = (value?: number) => {
      if (!value) return 5;
      if (value > 1000) return 12;
      if (value > 500) return 9;
      return 6;
    };

    const mapMarkers = markers.map((marker) => ({
      latLng: marker.latLng,
      name: `${marker.name}${marker.value ? `: ${marker.value} клиентов` : ""}`,
      style: {
        fill: "#629731",
        borderWidth: 1,
        borderColor: "white",
        r: getRadius(marker.value),
      },
    }));

    return (
      <VectorMap
        map={worldMill}
        backgroundColor="transparent"
        focusOn={{
          lat: 47.65,
          lng: 66.96,
          scale: 4.5,
          animate: true,
        }}
        markersSelectable={true}
        markerStyle={{
          initial: {
            fill: "#629731",
            stroke: "#ffffff",
            "stroke-width": 1,
            r: 6,
          } as any,
        }}
        markers={mapMarkers}
        onRegionTipShow={function (e, el, code) {
          el.html(el.html()); // не модифицируем встроенный тултип
        }}
        onRegionClick={(e, code) => {
          if (onRegionClick) onRegionClick(code);
        }}
        zoomOnScroll={false}
        zoomMax={12}
        zoomMin={1}
        zoomAnimate={true}
        zoomStep={1.5}
        regionStyle={{
          initial: {
            fill: mapColor || "#D0D5DD",
            fillOpacity: 1,
            stroke: "none",
          },
          hover: {
            fillOpacity: 0.7,
            cursor: "pointer",
            fill: "#629731",
          },
          selected: {
            fill: "#629731",
          },
        }}
        regionLabelStyle={{
          initial: {
            fill: "#35373e",
            fontWeight: 500,
            fontSize: "13px",
          },
        }}
      />
    );
  };

  export default CountryMap;
