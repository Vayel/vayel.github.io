const Questions = (function(levelsOrder, rootUrl = "/assets/shifters/data/") {
  let cache = {
    categories: {},
    keywords: {},
    levels: [],
  };

  function addCache(key) {
    return fetch(rootUrl + key + ".json")
      .then((response) => response.json())
      .then((json) => cache[key] = json);
  }

  function fetchQuestion(id) {
    // TODO: cache?
    return fetch(rootUrl + "questions/" + id + ".json")
      .then((response) => response.json());
  }

  return {
    categories: () => Object.keys(cache.categories),

    levels: () => Object.keys(cache.levels),

    setup: () => Promise.all([
      addCache("categories"),
      addCache("levels"),
      addCache("keywords"),
    ]),

    listFromCategory: (category) => {
      let ids = cache.categories[category];
      if (ids === null) ids = [];
      return Promise.all(ids.map(fetchQuestion));
    },
  };
})();
