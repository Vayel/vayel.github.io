const Quiz = (function() {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

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
        this.html.icon.setAttribute("class", "icon success_color");
        this.html.icon.innerHTML = '<i class="fa fa-check-circle-o fa-2x"></i>';
        return;
      }
      else if (correct === false) {
        this.html.icon.setAttribute("class", "icon mistake_color");
        this.html.icon.innerHTML = '<i class="fa fa-times-circle-o fa-2x"></i>';
        return;
      }
      this.html.icon.setAttribute("class", "icon unanswered_color");
      this.html.icon.innerHTML = '<i class="fa fa-question-circle-o fa-2x"></i>';
    }

    render() {
      let wrapper = document.createElement("div");    
      wrapper.setAttribute("class", "question " + this.type);

      let header = document.createElement("div");
      header.setAttribute("class", "header");
      wrapper.appendChild(header);

      this.html.icon = document.createElement("div");
      this.html.icon.setAttribute("class", "icon unanswered_color");
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
    constructor(parent, question, shuffleChoices = true) {
      if (shuffleChoices) {
        shuffle(question.choices);
      }
      super("single_choice", parent, question);
    }

    check() {
      let selected = null;
      for (let input of this.html.inputs) {
        if (input.checked) {
          selected = input.value;
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
        input.setAttribute("value", this.question.choices[i]);
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
    constructor(parent, question, shuffleChoices = true) {
      if (shuffleChoices) {
        shuffle(question.choices);
      }
      super("multiple_choice", parent, question);
    }

    check() {
      let selected = new Set();
      for (let input of this.html.inputs) {
        if (input.checked) {
          selected.add(input.value);
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
        input.setAttribute("value", this.question.choices[i]);
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

  class Ranking extends AbstractQuestion {
    constructor(parent, question, shuffleChoices = true) {
      if (shuffleChoices) {
        shuffle(question.choices);
      }
      super("ranking", parent, question);
    }

    check() {
      let answer = [];
      $(this.html.ul).children().each(function() {
        answer.push(this.innerText);
      });
      return new Immutable.List(answer).equals(
        new Immutable.List(this.question.answer)
      );
    }

    renderForm(form) {
      let ul = document.createElement("ul");
      this.html.ul = ul;
      ul.setAttribute("class", "sortable");
      form.appendChild(ul);
      for (let i in this.question.choices) {
        let item = document.createElement("li");
        item.innerText = this.question.choices[i];
        ul.appendChild(item);
      }
      $(ul).sortable();
    }
  };

  return (wrapper, questions) => {
    const check = () => {
      const isCorrect = questions.map(q => q.check());
      renderCheck(isCorrect);
      renderStats(isCorrect);
    };

    const renderCheck = (isCorrect) => {
      for (let i in isCorrect) {
        questions[i].renderCheck(isCorrect[i]);
      }
    };

    const renderStatsRow = (parent, iconName, colorClass, n, nTotal) => {
      let row = document.createElement("div");
      row.setAttribute("class", "row");

      let icon = document.createElement("i");
      icon.setAttribute("class", colorClass + " icon fa fa-" + iconName + " fa-3x");
      row.appendChild(icon);

      let proportion = document.createElement("div");
      proportion.setAttribute("class", "proportion");
      proportion.innerHTML = '<span class="' + colorClass + '">' + n + "</span> / " + nTotal;
      row.appendChild(proportion);

      parent.appendChild(row);
    };

    const renderStats = (isCorrect) => {
      stats.innerHTML = "";
      const n = isCorrect.length;
      
      renderStatsRow(
        stats,
        "check-circle-o",
        "success_color",
        isCorrect.filter(x => x).length,
        n
      );

      renderStatsRow(
        stats,
        "times-circle-o",
        "mistake_color",
        isCorrect.filter(x => x === false).length,
        n
      );

      renderStatsRow(
        stats,
        "question-circle-o",
        "unanswered_color",
        isCorrect.filter(x => x === null).length,
        n
      );
    };
    
    questions = questions.map(json => {
      switch(json.type) {
        case "single_choice":
          return new SingleChoice(wrapper, json);
        case "multiple_choice":
          return new MultipleChoice(wrapper, json);
        case "ranking":
          return new Ranking(wrapper, json);
        default:
          throw "Unknown question type: " + json.type;
      }
    });
    questions.map(q => q.render());
    
    let stats = document.createElement("div");
    stats.setAttribute("class", "stats");
    wrapper.appendChild(stats);

    let checkWrapper = document.createElement("div");
    checkWrapper.setAttribute("class", "check");

    let checkBtn = document.createElement("button");
    checkBtn.innerText = "Check";
    checkBtn.addEventListener("click", check);
    checkWrapper.appendChild(checkBtn);
    wrapper.appendChild(checkWrapper);
  };
})();
