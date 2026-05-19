import mongoose from 'mongoose';
import { PDFService } from './services/pdfService.js';
import Project from './models/Project.js';

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dpr-app';

try {
  await mongoose.connect(mongoURI);
  console.log('✓ MongoDB connected');

  // Find a project (use the first one)
  const project = await Project.findOne().lean();

  if (!project) {
    console.error('✗ No projects found in database');
    process.exit(1);
  }

  console.log(`✓ Found project: ${project.basicInfo?.businessName || project._id}`);

  // Generate PDF
  console.log('📄 Generating PDF with optimized layout...');
  const pdf = await PDFService.generateDPR(project);

  // Save to file
  const filename = `dpr-layout-test-${Date.now()}.pdf`;
  pdf.getBase64(async (base64) => {
    const fs = await import('fs');
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filename, buffer);
    console.log(`✓ PDF saved: ${filename}`);
    console.log('✓ Layout optimizations applied:');
    console.log('  • Section margins reduced [0,10,0,4] (from [0,18,0,6])');
    console.log('  • Table padding optimized 5/5/4/4 (from 8/8/6/6)');
    console.log('  • Chart width reduced to 450px (from 465px)');
    console.log('  • Font sizes reduced for dense tables (9pt → 8pt)');
    console.log('  • KPI row spacing improved');
    process.exit(0);
  });
} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}

