var configSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Configuration");
var questionsSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Questions");
var config = null;

function readQuestionsConfig() {
  var cols = {};
  var row = 1;
  var key = configSheet.getRange(row, 1).getValue();
  while (key) {
    cols[key] = configSheet.getRange(row, 2).getValue();
    row++;
    key = configSheet.getRange(row, 1).getValue();
  }
  return { cols: cols };
}

function readQuestionGroupsConfig() {
  var cols = {};
  var row = 2;
  var groupName = configSheet.getRange(row, 5).getValue();
  while (groupName) {
    cols[groupName] = configSheet.getRange(row, 6).getValue();
    row++;
    groupName = configSheet.getRange(row, 5).getValue();
  }
  return { cols: cols };
}

function updateConfig() {
  config = {
    questions: readQuestionsConfig(),
    questionGroups: readQuestionGroupsConfig(),
    export: {
      nParsedRows: parseInt(configSheet.getRange(3, 4).getValue()),
      errorsCol: configSheet.getRange(1, 4).getValue(),
      outputCol: configSheet.getRange(2, 4).getValue(),
      validatedQuestionState: configSheet.getRange(4, 4).getValue(),
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
  const content = questionsSheet.getRange(col + row).getValue();
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
      content = questionsSheet.getRange(config.questionGroups.cols[group] + row).getValue();
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
      questionsSheet.getRange(config.export.outputCol + i).setValue(
        JSON.stringify(row.question, null, 2)
      );
    }
    questionsSheet.getRange(config.export.errorsCol + i).setValue(
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
