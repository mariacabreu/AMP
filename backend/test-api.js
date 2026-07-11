const API_BASE_URL = 'https://amp-project-back.onrender.com';

async function testBackend() {
  try {
    console.log('Testing root endpoint...');
    const rootResponse = await fetch(API_BASE_URL);
    console.log('Root response status:', rootResponse.status);
    const rootData = await rootResponse.json();
    console.log('Root response data:', rootData);

    console.log('\nTesting register endpoint...');
    try {
      const registerResponse = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Test User',
          email: `test${Date.now()}@test.com`,
          password: 'test1234'
        })
      });
      console.log('Register response status:', registerResponse.status);
      const registerData = await registerResponse.json();
      console.log('Register response data:', registerData);
    } catch (err) {
      console.log('Register error:', err);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

testBackend();
