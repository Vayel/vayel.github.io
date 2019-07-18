const SSWI = (mapId, horizonSelectId, seasonSelectId, rootUrl = "/assets/water_scarcity/data/sswi/") => {
  const horizonSelect = document.getElementById(horizonSelectId);
  const seasonSelect = document.getElementById(seasonSelectId);
  const map = L.map(mapId).setView([46.3630104, 2.9846608], 5);
  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

  const getDataFname = () => {
    const h = horizonSelect.options[horizonSelect.selectedIndex].value; 
    const s = seasonSelect.options[seasonSelect.selectedIndex].value; 
    return h + "_" + s + ".json";
  };

  const fetchData = (fname) => fetch(rootUrl + fname).then((response) => response.json());

  // TODO
  const sswiToColor = (sswi) => {
    if (sswi > 0) return "red";
    if (sswi < 0) return "blue";
    return "black";
  };

  const update = () => {
    fetchData(getDataFname()).then((data) => {
      L.geoJSON(data, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
          radius: 3,
          fillColor: sswiToColor(feature.properties.sswi),
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        })
      }).addTo(map);
    });
  };

  horizonSelect.addEventListener("change", update);
  seasonSelect.addEventListener("change", update);
  update();
};
