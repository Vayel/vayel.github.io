Let me introduce myself on [vayel.github.io](http://vayel.github.io).

# Docs

## Add publication

Create a Markdown file in `_posts/publications` with a content such as:

```markdown
---
title: ""
categories: publications
tags: french mathematics
source: Zeste de Savoir
custom_url: https://zestedesavoir.com/tutoriels/925/introduction-au-protocole-wamp-1/
description: "Markdown description here"
---
```

## Add blog entry

### External

To mention a blog article published on another platform, create a Markdown
file in `_posts/blog` with a content such as:

```markdown
---
title: ""
categories: blog
tags: french mathematics
custom_url: https://zestedesavoir.com/tutoriels/925/introduction-au-protocole-wamp-1/
description: "Markdown description here"
---
```

### Internal

To publish a blog article on this website (i.e. for users to read the article on
this website), create a Markdown file in `_posts/blog` with a content such as:

```markdown
---
title: ""
categories: blog
tags: french mathematics
description: "Markdown description here"
---

Markdown content of the article.
```

## Run locally

```
make install # Only once
make
```
