var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration");
var questionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Questions");
var config = null;

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
    if (content.toLowerCase() == "choix multiple") return "multiple_choice";
    if (content.toLowerCase() == "choix unique") return "single_choice";
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
    if (question.type == "single_choice" || question.type == "multiple_choice") {
      const choices = parseCellWithSep(content, "\n");
      if (choices.length < 2) throw "Il doit au moins y avoir deux choix.";
      const uniqueChoices = choices.filter(function(item, pos) {
        return choices.indexOf(item) == pos;
      });
      if (uniqueChoices.length != choices.length) throw "Il ne peut y avoir de duplicats dans les choix.";
      return choices;
    }
  });
  
  question.answer = parseQuestionCell(row, "answer", errors, function(content) {
    var answer;
    if (question.type == "single_choice") {
      answer = content.trim();
      if (question.choices.indexOf(answer) == -1) throw "'" + answer + "' n'apparait pas dans la liste des choix.";
      return answer;
    }
    if (question.type == "multiple_choice") {
      answer = parseCellWithSep(content, "\n");
      var choice;
      for (var i in answer) {
        choice = answer[i];
        if (question.choices.indexOf(choice) == -1) throw "'" + choice + "' n'apparait pas dans la liste des choix.";
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

function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('Shifters')
      .addItem('Exporter', 'export')
      .addToUi();
}
