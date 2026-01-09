# Usa una imagen ligera de Node
FROM node:18-alpine

# Crea el directorio de trabajo
WORKDIR /app

# Copia los archivos de dependencias
COPY package*.json ./

# Instala dependencias
RUN npm install --production

# Copia el resto del código del backend
COPY . .

# Expone el puerto (asegúrate que tu index.js use process.env.PORT)
EXPOSE 3000

# Comando para iniciar
CMD ["node", "src/app.js"]