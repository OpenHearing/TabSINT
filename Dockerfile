FROM eclipse-temurin:17-jdk
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    unzip \
    build-essential \
    lib32z1 \
    lib32stdc++6 \
    && rm -rf /var/lib/apt/lists/*

RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt update && apt install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb
ENV CHROME_BIN=/usr/bin/google-chrome-stable

ENV NVM_DIR=/root/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
RUN echo "export NVM_DIR=\"$NVM_DIR\"" >> /root/.bashrc && \
    echo "[ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"" >> /root/.bashrc && \
    echo "[ -s \"$NVM_DIR/bash_completion\" ] && \. \"$NVM_DIR/bash_completion\"" >> /root/.bashr
ENV NODE_VERSION=v22.4.0
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use $NODE_VERSION"
ENV ANDROID_HOME=$HOME/android
ENV ANDROID_SDK_ROOT=$ANDROID_HOME
ENV PATH=${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${PATH}
RUN mkdir -p ${ANDROID_HOME}
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip /tmp/cmdline-tools.zip -d /tmp/cmdline-tools && \
    mkdir -p ${ANDROID_HOME}/cmdline-tools/latest && \
    mv /tmp/cmdline-tools/cmdline-tools/* ${ANDROID_HOME}/cmdline-tools/latest/ && \
    rm -rf /tmp/cmdline-tools.zip /tmp/cmdline-tools
RUN yes | sdkmanager --licenses
RUN sdkmanager --update && \
    sdkmanager "platforms;android-24" "build-tools;24.0.3"
WORKDIR /usr/src/app
COPY . .
RUN . "$NVM_DIR/nvm.sh" && npm install
# RUN npm run build && npx cap sync android
    
