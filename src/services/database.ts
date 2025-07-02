
// Enhanced MySQL database service for complete VoC Analysis System
export const initializeDatabase = async () => {
  console.log('Enhanced MySQL database initialization - using feedback_db with complete schema');
  
  try {
    // Check if backend server is running
    // const response = await fetch('http://3.110.194.210:3001/api/test-connection');
    const response = await fetch('http://localhost:3001/api/test-connection');
    if (!response.ok) {
      throw new Error('Backend server not running. Please start: cd backend && npm run dev');
    }
    
    console.log('Enhanced MySQL database connection verified');
    return Promise.resolve();
  } catch (error) {
    console.error('Enhanced database initialization failed:', error);
    throw error;
  }
};

export const seedInitialData = async () => {
  console.log('Enhanced database seeding - sample data included in schema initialization');
  
  try {
    // const response = await fetch('http://3.110.194.210:3001/api/health');
    const response = await fetch('http://localhost:3001/api/health');
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    
    console.log('Enhanced database with sample data ready');
    return Promise.resolve();
  } catch (error) {
    console.error('Enhanced database seeding failed:', error);
    throw error;
  }
};
