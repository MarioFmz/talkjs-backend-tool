const axios = require('axios');
const jwt = require('jsonwebtoken');

// Claves de desarrollo y producción (leer de variables de entorno)
const APP_ID_DEV = process.env.TALKJS_APP_ID_DEV;
const SECRET_KEY_DEV = process.env.TALKJS_SECRET_KEY_DEV;

const APP_ID_PRO = process.env.TALKJS_APP_ID_PRO;
const SECRET_KEY_PRO = process.env.TALKJS_SECRET_KEY_PRO;

// Helper function to generate TalkJS token
function generateToken(keyType = 'dev') {
  let appId, secretKey;
  if (keyType === 'prod') {
    appId = APP_ID_PRO;
    secretKey = SECRET_KEY_PRO;
  } else {
    appId = APP_ID_DEV;
    secretKey = SECRET_KEY_DEV;
  }

  if (!appId || !secretKey) {
      console.error(`ERROR: API keys for environment ${keyType} are not configured correctly.`);
      // In a real environment, you might throw an error or handle this more gracefully
      throw new Error(`API keys not configured for ${keyType} environment.`);
  }

  return jwt.sign({ tokenType: 'app' }, secretKey, {
    issuer: appId,
    expiresIn: '30s',
  });
}

// Centralized function to make TalkJS API calls
async function callTalkJSApi(endpoint, method = 'GET', keyType = 'dev', data = null) {
  const token = generateToken(keyType);
  const appIdToUse = (keyType === 'prod') ? APP_ID_PRO : APP_ID_DEV;
  const url = `https://api.talkjs.com/v1/${appIdToUse}${endpoint}`;

  try {
    const response = await axios({
      method: method,
      url: url,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: data, // for PUT/POST requests
    });
    return response.data;
  } catch (error) {
    console.error(`Error calling TalkJS API endpoint ${endpoint} with method ${method}: ${error.message}`);
    // Re-throw the error with more context or handle specific TalkJS errors here
    throw error; 
  }
}

// --- New functions for pagination ---

// Function to fetch a single page of users
async function fetchUsersPage(limit, startingAfter = null, keyType = 'dev') {
    const token = generateToken(keyType); // Generate a new token for each request
    const appIdToUse = (keyType === 'prod') ? APP_ID_PRO : APP_ID_DEV;
    let url = `https://api.talkjs.com/v1/${appIdToUse}/users?limit=${limit}`;
    if (startingAfter) {
        url += `&startingAfter=${startingAfter}`;
    }

    console.log(`Fetching URL: ${url}`); // Log the URL for debugging

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 200) {
            const users = response.data.data; // Array of users
            console.log(`Fetched ${users.length} users.`);
            return users;
        } else {
            console.error(`Error fetching users page: Status ${response.status}, Data: ${JSON.stringify(response.data)}`);
            throw new Error(`Failed to fetch users page, status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error during fetchUsersPage:', error.message || error);
        throw error;
    }
}

// Function to fetch all users using pagination
async function fetchAllUsers(keyType = 'dev') {
    const allUsers = [];
    const limit = 100; // Max limit for users
    let startingAfter = null;
    let morePages = true;

    console.log('Starting to fetch all users with pagination...');

    while (morePages) {
        try {
            // Pass keyType to fetchUsersPage
            const currentPageUsers = await fetchUsersPage(limit, startingAfter, keyType);

            if (currentPageUsers && currentPageUsers.length > 0) {
                allUsers.push(...currentPageUsers);
                // Update startingAfter with the ID of the last user in the current page
                startingAfter = currentPageUsers[currentPageUsers.length - 1].id;
                console.log(`Collected ${allUsers.length} users so far. Next startingAfter: ${startingAfter}`);

                // If the number of users returned is less than the limit, it's the last page
                if (currentPageUsers.length < limit) {
                    morePages = false;
                    console.log('Last page fetched.');
                }
            } else {
                // No users returned, must be the last page or no users at all
                morePages = false;
                console.log('No users returned on this page. Stopping.');
            }
        } catch (error) {
            console.error('Error fetching page, stopping pagination:', error.message || error);
            morePages = false; // Stop pagination on error
        }
    }

    console.log(`Finished fetching. Total users collected: ${allUsers.length}`);
    return allUsers;
}

// Export the service function(s)
module.exports = { callTalkJSApi, fetchAllUsers }; 