const Quiz = function(wrapper, questions) {
  const MultipleChoice = function(parent, question) {
    let html = {};

    return {
      check: () => {
        let selected = new Set();
        for (let option of html.select.options) {
          if (option.selected) {
            selected.add(parseInt(option.value));
          }
        }
        return new Immutable.Set(selected).equals(
          new Immutable.Set(question.answer)
        );
      },
      render: () => {
        html.wrapper = document.createElement("div");    
        html.title = document.createElement("p");
        html.title.innerText = question.text;
        html.wrapper.appendChild(html.title);

        html.select = document.createElement("select");
        html.select.setAttribute("multiple", true);

        for (let i in question.choices) {
          let option = document.createElement("option");
          option.value = i;
          option.innerText = question.choices[i];
          html.select.appendChild(option);
        }

        html.wrapper.appendChild(html.select);
        parent.appendChild(html.wrapper);
      },
    };
  };

  let self = {};
  self.check = () => questions.map(q => q.check());
  
  questions = questions.map(json => {
    switch(json.type) {
      case "multiple_choice":
        return MultipleChoice(wrapper, json);
      default:
        throw "Unknown question type: " + json.type;
    }
  });
  questions.map(q => q.render());
  
  let checkBtn = document.createElement("button");
  checkBtn.innerText = "Check";
  checkBtn.addEventListener("click", (e) => {
    console.log(self.check())
  });
  wrapper.appendChild(checkBtn);

  return self;
};
