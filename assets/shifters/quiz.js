const Quiz = (function() {
  class AbstractQuestion {
    constructor(type, parent, question) {
      this.type = type;
      this.parent = parent;
      this.question = question;
      this.html = {};
    }

    check() {
      throw "Not implemented";
    }

    renderCheck(correct) {
      if (correct) {
        this.html.icon.setAttribute("class", "icon success");
        this.html.icon.innerHTML = '<i class="fa fa-check-circle-o fa-2x"></i>';
        return;
      }
      else if (correct === false) {
        this.html.icon.setAttribute("class", "icon error");
        this.html.icon.innerHTML = '<i class="fa fa-times-circle-o fa-2x"></i>';
        return;
      }
      this.html.icon.setAttribute("class", "icon");
      this.html.icon.innerHTML = '<i class="fa fa-question-circle-o fa-2x"></i>';
    }

    render() {
      let wrapper = document.createElement("div");    
      wrapper.setAttribute("class", "question " + this.type);

      let header = document.createElement("div");
      header.setAttribute("class", "header");
      wrapper.appendChild(header);

      this.html.icon = document.createElement("div");
      this.html.icon.setAttribute("class", "icon");
      this.html.icon.innerHTML = '<i class="fa fa-question-circle-o fa-2x"></i>';
      header.appendChild(this.html.icon);

      let title = document.createElement("p");
      title.setAttribute("class", "title");
      title.innerText = this.question.text;
      header.appendChild(title);

      let form = document.createElement("form");
      this.renderForm(form);
      wrapper.appendChild(form);
      this.parent.appendChild(wrapper);
    }

    renderForm(form) {
      throw "Not implemented";
    }
  }

  class SingleChoice extends AbstractQuestion {
    constructor(parent, question) {
      super("single_choice", parent, question);
    }

    check() {
      let selected = null;
      for (let input of this.html.inputs) {
        if (input.checked) {
          selected = parseInt(input.value);
          break;
        }
      }
      if (selected === null) return null;
      return selected === this.question.answer;
    }

    renderForm(form) {
      this.html.inputs = [];
      for (let i in this.question.choices) {
        let div = document.createElement("div");
        div.setAttribute("class", "choice");

        let id = "question-" + this.question.id + "-" + i;
        let input = document.createElement("input");
        input.setAttribute("type", "radio");
        input.setAttribute("name", "question-" + this.question.id);
        input.setAttribute("id", id);
        input.setAttribute("value", i);
        this.html.inputs.push(input);
        div.appendChild(input);

        let label = document.createElement("label");
        label.innerText = this.question.choices[i];
        label.setAttribute("for", id);
        div.appendChild(label);

        form.appendChild(div);
      }
    }
  };

  class MultipleChoice extends AbstractQuestion {
    constructor(parent, question) {
      super("multiple_choice", parent, question);
    }

    check() {
      let selected = new Set();
      for (let input of this.html.inputs) {
        if (input.checked) {
          selected.add(parseInt(input.value));
        }
      }
      if (!selected.size) return null;
      return new Immutable.Set(selected).equals(
        new Immutable.Set(this.question.answer)
      );
    }

    renderForm(form) {
      this.html.inputs = [];
      for (let i in this.question.choices) {
        let div = document.createElement("div");
        div.setAttribute("class", "choice");

        let id = "question-" + this.question.id + "-" + i;
        let input = document.createElement("input");
        input.setAttribute("type", "checkbox");
        input.setAttribute("id", id);
        input.setAttribute("value", i);
        this.html.inputs.push(input);
        div.appendChild(input);

        let label = document.createElement("label");
        label.innerText = this.question.choices[i];
        label.setAttribute("for", id);
        div.appendChild(label);

        form.appendChild(div);
      }
    }
  };

  return (wrapper, questions) => {
    let self = {};

    self.check = () => {
      const correct = questions.map(q => q.check());
      self.renderCheck(correct);
      console.log(correct) // TODO: stats
    };

    self.renderCheck = (correct) => {
      for (let i in correct) {
        questions[i].renderCheck(correct[i]);
      }
    };
    
    questions = questions.map(json => {
      switch(json.type) {
        case "single_choice":
          return new SingleChoice(wrapper, json);
        case "multiple_choice":
          return new MultipleChoice(wrapper, json);
        default:
          throw "Unknown question type: " + json.type;
      }
    });
    questions.map(q => q.render());
    
    let checkWrapper = document.createElement("div");
    checkWrapper.setAttribute("class", "check");

    let checkBtn = document.createElement("button");
    checkBtn.innerText = "Check";
    checkBtn.addEventListener("click", self.check);
    checkWrapper.appendChild(checkBtn);
    wrapper.appendChild(checkWrapper);

    return self;
  };
})();
