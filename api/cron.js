export default async function handler(request, response) {
    
  try {
    // Get API URLs from environment variable (comma-separated)
    const apiUrlsEnv = process.env.API_URLS;

    if (!apiUrlsEnv) {
      throw new Error("API_URLS environment variable is not set");
    }

    // Split URLs by comma and trim whitespace
    const apiUrls = apiUrlsEnv.split(",").map((url) => url.trim());

    console.log("Cron job started at:", new Date().toISOString());
    console.log("Calling", apiUrls.length, "API(s)");

    // Call all APIs in parallel
    const results = await Promise.allSettled(
      apiUrls.map(async (url) => {
        const apiResponse = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add any additional headers if needed
            // 'Authorization': `Bearer ${process.env.API_TOKEN}`,
          },
        });
        const data = await apiResponse.json();
        return { url, status: apiResponse.status, data };
      })
    );

    // Process results
    const successResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failedResults = results
      .filter((r) => r.status === "rejected")
      .map((r, i) => ({ url: apiUrls[i], error: r.reason.message }));

    console.log("Cron job completed at:", new Date().toISOString());
    console.log("Success:", successResults.length, "Failed:", failedResults.length);

    return response.status(200).json({
      success: true,
      message: "Cron job executed",
      timestamp: new Date().toISOString(),
      totalApis: apiUrls.length,
      successCount: successResults.length,
      failedCount: failedResults.length,
      results: successResults,
      failures: failedResults,
    });
  } catch (error) {
    console.error("Cron job failed:", error);

    return response.status(500).json({
      success: false,
      message: "Cron job failed",
      error: error.message,
    });
  }
}
