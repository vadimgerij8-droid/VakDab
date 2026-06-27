export let currentTab = 'main';
export let currentPage = 1;
export let currentSearchQuery = '';
export let currentGenreSlug = null;
export let currentList = [];

export function setCurrentTab(tab) { currentTab = tab; }
export function setCurrentPage(page) { currentPage = page; }
export function setCurrentSearchQuery(query) { currentSearchQuery = query; }
export function setCurrentGenreSlug(slug) { currentGenreSlug = slug; }
export function setCurrentList(list) { currentList = list; }
