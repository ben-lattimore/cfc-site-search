const axios = require('axios');

const POSTS_BASE_URL = 'https://castfromclay.co.uk/wp-json/wp/v2/posts';
const PAGES_BASE_URL = 'https://castfromclay.co.uk/wp-json/wp/v2/pages';
const PER_PAGE = 100; // WordPress default max is 100

async function fetchPage(page = 1) {
  try {
    const response = await axios.get(POSTS_BASE_URL, {
      params: {
        page,
        per_page: PER_PAGE,
        _fields: 'id,date,modified,slug,status,title,content,excerpt,link'
      },
      timeout: 30000
    });
    
    return {
      posts: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalPosts: parseInt(response.headers['x-wp-total'] || '0')
    };
  } catch (error) {
    if (error.response?.status === 400 && page > 1) {
      // Likely reached the end of pages
      return { posts: [], totalPages: page - 1, totalPosts: 0 };
    }
    throw new Error(`Failed to fetch page ${page}: ${error.message}`);
  }
}

async function fetchWPPage(page = 1) {
  try {
    const response = await axios.get(PAGES_BASE_URL, {
      params: {
        page,
        per_page: PER_PAGE,
        _fields: 'id,date,modified,slug,status,title,content,excerpt,link'
      },
      timeout: 30000
    });
    
    return {
      pages: response.data,
      totalPages: parseInt(response.headers['x-wp-totalpages'] || '1'),
      totalPosts: parseInt(response.headers['x-wp-total'] || '0')
    };
  } catch (error) {
    if (error.response?.status === 400 && page > 1) {
      // Likely reached the end of pages
      return { pages: [], totalPages: page - 1, totalPosts: 0 };
    }
    throw new Error(`Failed to fetch WP page ${page}: ${error.message}`);
  }
}

async function fetchAllPosts() {
  const allPosts = [];
  let currentPage = 1;
  let totalPages = 1;
  
  console.log('📄 Fetching posts page 1...');
  const firstPage = await fetchPage(1);
  allPosts.push(...firstPage.posts);
  totalPages = firstPage.totalPages;
  
  console.log(`📊 Found ${firstPage.totalPosts} total posts across ${totalPages} pages`);
  
  // Fetch remaining pages
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    console.log(`📄 Fetching posts page ${currentPage}/${totalPages}...`);
    const pageData = await fetchPage(currentPage);
    allPosts.push(...pageData.posts);
    
    // Add delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allPosts;
}

async function fetchAllPages() {
  const allPages = [];
  let currentPage = 1;
  let totalPages = 1;
  
  console.log('📄 Fetching WP pages page 1...');
  const firstPage = await fetchWPPage(1);
  allPages.push(...firstPage.pages);
  totalPages = firstPage.totalPages;
  
  console.log(`📊 Found ${firstPage.totalPosts} total WP pages across ${totalPages} pages`);
  
  // Fetch remaining pages
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    console.log(`📄 Fetching WP pages page ${currentPage}/${totalPages}...`);
    const pageData = await fetchWPPage(currentPage);
    allPages.push(...pageData.pages);
    
    // Add delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allPages;
}

module.exports = {
  fetchAllPosts,
  fetchAllPages,
  fetchPage,
  fetchWPPage
};