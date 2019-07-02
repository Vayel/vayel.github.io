(function() {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  Questions.setup().then(() => {
    let cat = Questions.categories()[0];
    Questions.listFromCategory(cat).then((questions) => {
      const quiz = Quiz(
        document.getElementById("quiz"),
        shuffle(questions)
      );
    });
  });
})();
