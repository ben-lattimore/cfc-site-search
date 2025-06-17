const { fetchAllPosts } = require('./fetcher');
const { convertToMarkdownChunks } = require('./converter');
const fs = require('fs-extra');
const path = require('path');

async function main() {
  try {
    console.log('🚀 Starting Cast from Clay data builder with chunking...');
    
    // Ensure output directories exist
    await fs.ensureDir('./output');
    await fs.ensureDir('./output/chunks');
    
    // Fetch all posts
    console.log('📡 Fetching posts from API...');
    const posts = await fetchAllPosts();
    console.log(`✅ Fetched ${posts.length} posts`);
    
    // Convert and save chunks
    console.log('📝 Converting to chunked markdown...');
    let totalChunks = 0;
    
    for (const post of posts) {
      const chunkFiles = convertToMarkdownChunks(post, './output/chunks');
      
      // Save each chunk
      for (const { filename, content } of chunkFiles) {
        const filepath = path.join('./output/chunks', filename);
        await fs.writeFile(filepath, content, 'utf8');
        totalChunks++;
      }
      
      console.log(`✅ Processed: ${post.title?.rendered || post.id} (${chunkFiles.length} chunks)`);
    }
    
    // Generate summary
    const summary = {
      total_posts: posts.length,
      total_chunks: totalChunks,
      average_chunks_per_post: (totalChunks / posts.length).toFixed(2),
      timestamp: new Date().toISOString()
    };
    
    await fs.writeFile('./output/processing_summary.json', JSON.stringify(summary, null, 2));
    
    console.log(`🎉 Complete! Generated ${totalChunks} chunks from ${posts.length} posts`);
    console.log(`📊 Average: ${summary.average_chunks_per_post} chunks per post`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };