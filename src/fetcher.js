const axios = require('axios');

const BASE_URL = 'https://castfromclay.co.uk/wp-json/wp/v2/posts';
const PER_PAGE = 100; // WordPress default max is 100

async function fetchPage(page = 1) {
  try {
    const response = await axios.get(BASE_URL, {
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

async function fetchAllPosts() {
  const allPosts = [];
  let currentPage = 1;
  let totalPages = 1;
  
  console.log('📄 Fetching page 1...');
  const firstPage = await fetchPage(1);
  allPosts.push(...firstPage.posts);
  totalPages = firstPage.totalPages;
  
  console.log(`📊 Found ${firstPage.totalPosts} total posts across ${totalPages} pages`);
  
  // Fetch remaining pages
  for (currentPage = 2; currentPage <= totalPages; currentPage++) {
    console.log(`📄 Fetching page ${currentPage}/${totalPages}...`);
    const pageData = await fetchPage(currentPage);
    allPosts.push(...pageData.posts);
    
    // Add delay to be respectful to the server
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return allPosts;
}

module.exports = {
  fetchAllPosts,
  fetchPage
};