/**
 * Simple Google Identity Services helper
 */

export async function initGoogleAuth({
  containerId = "googleBtnContainer",
  endpoint = "/api/v1/users/google",
  onStart,
  onFinish,
  onSuccess,
  onError,
} = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    // 1. Fetch Client ID from public config
    const res = await fetch("/api/v1/config/public");
    const config = await res.json();
    const clientId = config?.data?.googleClientId || config?.googleClientId;

    if (!clientId) {
      throw new Error("Google Client ID not found in config");
    }

    // 2. Initialize Google Auth
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        onStart?.();
        try {
          const serverRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idToken: response.credential }),
          });

          const result = await serverRes.json();
          if (!serverRes.ok)
            throw new Error(result.message || "Google login failed");

          onSuccess?.(result.data?.user, result);
        } catch (err) {
          onError?.(err.message, err);
        } finally {
          onFinish?.();
        }
      },
      use_fedcm_for_prompt: true,
    });

    // 3. Render the standard button
    // This is much more reliable than custom buttons
    window.google.accounts.id.renderButton(container, {
      theme: "outline",
      size: "large",
      shape: "pill",
      width: container.offsetWidth || 300,
      logo_alignment: "left",
      text: "continue_with",
    });

    // Optional: Also show the One Tap prompt
    // window.google.accounts.id.prompt();
  } catch (error) {
    console.error("Google Auth Init Error:", error);
    onError?.("Failed to initialize Google Login. Please refresh.");
  }
}
