
export const parseCommentForTextarea = (rawComment: any): string => {
  if (!rawComment) return "";
  const rawString = String(rawComment);
  try {
    const parsed = JSON.parse(rawString);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed
        .map((c) => {
          if (typeof document !== "undefined") {
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = c.comment || "";
            return tempDiv.textContent || tempDiv.innerText || "";
          }
          return (c.comment || "").replace(/<[^>]+>/g, "").trim();
        })
        .join("\n\n");
    }
    
    if (typeof document !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawString;
      return tempDiv.textContent || tempDiv.innerText || "";
    }
    return rawString.replace(/<[^>]+>/g, "").trim();
  } catch {
    if (typeof document !== "undefined") {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawString;
      return tempDiv.textContent || tempDiv.innerText || "";
    }
    return rawString.replace(/<[^>]+>/g, "").trim();
  }
};

