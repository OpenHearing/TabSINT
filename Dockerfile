# Start with Eclipse Temurin JDK 17 as the base image
FROM eclipse-temurin:17-jdk

# Install necessary dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    unzip \
    build-essential \
    lib32z1 \
    lib32stdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Install Google Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt update && apt install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb
ENV CHROME_BIN=/usr/bin/google-chrome-stable

# Set up NVM (Node Version Manager)
ENV NVM_DIR=/root/.nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash

# Add NVM to bash profile
RUN echo "export NVM_DIR=\"$NVM_DIR\"" >> /root/.bashrc && \
    echo "[ -s \"$NVM_DIR/nvm.sh\" ] && \. \"$NVM_DIR/nvm.sh\"" >> /root/.bashrc && \
    echo "[ -s \"$NVM_DIR/bash_completion\" ] && \. \"$NVM_DIR/bash_completion\"" >> /root/.bashrc

# Set Node.js version and install it
ENV NODE_VERSION=v22.4.0
RUN bash -c "source $NVM_DIR/nvm.sh && nvm install $NODE_VERSION && nvm use $NODE_VERSION"

# Add node and npm to PATH
ENV PATH="$NVM_DIR/versions/node/$NODE_VERSION/bin:${PATH}"

# Set up Android SDK
ENV ANDROID_HOME=$HOME/android
ENV ANDROID_SDK_ROOT=$ANDROID_HOME
ENV PATH=${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${PATH}

RUN mkdir -p ${ANDROID_HOME}
RUN wget https://dl.google.com/android/repository/commandlinetools-linux-7583922_latest.zip -O /tmp/cmdline-tools.zip && \
    unzip /tmp/cmdline-tools.zip -d /tmp/cmdline-tools && \
    mkdir -p ${ANDROID_HOME}/cmdline-tools/latest && \
    mv /tmp/cmdline-tools/cmdline-tools/* ${ANDROID_HOME}/cmdline-tools/latest/ && \
    rm -rf /tmp/cmdline-tools.zip /tmp/cmdline-tools

# Accept Android SDK licenses
RUN yes | sdkmanager --licenses

# Update SDK and install specific Android platform and build tools
RUN sdkmanager --update && \
    sdkmanager "platforms;android-24" "build-tools;24.0.3"

# Set working directory
WORKDIR /usr/src/app

# Copy project files
COPY . .

# Install npm dependencies
RUN bash -c "source $NVM_DIR/nvm.sh && npm install"

# Create an entrypoint script to ensure NVM is loaded
RUN echo '#!/bin/bash\n\
source $NVM_DIR/nvm.sh\n\
exec "$@"' > /usr/local/bin/entrypoint.sh && \
chmod +x /usr/local/bin/entrypoint.sh

# Set the entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
