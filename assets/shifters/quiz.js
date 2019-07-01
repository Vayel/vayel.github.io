const Quiz = function(wrapper, questions) {
  const MultipleChoice = function(parent, question) {
    let html = {};

    return {
      check: () => {
        throw "Not implemented";
      },
      render: () => {
        html.wrapper = document.createElement("div");    
        html.title = document.createElement("p");
        html.title.innerText = question.text;
        html.wrapper.appendChild(html.title);
        // TODO
        parent.appendChild(html.wrapper);
      },
    };
  };
  
  questions = questions.map(json => {
    switch(json.type) {
      case "multiple_choice":
        return MultipleChoice(wrapper, json);
      default:
        throw "Unknown question type: " + json.type;
    }
  });
  questions.map(q => q.render());

  return {
    check: function() {
      throw "Not implemented"; 
    },
  };
};
