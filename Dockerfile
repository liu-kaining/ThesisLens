ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS deps
USER root
WORKDIR /workspace
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN npm ci

FROM ${NODE_IMAGE} AS builder
USER root
WORKDIR /workspace
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
COPY --from=deps /workspace/node_modules ./node_modules
COPY . .
RUN npm run build

FROM ${NODE_IMAGE} AS runner
USER root
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN find /app -mindepth 1 -maxdepth 1 -exec rm -rf {} +
RUN (getent group nodejs >/dev/null 2>&1 || addgroup --system --gid 1001 nodejs) \
  && (id -u nextjs >/dev/null 2>&1 || adduser --system --uid 1001 nextjs)
COPY --from=builder /workspace/public ./public
COPY --from=builder /workspace/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
