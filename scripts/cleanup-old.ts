import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: String,
  status: String,
});

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const Task = mongoose.model('Task', taskSchema);
  
  // Old demo tasks from original seed.ts
  const oldTitles = [
    'Build a REST API for user management',
    'Create a CLI tool for file organization', 
    'Implement OAuth2 login flow'
  ];
  
  const result = await Task.deleteMany({ title: { $in: oldTitles } });
  console.log('Deleted', result.deletedCount, 'old demo tasks');
  
  const remaining = await Task.countDocuments({ status: 'open' });
  console.log('Remaining open tasks:', remaining);
  
  await mongoose.disconnect();
}

cleanup();
