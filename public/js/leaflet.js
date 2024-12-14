document.addEventListener("DOMContentLoaded", () => {
  // Initialize the map, centered around a default location
  // console.log("Leaflet script loaded and running...");
  const map = L.map("map").setView([40.712776, -74.005974], 12); // Default center: New York City
  // console.log(map);
  // Add the OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Add markers for each store
  stores.forEach((store) => {
    const { name, location } = store;
    const marker = L.marker([
      location.coordinates[1],
      location.coordinates[0],
    ]).addTo(map); // Lat, Lng
    marker.bindPopup(`
        <b>${name}</b><br>
        ${location.address}
      `);
  });

  // Adjust map bounds to fit all markers
  const bounds = stores.map((store) => [
    store.location.coordinates[1],
    store.location.coordinates[0],
  ]);
  if (bounds.length > 0) {
    map.fitBounds(bounds);
  }
});
