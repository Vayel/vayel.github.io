(function() {
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const getConfigFromUrl = () => {
    let config = {};
    const params = new URLSearchParams(window.location.search);
    for (let p of params) {
      config[p[0]] = p[1];
    }
    return config;
  }

  const createQuiz = (questions) => {
    Quiz($("#quiz"), shuffle(questions));
    $("#quiz").show();
    $("#spinner").hide();
  }

  Questions.setup().then(() => {
    const config = getConfigFromUrl();

    if (config.group) {
      return Questions.listFromGroup(config.group).then(createQuiz);
    }

    if (config.number && config.level && config.number) {
      return Questions.listFromConfig(config).then(createQuiz);
    }
    
    $("#quiz_config_form").submit(function(e) {
      e.preventDefault();
      const number = $("#n_questions_select").val(); 
      const level = $("#level_select").val(); 
      const category = $("#category_select").val(); 
      window.location.href = window.location.pathname + "?" + $.param({
        number, level, category
      });
    });
    $("#category_select").append(Questions.categories().map(
      x => '<option value="' + x + '">' + x + '</option>'
    ));
    $("#level_select").append(Questions.levels().map(
      x => '<option value="' + x + '">' + x + '</option>'
    ));

    $("#question_groups_form").submit(function(e) {
      e.preventDefault();
      const group = $("#question_groups_form select").val(); 
      window.location.href = window.location.pathname + "?" + $.param({ group });
    });
    $("#question_groups_form select").append(Questions.groups().map(
      group => '<option value="' + group + '">' + group + '</option>'
    ));

    $("#config").css("display", "flex");
    $("#spinner").hide();
  });
})();
