import React from 'react';
import { WebView } from 'react-native-webview';

const LeafletMap = ({ region, origin, destination, routeCoordinates }) => {
  const originLat = origin?.latitude;
  const originLng = origin?.longitude;
  const destLat = destination?.latitude;
  const destLng = destination?.longitude;
  const routeCoords = routeCoordinates?.map(coord => [coord.latitude, coord.longitude]) || [];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([${region?.latitude || -23.5505}, ${region?.longitude || -46.6333}], ${region?.latitudeDelta ? Math.round(14 - Math.log2(region.latitudeDelta * 100)) : 12});
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        ${originLat && originLng ? `
          const originMarker = L.marker([${originLat}, ${originLng}]).addTo(map);
          originMarker.bindPopup('Origem').openPopup();
        ` : ''}

        ${destLat && destLng ? `
          const destMarker = L.marker([${destLat}, ${destLng}]).addTo(map);
          destMarker.bindPopup('Destino').openPopup();
        ` : ''}

        ${routeCoords.length > 0 ? `
          const routeLine = L.polyline([${routeCoords.map(coord => `[${coord[0]}, ${coord[1]}]`).join(',')}], {
            color: '#1f6feb',
            weight: 5
          }).addTo(map);
          map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
        ` : ''}
      </script>
    </body>
    </html>
  `;

  return <WebView source={{ html: htmlContent }} style={{ flex: 1 }} />;
};

export default LeafletMap;
