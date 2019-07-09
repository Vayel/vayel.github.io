(function() {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function getConfigFromUrl() {
    let config = {};
    const params = new URLSearchParams(window.location.search);
    for (let p of params) {
      config[p[0]] = p[1];
    }
    return config;
  }

  Questions.setup().then(() => {
    const config = getConfigFromUrl();

    if (config.group !== undefined) {
      return Questions.listFromGroup(config.group).then((questions) => {
        Quiz($("#quiz"), shuffle(questions));
        $("#quiz").show();
        $("#spinner").hide();
      });
    }
    
    $("#question_groups_form").submit(function(e) {
      e.preventDefault();
      let group = $("#question_groups_form select").val(); 
      window.location.href = window.location.pathname + "?" + $.param({ group });
    });
    $("#question_groups_form select").append(Questions.groups().map(
      group => '<option value="' + group + '">' + group + '</option>'
    ));
    $("#config").css("display", "flex");
    $("#spinner").hide();
  });
})();
