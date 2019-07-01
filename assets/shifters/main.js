(function() {
  Questions.setup().then(() => {
    let cat = Questions.categories()[0];
    Questions.listFromCategory(cat).then((questions) => {
      const quiz = Quiz(
        document.getElementById("quiz"),
        questions
      );
    });
  });
})();
