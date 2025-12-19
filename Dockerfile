FROM node:20-alpine

WORKDIR /app

# أدوات قد يحتاجها npm لبعض الحزم
RUN apk add --no-cache python3 make g++ libc6-compat

# نسخ ملفات التعريف أولًا لتحسين الكاش
COPY package.json ./

# تثبيت الحزم
RUN npm install --omit=dev

# نسخ باقي المشروع
COPY . .

# تشغيل البوت
CMD ["npm", "start"]
