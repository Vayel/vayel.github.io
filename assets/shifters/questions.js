const Questions = (function(levelsOrder, rootUrl = "/assets/shifters/data/") {
  let cache = {
    categories: {},
    groups: {},
    keywords: {},
    levels: [],
  };

  const addCache = (key) => fetch(rootUrl + key + ".json")
    .then((response) => response.json())
    .then((json) => cache[key] = json);

  // TODO: cache?
  const fetchQuestion = (id) => fetch(rootUrl + "questions/" + id + ".json")
    .then((response) => response.json());

  const listFromIds = (ids) => {
    if (ids === null) ids = [];
    return Promise.all(ids.map(fetchQuestion));
  };

  return {
    categories: () => Object.keys(cache.categories),

    levels: () => Object.keys(cache.levels),

    groups: () => Object.keys(cache.groups),

    setup: () => Promise.all([
      addCache("categories"),
      addCache("groups"),
      addCache("levels"),
      addCache("keywords"),
    ]),

    listFromCategory: (category) => listFromIds(cache.categories[category]),

    listFromGroup: (group) => listFromIds(cache.groups[group]),
  };
})();
