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

  const renderColorScale = (wrapper, colorscale) => {
    let prevLevel;
    for (let level of colorscale) {
      let row = document.createElement("div");

      let colorBox = document.createElement("div");
      colorBox.className = "color_box";
      colorBox.style.background = level.color;
      row.appendChild(colorBox);

      let range = prevLevel ? (
        prevLevel.maxSSWI + " < sswi < " + level.maxSSWI
      ) : (
        "sswi < " + level.maxSSWI
      );

      let legend = document.createElement("p");
      legend.innerHTML = level.legend + " (" + range + ")";
      legend.className = "legend";
      row.appendChild(legend);

      wrapper.appendChild(row);
      prevLevel = level;
    }
  };

  const sswiToColor = (sswi) => {
    for (let level of colorscale) {
      if (sswi < level.maxSSWI) return level.color;
    }
    return "transparent";
  };

  const showSpinner = (show = true) => {
    const spinner = document.getElementById(spinnerId);
    if (show) spinner.style.visibility = "visible";
    else spinner.style.visibility = "hidden";
  };

  const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.sswi !== undefined) {
      layer.bindPopup(feature.properties.sswi);
    }
  };

  const update = () => {
    showSpinner();
    fetchData(getDataFname()).then((data) => {
      if (layer !== undefined) {
        map.removeLayer(layer);
      }
      layer = L.geoJSON(data.geojson, {
        onEachFeature: onEachFeature,
        pointToLayer: (feature, latlng) => {
          const color = sswiToColor(feature.properties.sswi);
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
  renderColorScale(document.getElementById(colorscaleId), colorscale);
  update();
};
