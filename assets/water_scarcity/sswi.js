const SSWI = (mapId, horizonSelectId, seasonSelectId, colorscaleId, colorscale, spinnerId, rootUrl = "/assets/water_scarcity/data/sswi/") => {
  const horizonSelect = document.getElementById(horizonSelectId);
  const seasonSelect = document.getElementById(seasonSelectId);
  const map = L.map(mapId).setView([46.4, 2.5], 5);
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

  const renderColorScale = (wrapperId, colors, legends) => {
    const wrapper = document.getElementById(wrapperId);

    for (let i in colors) {
      let row = document.createElement("div");

      let colorBox = document.createElement("div");
      colorBox.className = "color_box";
      colorBox.style.background = colors[i];
      row.appendChild(colorBox);

      let legend = document.createElement("p");
      legend.innerHTML = legends[i];
      legend.className = "legend";
      row.appendChild(legend);

      wrapper.appendChild(row);
    }
  };

  const showSpinner = (show = true) => {
    const spinner = document.getElementById(spinnerId);
    if (show) spinner.style.visibility = "visible";
    else spinner.style.visibility = "hidden";
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.riskLevel !== undefined) {
      layer.bindPopup(feature.properties.riskLevel);
    }
  };

  const update = () => {
    showSpinner();
    fetchData(getDataFname()).then(geojson => {
      if (layer !== undefined) {
        map.removeLayer(layer);
      }
      layer = L.geoJSON(geojson, {
        onEachFeature: onEachFeature,
        pointToLayer: (feature, latlng) => {
          const color = colorscale[feature.properties.riskLevel];
          return L.circleMarker(latlng, {
            radius: 1.5,
            fillColor: color,
            fillOpacity: 1,
            color: color,
            weight: 1,
            opacity: 1,
          });
        }
      });
      layer.addTo(map);
      showSpinner(false);
    });
  };

  horizonSelect.addEventListener("change", update);
  seasonSelect.addEventListener("change", update);
  update();
  fetchData("metadata.json").then(
    data => renderColorScale(colorscaleId, colorscale, data.riskLevels)
  );
};
