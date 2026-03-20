ARG NODE_ENV="production"
ARG NODE_VERSION="25"
ARG APP_ORIGIN="http://localhost"

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

################################################################################
# Create a stage for installing production dependencies.
FROM base as deps

COPY package.json .

RUN yarn install --production=false

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.yarn to speed up subsequent builds.
#RUN --mount=type=bind,source=package.json,#target=package.json \
#    --mount=type=bind,source=yarn.lock,#target=yarn.lock \
#    --mount=type=cache,target=/root/.yarn \
#    yarn install --frozen-lockfile

################################################################################
# Create a stage for building the application.
FROM deps as build

# Copy the rest of the source files into the image.
COPY . .

# Run the build scripts.
RUN yarn run build
RUN yarn run build.server

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
FROM base as final

# Use production node environment by default.
ENV NODE_ENV ${NODE_ENV}

# IMPORTANT: Set your actual domain for CSRF protection
ENV ORIGIN ${APP_ORIGIN}
ENV DATABASE_URL "postgresql://andacity:andacity@ec2-3-150-166-68.us-east-2.compute.amazonaws.com:5432/andacity"

# Run the application as a non-root user.
USER node

# Copy package.json so that package manager commands can be used.
COPY package.json .

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/server ./server

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["yarn", "serve"]
