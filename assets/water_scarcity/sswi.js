const SSWI = (mapId, horizonSelectId, seasonSelectId, colorscaleId, spinnerId, rootUrl = "/assets/water_scarcity/data/sswi/") => {
  const horizonSelect = document.getElementById(horizonSelectId);
  const seasonSelect = document.getElementById(seasonSelectId);
  const map = L.map(mapId, {
    zoomControl: false,
    dragging: false,
    scrollWheelZoom: false
  }).setView([46.3630104, 2.9846608], 5.5);
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

  const toAbsValue = (percentage, min, max) => min + percentage * (max - min);

  const renderColorScale = (wrapperId, min, max, steps = 10) => {
    const wrapper = document.getElementById(wrapperId);
    wrapper.innerHTML = "";
    return; // TODO

    let stepDiv, color;
    for (let i = 0; i < steps; i++) {
      color = sswiToColor(toAbsValue(i / (steps - 1), min, max), min, max);
      stepDiv = document.createElement("div");
      stepDiv.style.minHeight = "100%";
      stepDiv.style.background = color;
      wrapper.appendChild(stepDiv);
    }
  };

  // TODO
  const sswiToColor = (sswi, min, max) => {
    if (sswi < 0) {
      const lum = toAbsValue(1 - sswi / min, 20, 100);
      return "hsl(0, 100%, " + lum + "%)";
    }
    if (sswi > 0) {
      const lum = toAbsValue(1 - sswi / max, 20, 100);
      return "hsl(240, 100%, " + lum + "%)";
    }
    return "white";
  };

  const showSpinner = (show = true) => {
    const spinner = document.getElementById(spinnerId);
    if (show) spinner.style.display = "block";
    else spinner.style.display = "none";
  };

  const onEachFeature = (feature, layer) => {
    layer.bindPopup(feature.properties.sswi);
  };

  const update = () => {
    showSpinner();
    fetchData(getDataFname()).then((data) => {
    renderColorScale(colorscaleId, data.sswi.min, data.sswi.max);
      if (layer !== undefined) {
        map.removeLayer(layer);
      }
      layer = L.geoJSON(data.geojson, {
        onEachFeature: onEachFeature,
        pointToLayer: (feature, latlng) => {
          const color = sswiToColor(feature.properties.sswi, data.sswi.min, data.sswi.max);
          return L.circleMarker(latlng, {
            radius: 3.5,
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
};
