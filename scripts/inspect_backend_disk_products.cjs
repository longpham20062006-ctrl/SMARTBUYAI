const fs = require('fs');
const http = require('http');

http.get('http://localhost:8080/api/v1/products?size=500', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const list = JSON.parse(data);
    const products = list.content || list;

    // Filter products whose image exists on disk
    const onDisk = products.filter(p => {
      const img = p.images && p.images[0] ? p.images[0] : p.imageUrl;
      if (!img) return false;
      return fs.existsSync('public' + img);
    });

    console.log(`Backend products existing on disk: ${onDisk.length} / ${products.length}`);

    // Check dresses specifically
    const dresses = onDisk.filter(p => p.categorySlug === 'vay' || (p.name && p.name.toLowerCase().includes('váy')));
    console.log('\nValid dresses from backend:');
    dresses.forEach(d => {
      console.log(`[${d.id || d.sku}] ${d.name} -> ${d.images ? d.images[0] : d.imageUrl}`);
    });
  });
});

