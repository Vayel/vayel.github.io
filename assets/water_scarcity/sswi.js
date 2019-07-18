const SSWI = (mapId, horizonSelectId, seasonSelectId, spinnerId, rootUrl = "/assets/water_scarcity/data/sswi/") => {
  const horizonSelect = document.getElementById(horizonSelectId);
  const seasonSelect = document.getElementById(seasonSelectId);
  const map = L.map(mapId).setView([46.3630104, 2.9846608], 5);
  L.tileLayer("http://{s}.tile.osm.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);
  let layer;

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

  const showSpinner = (show = true) => {
    const spinner = document.getElementById("spinner");
    if (show) spinner.style.display = "block";
    else spinner.style.display = "none";
  };

  const update = () => {
    showSpinner();
    fetchData(getDataFname()).then((data) => {
      if (layer !== undefined) {
        map.removeLayer(layer);
      }
      layer = L.geoJSON(data, {
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, {
          radius: 3,
          fillColor: sswiToColor(feature.properties.sswi),
          weight: 1,
          opacity: 1,
          fillOpacity: 0.8
        })
      });
      layer.addTo(map);
      showSpinner(false);
    });
  };

  horizonSelect.addEventListener("change", update);
  seasonSelect.addEventListener("change", update);
  update();
};
