const { fetchAllPosts, fetchAllPages } = require('./fetcher');
const { convertToMarkdownChunks } = require('./converter');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  try {
    console.log('🚀 Starting Cast from Clay data builder with chunking...');
    
    // Ensure output directories exist
    await fs.ensureDir('./output');
    await fs.ensureDir('./output/chunks');
    
    // Fetch all posts and pages
    console.log('📡 Fetching posts from API...');
    const posts = await fetchAllPosts();
    console.log(`✅ Fetched ${posts.length} posts`);
    
    console.log('📡 Fetching pages from API...');
    const pages = await fetchAllPages();
    console.log(`✅ Fetched ${pages.length} pages`);
    
    // Combine posts and pages
    const allContent = [...posts, ...pages];
    console.log(`📊 Total content items: ${allContent.length}`);
    
    // Convert and save chunks
    console.log('📝 Converting to chunked markdown...');
    let totalChunks = 0;
    
    for (const item of allContent) {
      const chunkFiles = convertToMarkdownChunks(item, './output/chunks');
      
      // Save each chunk
      for (const { filename, content } of chunkFiles) {
        const filepath = path.join('./output/chunks', filename);
        await fs.writeFile(filepath, content, 'utf8');
        totalChunks++;
      }
      
      console.log(`✅ Processed: ${item.title?.rendered || item.id} (${chunkFiles.length} chunks)`);
    }
    
    // Generate summary
    const summary = {
      total_posts: posts.length,
      total_pages: pages.length,
      total_content: allContent.length,
      total_chunks: totalChunks,
      average_chunks_per_item: (totalChunks / allContent.length).toFixed(2),
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile('./output/processing_summary.json', JSON.stringify(summary, null, 2));
    
    console.log(`🎉 Complete! Generated ${totalChunks} chunks from ${allContent.length} items`);
    console.log(`📊 Posts: ${posts.length}, Pages: ${pages.length}`);
    console.log(`📊 Average: ${summary.average_chunks_per_item} chunks per item`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };