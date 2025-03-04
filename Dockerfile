# استخدام Node.js كبيئة تشغيل
FROM node:18

# تحديد المجلد داخل الحاوية
WORKDIR /app

# نسخ ملفات الباك-إند
COPY package.json package-lock.json ./
RUN npm install

# نسخ باقي الملفات
COPY . .

# تعيين المتغيرات
ENV PORT=5000

# تشغيل التطبيق
CMD ["npm", "run", "dev"]
