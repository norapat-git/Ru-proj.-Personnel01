FROM node:18-bullseye

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production --silent \
    && npm install -g pm2

COPY . .

# ===== install dependency oracle =====
RUN apt-get update && apt-get install -y \
        libaio1 \
        libnsl-dev \
        tzdata \
    && rm -rf /var/lib/apt/lists/*

# ===== move instant client =====
RUN mv instantclient_12_2 /usr/lib/instantclient

# ===== FIX DPI-1047 =====
RUN ln -s /usr/lib/instantclient/libclntsh.so.12.1 \
           /usr/lib/instantclient/libclntsh.so

ENV LD_LIBRARY_PATH=/usr/lib/instantclient
ENV ORACLE_HOME=/usr/lib/instantclient
ENV TNS_ADMIN=/usr/lib/instantclient/network/admin

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 4000

# CMD ["pm2-runtime", "start", "system_prod.config.js"]
CMD ["pm2-runtime", "start", "system_prod.config.js", "--env", "production"]