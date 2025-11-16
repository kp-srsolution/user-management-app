// utils/generateUniqueId.js
export const GenerateUniqueProductIds = () => {
    const now = new Date();
  
    // Format date and time
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear()).slice(-2); // last two digits of year
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
  
    // Convert seconds + milliseconds into 3 alphabetic characters
    const seconds = now.getSeconds();
    const millis = now.getMilliseconds();
    const combined = seconds * 1000 + millis; // range ~0 to ~59999
  
    // Characters pool (A-Z, a-z = 52 chars)
    const chars = "ABCDEFGHIJKLMNOPQ";
  
    const toAlpha = (num) => {
      let str = "";
      for (let i = 0; i < 4; i++) {
        str = chars[num % chars.length] + str;
        num = Math.floor(num / chars.length);
      }
      return str;
    };
  
    const randomAlpha = toAlpha(combined);
  
    return `${randomAlpha}${year}${month}${day}${hours}${minutes}`;
  };
  