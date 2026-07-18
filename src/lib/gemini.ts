export const ai = {
  models: {
    async generateContent({ model, contents, config }: any) {
      const response = await fetch("/api/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, contents, config }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return {
        text: data.text,
        ...data.response
      };
    }
  }
};

