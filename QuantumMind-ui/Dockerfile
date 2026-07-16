# Install dependencies only when needed
#FROM public.ecr.aws/a9h0y7b5/node16-alpine AS deps

#RUN apk add --no-cache libc6-compat

#WORKDIR /app

#COPY package.json yarn.lock ./

#RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
#FROM public.ecr.aws/a9h0y7b5/node16-alpine AS builder

#ARG API_URL

#ENV NEXT_PUBLIC_API_URL $API_URL

#WORKDIR /app

#COPY --from=deps /app/node_modules ./node_modules

#COPY . .

#RUN yarn build

# Production image, copy all the files and run next
#FROM public.ecr.aws/a9h0y7b5/node16-alpine AS runner

#WORKDIR /app

#ENV NODE_ENV production

#RUN addgroup --system --gid 1001 Engage

#RUN adduser --system --uid 1001 EngageUser

#COPY --from=builder /app/public ./public

#COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
#COPY --from=builder --chown=EngageUser:Engage /app/.next/standalone ./

#COPY --from=builder --chown=EngageUser:Engage /app/.next/static ./.next/static

#USER EngageUser

#EXPOSE 3000

#ENV PORT 3000

#######################################

# Use an official Node.js runtime as a parent image
FROM public.ecr.aws/a9h0y7b5/node16-alpine

# Set the working directory to /app
WORKDIR /app

#COPY .env .

# Copy package.json and package-lock.json to /app
COPY package*.json ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code to /app
COPY . .



# Build the application
RUN yarn build

#ENV NODE_ENV=production

# Run the application with a lightweight web server
CMD ["npm", "run", "dev"]
