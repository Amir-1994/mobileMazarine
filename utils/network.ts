export const checkInternetConnection = async (): Promise<boolean> => {
  try {
    // Simple connectivity check by trying to reach a reliable endpoint
    const response = await fetch("https://www.google.com", {
      method: "HEAD",
      cache: "no-cache",
    });
    return response.ok;
  } catch (error) {
    console.error("Error checking internet connection:", error);
    return false;
  }
};
