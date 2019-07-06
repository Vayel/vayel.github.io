var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration");
var questionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Questions");
var config = null;

function checkUnique(array, errorSuffix) {
  const unique = array.filter(function(item, pos) {
    return array.indexOf(item) == pos;
  });
  if (unique.length != array.length) throw "Il ne peut y avoir de duplicats dans " + errorSuffix + ".";
}

function readQuestionsConfig() {
  var keyVals = SpreadsheetApp.getActiveSpreadsheet().getNamedRanges().filter(function(r) {
    return r.getName().split(".")[0] == "question";
  }).map(function(r) {
    return [
      r.getName().split(".")[1],
      r.getRange().getColumn()
    ];
  });
  var cols = {};
  for (var i = 0; i < keyVals.length; i++) {
    cols[keyVals[i][0]] = keyVals[i][1];
  }
  return { cols: cols };
}

function readQuestionGroupsConfig() {
  var range = SpreadsheetApp.getActiveSpreadsheet().getRangeByName("groups");
  var cols = {}, cell;
  for (var j = 1; j <= range.getNumColumns(); j++) {
    cell = range.getCell(1, j);
    cols[cell.getValue()] = cell.getColumn();
  }
  return { cols: cols };
}

function updateConfig() {
  config = {
    questions: readQuestionsConfig(),
    questionGroups: readQuestionGroupsConfig(),
    export: {
      nParsedRows: parseInt(configSheet.getRange(2, 1).getValue()),
      errorsCol: SpreadsheetApp.getActiveSpreadsheet().getRangeByName("export.errors").getColumn(),
      outputCol: SpreadsheetApp.getActiveSpreadsheet().getRangeByName("export.output").getColumn(),
      validatedQuestionState: configSheet.getRange(2, 2).getValue(),
    }
  };
}

function parseCellWithSep(content, sep) {
  if (typeof content !== "string") {
    content = content.toString();
  }
  return content.split(sep).map(function(el) {
    return el.trim();
  }).filter(function(el) {
    return el != "";
  });
}

function parseQuestionCell(row, colName, errors, parse) {
  const col = config.questions.cols[colName];
  const content = questionsSheet.getRange(row, col).getValue();
  if (!parse) return content;
  try {
    return parse(content);
  } catch(e) {
    errors.push(e);
  }
  return null;
}

function rowToJSON(row) {
  const state = parseQuestionCell(row, "state");
  if (state != config.export.validatedQuestionState) {
    return null;
  }
  
  var question = {};
  var errors = [];
  
  question.id = row;
  
  question.text = parseQuestionCell(row, "text", errors, function(content) {
    if (!content) throw "L'intitulé de la question ne peut être vide.";
    return content;
  });
  
  question.type = parseQuestionCell(row, "type", errors, function(content) {
    content = content.trim().toLowerCase();
    if (content == "choix multiple") return "multiple_choice";
    if (content == "choix unique") return "single_choice";
    if (content == "classement") return "ranking";
    if (content == "catégorisation") return "categorization";
    throw "Le type de question '" + content + "' n'est pas géré pour le moment.";
  });
  
  // TODO: manage urls
  question.references = parseQuestionCell(row, "references", errors, function(content) {
    content = parseCellWithSep(content, "\n");
    return content.map(function(line) {
      return {
        text: line,
        url: null
      };
    });
  });
  
  question.categories = parseQuestionCell(row, "categories", errors, function(content) {
    return parseCellWithSep(content, ",").map(function(word) {
      return word.toLowerCase();
    });
  });
  
  question.keywords = parseQuestionCell(row, "keywords", errors, function(content) {
    return parseCellWithSep(content, ",").map(function(word) {
      return word.toLowerCase();
    });
  });
  
  question.level = parseQuestionCell(row, "level", errors, function(content) {
    if (!content) throw "Le niveau de la question ne peut être vide.";
    return content.toLowerCase();
  });
  
  question.choices = parseQuestionCell(row, "choices", errors, function(content) {
    if (question.type == "single_choice" || question.type == "multiple_choice" || question.type == "ranking") {
      const choices = parseCellWithSep(content, "\n");
      if (choices.length < 2) throw "Il doit au moins y avoir deux choix.";
      checkUnique(choices, "les choix");
      return choices;
    }
    if (question.type == "categorization") {
      const elements = parseCellWithSep(content, "\n");
      checkUnique(elements, "les éléments");
      const categories = parseQuestionCell(row, "category_choices", errors, function(content) {
        const categories = parseCellWithSep(content, "\n");
        if (categories.length < 2) throw "Il doit au moins y avoir deux catégories.";
        checkUnique(categories, "les catégories");
        return categories;
      });
      return [elements, categories];
    }
  });
  
  question.answer = parseQuestionCell(row, "answer", errors, function(content) {
    var answer;
    if (question.type == "single_choice") {
      answer = content.trim();
      if (question.choices.indexOf(answer) == -1) throw 'La réponse "' + choice + '" n\'apparait pas dans la liste des choix.';
      return answer;
    }
    if (question.type == "multiple_choice") {
      answer = parseCellWithSep(content, "\n");
      checkUnique(answer, "la réponse");
      var choice;
      for (var i in answer) {
        choice = answer[i];
        if (question.choices.indexOf(choice) == -1) throw 'La réponse "' + choice + '" n\'apparait pas dans la liste des choix.';
      }
      return answer;
    }
    if (question.type == "ranking") {
      return question.choices;
    }
    if (question.type == "categorization") {
      answer = parseCellWithSep(content, "\n");
      const elements = question.choices[0];
      const categories = question.choices[1];
      if (elements.length != answer.length) throw "La réponse doit contenir autant de catégories qu'il y a d'éléments.";
      var cat;
      for (var i in answer) {
        cat = answer[i];
        if (categories.indexOf(cat) == -1) throw 'La réponse "' + cat + '" n\'apparait pas dans la liste des catégories.';
      }
      return answer;
    }
  });
  
  question.explanation = parseQuestionCell(row, "explanation");
  
  question.groups = (function() {;
    var groups = [], content;
    for (var group in config.questionGroups.cols) {
      content = questionsSheet.getRange(row, config.questionGroups.cols[group]).getValue();
      content = content.trim().toLowerCase();
      if (content == "oui") {
        groups.push(group);
      }
    }
    return groups;
  })();
  
  return {
    question: question,
    errors: errors
  };
}

function export() {
  updateConfig();
  
  var row;
  for (var i = 2; i < config.export.nParsedRows; i++) {
    row = rowToJSON(i);
    if (row === null) {
      questionsSheet.getRange(i, config.export.outputCol).setValue("");
      continue;
    }
    if (!row.errors.length) {
      questionsSheet.getRange(i, config.export.outputCol).setValue(
        JSON.stringify(row.question, null, 2)
      );
    }
    questionsSheet.getRange(i, config.export.errorsCol).setValue(
      row.errors.join("\n\n")
    );
  }
}
