const Questions = (function(levelsOrder, rootUrl = "/assets/shifters/data/") {
  let cache = {
    categories: {},
    groups: {},
    keywords: {},
    levels: {},
  };
  
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

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

    listFromConfig: (config) => {
      const levelIds = cache.levels[config.level] || [];
      const categoryIds = cache.categories[config.category] || [];
      const n = config.number || "all";
      let ids = new Immutable.Set(levelIds).intersect(categoryIds).toArray();
      if (n !== "all") {
        ids = shuffle(ids).slice(0, n);
      }
      return listFromIds(ids);
    },

    listFromGroup: (group) => listFromIds(cache.groups[group]),
  };
})();
