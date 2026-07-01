
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Automatic retry wrapper to catch 429s without crashing the script
export const callWithRetry = async (apiCall: () => Promise<any>, maxRetries = 5) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        if (error?.status === 429 && attempt < maxRetries) {
          console.log(
            `    ⚠️ Gemini Rate Limit Reached. Waiting 15 seconds... (Attempt ${
              attempt + 1
            }/${maxRetries})`
          );
          await delay(15000); // Wait 15 seconds to let the 15 RPM quota reset
        } else {
          throw error; // Throw if it's a different error or we ran out of retries
        }
      }
    }
  };