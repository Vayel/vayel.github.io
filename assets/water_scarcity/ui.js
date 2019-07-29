(function() {
  const rootImgUrl = "/assets/water_scarcity/img/";
  const rootDataUrl = "/assets/water_scarcity/data/sswi/";
  const colorscale = ["transparent", "#e08f17", "#a9381c", "#000000"];
  const horizonSelect = document.getElementById("horizon");
  const seasonSelect = document.getElementById("season");
  
  const renderLegend = (wrapperId, colors, legends) => {
    const wrapper = document.getElementById(wrapperId);

    for (let i in colors) {
      if (colors[i] == "transparent") continue;
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

  const getImgUrl = () => {
    const h = horizonSelect.options[horizonSelect.selectedIndex].value; 
    const s = seasonSelect.options[seasonSelect.selectedIndex].value; 
    return rootImgUrl + h + "_" + s + ".png";
  };

  const update = () => {
    document.getElementById("map").setAttribute("src", getImgUrl());
  };

  horizonSelect.addEventListener("change", update);
  seasonSelect.addEventListener("change", update);
  fetch(rootDataUrl + "metadata.json").then(
    response => response.json()
  ).then(
    data => renderLegend("legend", colorscale, data.riskLevels)
  );
  update();
})();
